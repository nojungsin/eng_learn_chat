package eng.service;

import eng.domain.FeedbackDetail;
import eng.domain.FeedbackReport;
import eng.dto.feedback.DetailDto;
import eng.dto.feedback.ReportSummaryDto;
import eng.repository.FeedbackDetailRepository;
import eng.repository.FeedbackReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackReportRepository reportRepo;
    private final FeedbackDetailRepository detailRepo;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<ReportSummaryDto> listReports(Long userId) {
        List<FeedbackReport> reports = reportRepo.findByUserIdOrderByDateDesc(userId);
        return reports.stream()
                .map(r -> new ReportSummaryDto(
                        r.getReportId(),
                        r.getDate() != null ? r.getDate().format(DTF) : null,
                        r.getTopic(),
                        r.getAvgGrammar(),
                        r.getAvgVocabulary(),
                        r.getAvgConversation()
                ))
                .toList();
    }

    public List<DetailDto> listDetailsByReport(Long userId, Long reportId) {
        // 소유자 검증 (보고서가 유저 소유인지)
        FeedbackReport report = reportRepo.findByReportIdAndUserId(reportId, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 보고서가 없거나 권한이 없습니다."));

        List<FeedbackDetail> rows = detailRepo.findAllByReportIdAndUserId(report.getReportId(), userId);
        return rows.stream().map(this::toDto).toList();
    }

    private int toIntScore(Integer s) {
        return (s == null) ? 0 : (int) Math.round(s);
    }

    private String toLevel(Integer s) {
        double v = (s == null) ? 0.0 : s;
        if (v >= 85) return "excellent";
        if (v >= 70) return "good";
        return "needs-work";
    }

    private DetailDto toDto(FeedbackDetail d) {
        return DetailDto.builder()
                .detailid(d.getDetailid())
                .userId(d.getUserId())
                .reportId(d.getReportId())
                .userMessage(d.getUserMessage())
                .grammarFeedback(d.getGrammarFeedback())
                .vocabularyFeedback(d.getVocabularyFeedback())
                .conversationFeedback(d.getConversationFeedback())
                .score(d.getScore())
                .level(d.getLevel())
                .categories(
                        d.getCategories() == null ? new HashSet<>() : d.getCategories()
                )
                .build();
    }
}
