package com.example.chat.dto.voca;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class UpdateVocaRequest {
    private String word;       // 선택
    private String kmeaning;    // 선택
    private String example;    // 선택
    private Boolean known;     // 선택 (토글)
}
