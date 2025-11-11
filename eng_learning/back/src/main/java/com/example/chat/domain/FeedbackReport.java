package com.example.chat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "feedback_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private LocalDate date;     // yyyy-MM-dd 출력용
    private String topic;//주제

    private Double avgGrammar;      // 해당 카테고리에 속한 메시지들의 score 평균
    private Double avgVocabulary;
    private Double avgConversation; // 텍스트 채팅에선 null
}

