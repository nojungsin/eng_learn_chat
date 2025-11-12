// src/main/java/eng/controller/FeedbackQueryController.java
package eng.controller;

import eng.dto.feedback.DetailDto;
import eng.dto.feedback.ReportDateDto;
import eng.service.FeedbackQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 조회 전용 컨트롤러 (등록/수정/집계 로직은 다른 Controller/Service에 두고)
 * - GET /api/feedback/report-dates?userId=xxx
 * - GET /api/feedback/reports/{reportId}/details?userId=xxx
 */
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackQueryController {

    private final FeedbackQueryService service;

    /** [Step 1] 현재 로그인 사용자(userId)의 Report 목록(날짜만 표시용) */
    @GetMapping("/report-dates")
    public ResponseEntity<List<ReportDateDto>> listReportDates(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(service.listReportDatesByUser(userId));
    }

    /** [Step 2] 선택한 날짜의 reportId로 상세 조회 (userId+reportId 강제) */
    @GetMapping("/reports/{reportId}/details")
    public ResponseEntity<List<DetailDto>> listDetails(
            @PathVariable Long reportId,
            @RequestParam("userId") Long userId
    ) {
        return ResponseEntity.ok(service.listDetailsByReport(userId, reportId));
    }
}