// dto/feedback/SaveSessionRequest.java
package com.example.chat.dto.feedback;

import com.example.chat.domain.FeedbackDetail.Level;
import com.example.chat.domain.FeedbackDetail.Modality;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SaveSessionRequest {
    private String date;          // "YYYY-MM-DD"
    private String topic;

    // 학습 분석용 평균 (피드백 화면에서 사용 X) — null 가능
    private Integer avgGrammar;
    private Integer avgVocabulary;
    private Integer avgConversation;

    // 턴 목록
    private List<TurnDto> turns;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TurnDto {
        private Integer turnNo;
        private String userMessage;
        private String aiReply;
        private String grammarFeedback;
        private String vocabularyFeedback;
        private String conversationFeedback; // VOICE에서만 채움, TEXT면 null/빈문자
        private String suggestion;
        private Integer score;               // 0~100
        private Level level;                 // PERFECT/NEUTRAL/NEEDS
        private Modality modality;           // TEXT or VOICE
    }
}
