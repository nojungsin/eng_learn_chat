package com.example.chat.repository;

import com.example.chat.domain.FeedbackDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackDetailRepository extends JpaRepository<FeedbackDetail, Long> {

    long countBySessionId(String sessionId);
    boolean existsBySessionId(String sessionId);

    // 사용자까지 엮고 싶으면 아래 시그니처로 사용
    long countBySessionIdAndUserId(String sessionId, Long userId);
    boolean existsBySessionIdAndUserId(String sessionId, Long userId);
    // 채팅 중 임시 저장(리포트 미귀속)
    List<FeedbackDetail> findByUserIdAndSessionIdAndReportIdIsNull(Long userId, String sessionId);

    // 리포트에 귀속된 디테일
    List<FeedbackDetail> findByReportIdOrderByIdAsc(Long reportId);
}
