package eng.dto.feedback;

import eng.domain.FeedbackCategory;
import lombok.*;
import java.util.Set;

@Getter @Setter
public class SaveDetailRequest {
    private String sessionId;
    private String userMessage;
    private String grammarFeedback;     // 없으면 null
    private String vocabularyFeedback;  // 없으면 null
    private String conversationFeedback;// 텍스트 채팅에선 null
    private int score;               // 0~100
    private String level;               // 'perfect'|'neutral'|'needs' 등 문자열
    private Set<FeedbackCategory> categories; // 비어있을 수 있음
}
