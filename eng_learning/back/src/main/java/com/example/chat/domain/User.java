package com.example.chat.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

/**
 * users 테이블의 구조를 정의하는 JPA 엔티티.
 * 앱 실행 시 ddl-auto=update 설정 덕분에 자동으로 테이블이 생성/수정됨.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_username", columnList = "username", unique = true),
        @Index(name = "idx_users_email", columnList = "email", unique = true)
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;   // 새로 추가된 필드

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // --- getter/setter ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }        // ★ 추가
    public void setEmail(String email) { this.email = email; }  // ★ 추가

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
