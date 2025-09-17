package com.example.chat.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 프론트에서 넘어오는 회원가입 요청 바디.
 */
public class RegisterRequest {
    @NotBlank @Size(min = 4, max = 50)
    public String username;

    @NotBlank
    @Email  // ★ 이메일 형식 검증
    public String email;

    @NotBlank @Size(min = 8, max = 100)
    public String password;

    @NotBlank
    public String confirmPassword;
}

