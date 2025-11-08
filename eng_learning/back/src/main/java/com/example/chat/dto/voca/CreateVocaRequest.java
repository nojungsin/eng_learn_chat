package com.example.chat.dto.voca;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CreateVocaRequest {
    private String word;       // 필수
    private String kmeaning;    // 필수
    private String example;    // 선택
}
