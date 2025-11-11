package com.example.chat.dto.feedback;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DetailDto {
    private List<String> topics; // ["Grammar","Vocabulary"] 같은 문자열 배열
    private String feedback;     // grammar/vocab(필요시 conv) 코멘트 합친 텍스트
    private Double score;        // 0~100
    private String level;        // "excellent" | "good" | "needs-work"(너희 규칙에 맞게)
    private String date;         // "yyyy-MM-dd" (표시용)
}
