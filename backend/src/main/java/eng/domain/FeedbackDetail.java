package eng.domain;
import java.util.Set;
import java.util.HashSet;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

import eng.domain.FeedbackCategory;
import lombok.Builder; // 이미 있다면 OK

import jakarta.persistence.*;
import lombok.*;

//피드백 보고서 날짜 선택하면 뜨는 거 entity
@Entity
@Table(name = "feedbackdetail")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detailid;

    private Long userId;                // 작성자
    private String sessionId;           // 채팅 세션 식별자(종료 전까지 임시 그룹핑)
    private Long reportId;              // 종료 후 FeedbackReport와 연결

    @Column(columnDefinition = "text")
    private String userMessage;         // 사용자가 보낸 원문

    @Column(columnDefinition = "text")
    private String grammarFeedback;     // 없으면 null
    @Column(columnDefinition = "text")
    private String vocabularyFeedback;  // 없으면 null
    @Column(columnDefinition = "text")
    private String conversationFeedback;// 텍스트 채팅에선 null

    private int score;               // 점수
    private String level;               // 점수 기반 평가

    // 메시지가 어떤 종류의 피드백을 받았는지(복수)
    @ElementCollection(targetClass = FeedbackCategory.class)
    @CollectionTable(name = "feedback_detail_categories",
            joinColumns = @JoinColumn(name = "detailid"))
    @Column(name = "category")
    @Enumerated(EnumType.STRING)
    @Builder.Default          //빌더가 이 초기값을 유지(값 안 넣으면 빈 Set)
    private Set<FeedbackCategory> categories = new HashSet<>();//아무것도 없는 빈 set인 경우도 허용하기
}