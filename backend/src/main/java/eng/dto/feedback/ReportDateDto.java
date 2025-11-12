package eng.dto.feedback;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReportDateDto {
    private Long reportId;
    private String date;   // yyyy-MM-dd
}