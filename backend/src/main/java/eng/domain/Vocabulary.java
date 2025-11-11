package eng.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "vocabulary")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Vocabulary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocaid")
    private Long vocaid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String word;

    @Column(nullable = false, length = 255)
    private String kmeaning;

    @Column(columnDefinition = "text")
    private String example;

    @Builder.Default // ← 필드에 붙여야 함
    @Column(name = "known", nullable = false)
    private boolean known = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
