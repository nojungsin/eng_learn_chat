package eng.dto.feedback;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class FeedbackItemDto {
    private List<String> categories;    // ["Grammar","Vocabulary"] 등 (enum을 String으로 내보내도 OK)
    private String feedback;        // 코멘트
    private int score;              // 0~100
    private String level;           // "excellent" | "good" | "needs-work"
    private String date;            // yyyy-MM-dd
}
