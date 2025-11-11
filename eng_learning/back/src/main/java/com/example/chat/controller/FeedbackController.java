package com.example.chat.controller;

import com.example.chat.dto.feedback.DetailDto;
import com.example.chat.dto.feedback.ReportSummaryDto;
import com.example.chat.service.FeedbackQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.ArrayList;
import java.time.OffsetDateTime;

//피드백 보고서
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackQueryService queryService;
    private final FeedbackService feedbackService;

    // 1단계 조회 :  날짜 목록 통해서
    @GetMapping("/report-dates")
    public ResponseEntity<List<String>> getReportDates(@AuthenticationPrincipal Object principal) {
        Long userId = extractUserId(principal);
        return ResponseEntity.ok(queryService.getReportDates(userId));
    }

    // 선택한 날짜 feedbackdetail 띄우기
    @GetMapping("/reports")
    public ResponseEntity<List<ReportSummaryDto>> getReportsByDate(@AuthenticationPrincipal Object principal,
                                                                   @RequestParam("date") String date) {
        Long userId = extractUserId(principal);
        return ResponseEntity.ok(queryService.getReportsByDate(userId, date));
    }

    // 리포트별 디테일 목록
    @GetMapping("/details")
    public ResponseEntity<List<DetailDto>> getDetails(@AuthenticationPrincipal Object principal,
                                                      @RequestParam("reportId") Long reportId) {
        Long userId = extractUserId(principal);
        return ResponseEntity.ok(queryService.getDetailsByReportId(userId, reportId));
    }

    //
    private Long extractUserId(Object principal) {
        // 예: return ((UserPrincipal) principal).getId();
        return 1L; // 임시
    }
    @PostMapping("/detail")
    public ResponseEntity<Long> addDetail(@AuthenticationPrincipal Object principal,
                                          @RequestBody AddDetailRequest req) {
        Long userId = extractUserId(principal);
        // 텍스트 채팅이면 conv는 null로 고정
        FeedbackDetail saved = feedbackService.addDetail(
                userId, req.getSessionId(),
                req.getUserMessage(),
                req.getGrammarFeedback(), req.getVocabularyFeedback(), null,
                req.getScore(), req.getLevel(),
                req.getCategories()
        );
        return ResponseEntity.ok(saved.getId());
    }

    @PostMapping("/finalize")
    public ResponseEntity<?> finalizeSession(
            @AuthenticationPrincipal User user,
            @RequestBody FinalizeRequest req
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (req.getSessionId() == null || req.getSessionId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }

        var reportIdOpt = feedbackService.finalizeSessionAndCreateReport(req.getSessionId(), user.getId());

        // 채팅 내역에 피드백 detail이 하나도 생성 안됐으면
        if (reportIdOpt.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        // 생성 됐으면
        return ResponseEntity.ok(Map.of(
                "reportId", reportIdOpt.get(),
                "message", "Report created"
        ));
    }
}