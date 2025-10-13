// controller/AuthController.java
package com.example.chat.controller;

import com.example.chat.dto.*;
import com.example.chat.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin // 프런트 분리 시 CORS 허용
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest req) {
        String err = authService.register(req);
        if (err == null) {
            return ResponseEntity.ok(new ApiResponse(true, "회원가입이 완료되었습니다."));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(false, err));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String token = authService.login(request); // AuthService에서 JWT 토큰 반환
        ApiResponse response = new ApiResponse(true, "로그인 성공", token);
        return ResponseEntity.ok(response);
    }
}
