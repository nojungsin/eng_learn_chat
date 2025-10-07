package com.example.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // ✅ CSRF 비활성화 (React POST 허용)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll() // ✅ 회원가입/로그인 허용
                        .anyRequest().authenticated()
                )
                .formLogin(login -> login.disable())  // ✅ 기본 로그인창 비활성화
                .httpBasic(basic -> basic.disable()); // ✅ 브라우저 기본 인증창 비활성화
        return http.build();
    }
}
