package com.example.chat.dto.feedback;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TurnDetailDto {
    private Integer turnNo;
    private String userMessage;
    private String aiReply;
    private String grammarFeedback;
    private String vocabularyFeedback;
    private String conversationFeedback;
    private String suggestion;
    private Double score;
    private String level;
    private String modality;
}
