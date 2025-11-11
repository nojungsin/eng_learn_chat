package eng.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * users 테이블의 구조를 정의하는 JPA 엔티티.
 * 앱 실행 시 ddl-auto=update 설정 덕분에 자동으로 테이블이 생성/수정됨.
 */
@Entity @Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email")
        }
)

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable=false, length=200)
    private String passwordHash;
}
