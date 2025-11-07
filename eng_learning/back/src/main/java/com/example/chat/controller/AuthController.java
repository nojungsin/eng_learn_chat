// controller/AuthController.java
package com.example.chat.controller;

import com.example.chat.config.JwtTokenProvider;
import com.example.chat.domain.User;
import com.example.chat.dto.*;
import com.example.chat.repository.UserRepository;
import com.example.chat.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin // 프런트 분리 시 CORS 허용
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest req) {
        String err = authService.register(req);
        if (err == null) {
            return ResponseEntity.ok(new ApiResponse(true, "회원가입이 완료되었습니다."));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(false, err));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        LoginResponse res = authService.login(req);

        // success가 false면 400(Bad Request)으로 내려줌
        if (!res.isSuccess()) {
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Authorization 헤더가 없거나 형식이 올바르지 않습니다."));
        }
        String token = authHeader.substring(7); // "Bearer " 제거

        try {
            // JwtTokenProvider에서 email(subject 또는 custom claim) 꺼내오기
            String email = jwtTokenProvider.getEmailFromToken(token);

            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(new ApiResponse(false, "사용자를 찾을 수 없습니다."));
            }

            User u = userOpt.get();
            return ResponseEntity.ok(new MeResponse(u.getUsername(), u.getEmail()));

        } catch (Exception e) { // JWT 파싱/검증 실패 등
            return ResponseEntity.status(401).body(new ApiResponse(false, "유효하지 않은 토큰입니다."));
        }
    }
}
