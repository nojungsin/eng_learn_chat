package com.example.chat.service;

import com.example.chat.domain.FeedbackCategory;
import com.example.chat.domain.FeedbackReport;
import com.example.chat.dto.feedback.DetailDto;
import com.example.chat.dto.feedback.ReportSummaryDto;
import com.example.chat.repository.FeedbackDetailRepository;
import com.example.chat.repository.FeedbackReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FeedbackQueryService {

    private final FeedbackReportRepository reportRepo;
    private final FeedbackDetailRepository detailRepo;

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_DATE;

    // A. 내 리포트가 있는 날짜 목록
    public List<String> getReportDates(Long userId) {
        return reportRepo.findDistinctDatesByUserId(userId).stream()
                .map(d -> d.format(ISO))
                .toList();
    }

    // B. 날짜별 리포트 목록
    public List<ReportSummaryDto> getReportsByDate(Long userId, String yyyyMMdd) {
        LocalDate date = LocalDate.parse(yyyyMMdd);
        return reportRepo.findByUserIdAndDateOrderByIdAsc(userId, date).stream()
                .map(r -> ReportSummaryDto.builder()
                        .id(r.getId())
                        .date(r.getDate().format(ISO))
                        .topic(r.getTopic())
                        .avgGrammar(r.getAvgGrammar())
                        .avgVocabulary(r.getAvgVocabulary())
                        .avgConversation(r.getAvgConversation())
                        .build())
                .toList();
    }

    // C. 리포트별 디테일 목록
    public List<DetailDto> getDetailsByReportId(Long userId, Long reportId) {
        FeedbackReport report = reportRepo.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        return detailRepo.findByReportIdOrderByIdAsc(reportId).stream()
                .map(d -> DetailDto.builder()
                        .topics(toTopicStrings(d.getCategories()))
                        .feedback(joinFeedback(d.getGrammarFeedback(), d.getVocabularyFeedback(), d.getConversationFeedback()))
                        .score(d.getScore())
                        .level(d.getLevel())
                        .date(report.getDate().format(ISO))
                        .build())
                .toList();
    }

    private List<String> toTopicStrings(Set<FeedbackCategory> cats) {
        if (cats == null || cats.isEmpty()) return List.of("Grammar");
        List<String> out = new ArrayList<>();
        if (cats.contains(FeedbackCategory.GRAMMAR)) out.add("Grammar");
        if (cats.contains(FeedbackCategory.VOCABULARY)) out.add("Vocabulary");
        if (cats.contains(FeedbackCategory.CONVERSATION)) out.add("Conversation");
        return out;
    }

    private String joinFeedback(String grammar, String vocab, String conv) {
        List<String> parts = new ArrayList<>();
        if (grammar != null && !grammar.isBlank()) parts.add(grammar);
        if (vocab != null && !vocab.isBlank()) parts.add(vocab);
        if (conv != null && !conv.isBlank()) parts.add(conv);
        return String.join("\n", parts);
    }
}
