package com.example.chat.domain;
import java.util.Set;
import java.util.HashSet;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

import com.example.chat.domain.FeedbackCategory;
import lombok.Builder; // 이미 있다면 OK

import jakarta.persistence.*;
import lombok.*;

//피드백 보고서 날짜 선택하면 뜨는 거 entity
@Entity
@Table(name = "feedback_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    private Double score;               // 점수
    private String level;               // 점수 기반 평가

    // 메시지가 어떤 종류의 피드백을 받았는지(복수)
    @ElementCollection(targetClass = FeedbackCategory.class)
    @CollectionTable(name = "feedback_detail_categories",
            joinColumns = @JoinColumn(name = "detail_id"))
    @Column(name = "category")
    @Enumerated(EnumType.STRING)
    private Set<FeedbackCategory> categories = new HashSet<>();
}
