package eng.controller;

import eng.dto.*;
import eng.dto.feedback.*;
import eng.security.CurrentUserIdResolver;
import eng.service.FeedbackQueryService;
import eng.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    /** 현재 사용자 보고서 목록(=날짜 목록) */
    @GetMapping("/reports")
    public ResponseEntity<List<ReportSummaryDto>> listReports(
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader
    ) {
        Long userId = CurrentUserIdResolver.fromSecurityContext().orElse(userIdHeader);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(feedbackService.listReports(userId));
    }

    /** 선택 날짜의 상세: reportId 기준, userId는 서버에서 검증 */
    @GetMapping("/details")
    public ResponseEntity<List<DetailDto>> listDetailsByReport(
            @RequestParam("reportId") Long reportId,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader
    ) {
        Long userId = CurrentUserIdResolver.fromSecurityContext().orElse(userIdHeader);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(feedbackService.listDetailsByReport(userId, reportId));
    }
}

