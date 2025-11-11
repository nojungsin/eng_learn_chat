package com.example.chat.dto.feedback;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportSummaryDto {
    private Long id;             // report id
    private String date;         // "yyyy-MM-dd"
    private String topic;        // 주제
    private Double avgGrammar;   // null이면 프론트에서 "-" 처리
    private Double avgVocabulary;
    private Double avgConversation;
}
