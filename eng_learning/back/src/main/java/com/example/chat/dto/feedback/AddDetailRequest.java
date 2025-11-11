import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.ArrayList;
import java.time.OffsetDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@Getter @Setter
public class AddDetailRequest {
    private String sessionId;
    private String userMessage;
    private String grammarFeedback;     // 없으면 null
    private String vocabularyFeedback;  // 없으면 null
    private Double score;
    private String level;
    private Set<FeedbackCategory> categories; // 예: ["GRAMMAR","VOCABULARY"]
}
