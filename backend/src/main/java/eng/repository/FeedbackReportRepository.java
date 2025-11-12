package eng.repository;

import eng.domain.FeedbackReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FeedbackReportRepository extends JpaRepository<FeedbackReport, Long> {
    List<FeedbackReport> findByUserIdOrderByDateDesc(Long userId);
    Optional<FeedbackReport> findByUserIdAndDate(Long userId, LocalDate date);
    Optional<FeedbackReport> findByReportIdAndUserId(Long reportId, Long userId);
}