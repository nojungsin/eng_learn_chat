package com.example.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 비밀번호 해시를 위한 PasswordEncoder 빈 등록.
 * 스프링 시큐리티 전체 설정을 다 하지 않아도, 이 빈만 있으면
 * 서비스에서 encoder.encode(...)로 해시 가능.
 */
@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
