package eng.repository;

import eng.domain.FeedbackDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackDetailRepository extends JpaRepository<FeedbackDetail, Long> {
    List<FeedbackDetail> findAllByReportIdAndUserId(Long reportId, Long userId);
}