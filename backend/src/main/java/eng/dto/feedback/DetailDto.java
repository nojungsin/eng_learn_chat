package eng.dto.feedback;

import eng.domain.FeedbackCategory;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder

//피드백 보고서 세부 내용 객체 조회용
public class DetailDto {
    private Long detailid;
    private Long reportId;
    private Long userId;
    private String userMessage; //사용자 메시지
    private Set<FeedbackCategory> categories; // ["Grammar","Vocabulary","Conversation"] 중 복수
    private String grammarFeedback;
    private String vocabularyFeedback;
    private String conversationFeedback;
    private int score;           // 0~100 (Double → int 반올림)
    private String level;        // "excellent"|"good"|"needs-work"
    private String date;         // yyyy-MM-dd (report 기준)
}