package com.example.chat.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // JWT 비밀키를 주입
    @Value("${jwt.secret}")
    private String secretKey;

    // 토큰 유효기간 (1시간)
    private final long validityInMilliseconds = 60 * 60 * 1000;

    // 토큰 생성
    public String createToken(String email, String role) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .subject(email)               // subject로 이메일 저장
                .claim("role", role)           // 추가 클레임 (권한 등)
                .issuedAt(now)                 // 발급 시간
                .expiration(expiry)            // 만료 시간
                .signWith(key)                 // 서명 키 지정
                .compact();
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

            // 서명 검증 및 파싱
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // 서명 위조, 만료 등 모든 JWT 예외 처리
            return false;
        }
    }

    // 이메일 추출 (subject)
    public String getEmail(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject(); // subject에 저장된 이메일 반환
    }

    // 호환용 이메일 추출
    public String getEmailFromToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }
}
