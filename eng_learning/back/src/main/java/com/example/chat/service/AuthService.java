package com.example.chat.service;

import com.example.chat.domain.User;
import com.example.chat.dto.RegisterRequest;
import com.example.chat.dto.RegisterResponse;
import com.example.chat.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원가입 핵심 로직:
 * 1) 패스워드 일치 확인
 * 2) 아이디 중복 확인
 * 3) Bcrypt로 비밀번호 해시
 * 4) users 테이블에 저장
 */
@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        if (!req.password.equals(req.confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        if (users.existsByUsername(req.username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (users.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User u = new User();
        u.setUsername(req.username);
        u.setEmail(req.email);
        u.setPasswordHash(encoder.encode(req.password)); // 해시 저장

        users.save(u);

        RegisterResponse res = new RegisterResponse();
        res.id = u.getId();
        res.username = u.getUsername();
        res.email = u.getEmail();
        return res;
    }

}
