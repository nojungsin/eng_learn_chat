package com.example.chat.repository;

import com.example.chat.domain.FeedbackReport;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.*;

public interface FeedbackReportRepository extends JpaRepository<FeedbackReport, Long> {

    // 로그인 사용자(userId)의 리포트가 존재하는 날짜 목록(내림차순)
    @Query("select distinct r.date from FeedbackReport r where r.userId = :userId order by r.date desc")
    List<LocalDate> findDistinctDatesByUserId(@Param("userId") Long userId);

    // 특정 날짜의 리포트들(동일 날짜에 여러 세션/토픽이 있을 수 있음)
    List<FeedbackReport> findByUserIdAndDateOrderByIdAsc(Long userId, LocalDate date);

    // 소유권 검증용
    Optional<FeedbackReport> findByIdAndUserId(Long id, Long userId);
}
