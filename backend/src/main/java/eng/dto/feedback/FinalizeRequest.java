package eng.dto.feedback;

import eng.domain.FeedbackCategory;
import lombok.*;

import java.util.Set;

@Getter @Setter
public class FinalizeRequest {
    private String sessionId;
    private String topic; // 선택
}