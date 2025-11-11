package com.example.chat.service;

import com.example.chat.domain.*;
import com.example.chat.repository.FeedbackDetailRepository;
import com.example.chat.repository.FeedbackReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackDetailRepository detailRepo;
    private final FeedbackReportRepository reportRepo;
    private final UserRepository userRepo;

    @Transactional
    public FeedbackDetail addDetail(Long userId, String sessionId,
                                    String userMessage,
                                    String grammarFeedback, String vocabularyFeedback, String conversationFeedback,
                                    Double score, String level,
                                    Set<FeedbackCategory> categories) {

        FeedbackDetail d = new FeedbackDetail();
        d.setUserId(userId);
        d.setSessionId(sessionId);
        d.setReportId(null); // 임시
        d.setUserMessage(userMessage);
        d.setGrammarFeedback(grammarFeedback);
        d.setVocabularyFeedback(vocabularyFeedback);
        d.setConversationFeedback(conversationFeedback); // 텍스트 채팅이면 null로 호출
        d.setScore(score);
        d.setLevel(level);
        d.setCategories(categories != null ? categories : new HashSet<>());

        return detailRepo.save(d);
    }

    @Transactional
    public Long finalizeReport(Long userId, String sessionId, String topic) {
        List<FeedbackDetail> drafts = detailRepo.findByUserIdAndSessionIdAndReportIdIsNull(userId, sessionId);

        FeedbackReport report = new FeedbackReport();
        report.setUserId(userId);
        report.setDate(LocalDate.now(ZoneId.of("Asia/Seoul")));
        report.setTopic(topic);

        // 평균 계산
        report.setAvgGrammar(avgFor(drafts, FeedbackCategory.GRAMMAR));
        report.setAvgVocabulary(avgFor(drafts, FeedbackCategory.VOCABULARY));
        report.setAvgConversation(null); // 텍스트 채팅

        report = reportRepo.save(report);

        Long reportId = report.getId();
        drafts.forEach(d -> d.setReportId(reportId));
        if (!drafts.isEmpty()) detailRepo.saveAll(drafts);

        return reportId;
    }

    private Double avgFor(List<FeedbackDetail> details, FeedbackCategory cat) {
        return details.stream()
                .filter(d -> d.getCategories() != null && d.getCategories().contains(cat))
                .map(FeedbackDetail::getScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .isPresent()
                ? details.stream()
                .filter(d -> d.getCategories() != null && d.getCategories().contains(cat))
                .map(FeedbackDetail::getScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .getAsDouble()
                : null;
    }

    @Transactional
    public Optional<Long> finalizeSessionAndCreateReport(String sessionId, Long userId) {
        // 1) 상세가 하나도 없으면 스킵
        boolean hasAnyDetail = detailRepo.existsBySessionIdAndUserId(sessionId, userId);
        if (!hasAnyDetail) {
            return Optional.empty(); // ← "생성 안 함"
        }

        // 2) 집계 (예: 평균 점수, 카테고리 합집합 등)
        List<FeedbackDetail> details = detailRepo.findAll(
                (root, q, cb) -> cb.and(
                        cb.equal(root.get("sessionId"), sessionId),
                        cb.equal(root.get("user").get("id"), userId)
                )
        );

        double avgScore = details.stream()
                .mapToInt(FeedbackDetail::getScore) // int/Integer 타입에 맞게
                .average().orElse(0.0);

        // 세션 전체 카테고리 집합
        Set<FeedbackCategory> unionCats = details.stream()
                .flatMap(d -> d.getCategories().stream()) // @ElementCollection 또는 조인 컬럼일 때
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(FeedbackCategory.class)));

        // 3) 리포트 생성/저장
        FeedbackReport report = new FeedbackReport();
        report.setSessionId(sessionId);
        report.setUser(userRepo.getReferenceById(userId));
        report.setAverageScore((int)Math.round(avgScore));
        report.setCategories(new ArrayList<>(unionCats)); // 또는 @ElementCollection
        report.setCreatedAt(OffsetDateTime.now());

        reportRepo.save(report);
        return Optional.of(report.getId());
    }
}
