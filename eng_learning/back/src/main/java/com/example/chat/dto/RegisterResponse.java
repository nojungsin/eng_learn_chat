package com.example.chat.dto;

/**
 * 회원가입 성공 시 프론트로 돌려주는 응답 모델.
 * (비밀번호/해시는 절대 포함하지 않음)
 */
public class RegisterResponse {
    public Long id;
    public String username;
    public String email;
}

