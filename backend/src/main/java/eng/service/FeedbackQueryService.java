// src/main/java/eng/service/FeedbackQueryService.java
package eng.service;

import eng.domain.FeedbackDetail;
import eng.domain.FeedbackCategory;
import eng.dto.feedback.DetailDto;
import eng.dto.feedback.ReportDateDto;
import eng.repository.FeedbackDetailRepository;
import eng.repository.FeedbackReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackQueryService {

    private final FeedbackReportRepository reportRepo;
    private final FeedbackDetailRepository detailRepo;

    // 날짜를 yyyy-MM-dd 형식으로 포맷하기 위한 상수
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    /** [Step 1]
     *  특정 userId로 보고서(Report) 목록을 날짜 기준 내림차순으로 조회.
     *  → ReportDateDto(리포트 ID, 날짜) 리스트를 반환.
     *  프론트엔드에서 "사용자별 리포트 목록" 보여줄 때 사용.
     */
    public List<ReportDateDto> listReportDatesByUser(Long userId) {
        var reports = reportRepo.findByUserIdOrderByDateDesc(userId);
        return reports.stream()
                .map(r -> new ReportDateDto(r.getReportId(), r.getDate().format(DATE_FMT)))
                .toList();
    }

    /** [Step 2]
     *  (userId, reportId)에 해당하는 피드백 디테일(FeedbackDetail)들을 전부 불러와서
     *  → DetailDto로 변환 후 프론트로 전달.
     *  즉, 사용자가 특정 보고서를 클릭했을 때 “세부 피드백 내역”을 보여주는 역할.
     */
    public List<DetailDto> listDetailsByReport(Long userId, Long reportId) {
        var report = reportRepo.findByReportIdAndUserId(reportId, userId)
                .orElseThrow(() -> new NoSuchElementException("Report not found for user"));

        String dateStr = report.getDate().toString();

        List<FeedbackDetail> rows = detailRepo.findAllByReportIdAndUserId(reportId, userId);

        return rows.stream()
                .map(d -> toDto(d, dateStr))   // 각 FeedbackDetail → DetailDto로 변환
                .collect(Collectors.toList());
    }

    /** [핵심 변환 메서드]
     *  DB 엔티티 FeedbackDetail → 프론트용 DTO로 변환.
     *  level이 null이면 score값 기준으로 자동 등급 매김.
     */
    private DetailDto toDto(FeedbackDetail d, String dateStr) {
        return DetailDto.builder()
                .detailid(d.getDetailid())
                .reportId(d.getReportId())
                .userId(d.getUserId())
                .userMessage(d.getUserMessage())
                .categories(d.getCategories() == null ? Collections.emptySet() : d.getCategories())
                .grammarFeedback(d.getGrammarFeedback())
                .vocabularyFeedback(d.getVocabularyFeedback())
                .conversationFeedback(d.getConversationFeedback())
                .score(toIntScore(d.getScore())) // Double → int 변환
                .level(d.getLevel() != null ? d.getLevel() : toLevel(d.getScore()))
                .date(dateStr)
                .build();
    }

    /** Double → int 변환 유틸
     *  DB 필드 타입이 Double인 경우를 대비해서 남겨둔 변환기.
     *  현재 FeedbackDetail.score가 int라면 그냥 intValue() 써도 됨.
     */
    private int toIntScore(Integer s) {
        if (s == null) return 0;
        return (int) Math.round(s);
    }

    /**점수(Double)에 따라 레벨 자동 계산
     *  FeedbackDetail.level이 null이면 여기서 자동으로 등급을 산출.
     */
    private String toLevel(Integer s) {
        if (s == null) return "good";
        double v = s;
        if (v >= 85) return "excellent";
        if (v >= 70) return "good";
        return "needs-work";
    }
}
