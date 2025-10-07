package com.example.chat.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {
    private String email;       // ✅ email로 변경
    private String password;
}
