package com.example.chat.service;

import com.example.chat.domain.User;
import com.example.chat.dto.RegisterRequest;
import com.example.chat.dto.LoginRequest;
import com.example.chat.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.chat.config.JwtTokenProvider;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider; // ✅ 스프링이 자동으로 주입
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // 이메일 형식 정규식
    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    // ✅ 생성자 따로 필요 없음 (Lombok이 자동 생성)

    // 회원가입
    public String register(RegisterRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank()
                || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()
                || req.getConfirmPassword() == null || req.getConfirmPassword().isBlank()) {
            return "모든 필드를 입력해주세요.";
        }

        if (!EMAIL_REGEX.matcher(req.getEmail()).matches()) {
            return "올바른 이메일 형식이 아닙니다.";
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            return "비밀번호가 일치하지 않습니다.";
        }

        if (userRepository.existsByUsername(req.getUsername())) {
            return "이미 존재하는 사용자명입니다.";
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            return "이미 사용 중인 이메일입니다.";
        }

        String hash = encoder.encode(req.getPassword());

        User u = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(hash)
                .build();

        userRepository.save(u);
        return null; // 성공
    }

    // 로그인 (email 기반)
    public String login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            return "이메일과 비밀번호를 입력해주세요.";
        }

        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            return "존재하지 않는 이메일입니다.";
        }

        User user = userOpt.get();
        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            return "비밀번호가 틀립니다.";
        }

        // ✅ JWT 토큰 생성 (0.13.0 문법 기준 JwtTokenProvider)
        return jwtTokenProvider.createToken(user.getEmail(), "USER");
    }
}
