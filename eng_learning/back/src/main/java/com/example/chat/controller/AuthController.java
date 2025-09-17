package com.example.chat.controller;

import com.example.chat.dto.RegisterRequest;
import com.example.chat.dto.RegisterResponse;
import com.example.chat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/auth/register
 * - 요청 바디: RegisterRequest (username/password/confirmPassword/name/nickname)
 * - 응답 바디: RegisterResponse (id/username/name/nickname)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest req) {
        RegisterResponse res = auth.register(req);
        return ResponseEntity.status(201).body(res);
    }
}
