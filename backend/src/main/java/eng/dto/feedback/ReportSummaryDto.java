package eng.dto.feedback;

import eng.domain.FeedbackCategory;
import lombok.*;
import java.time.LocalDate;
import java.util.Set;

@Data
@AllArgsConstructor
public class ReportSummaryDto {
    private Long reportId;
    private String date;          // yyyy-MM-dd
    private String topic;         // nullable
    private Double avgGrammar;    // nullable
    private Double avgVocabulary; // nullable
    private Double avgConversation; // nullable
}