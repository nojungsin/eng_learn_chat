package eng.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private boolean ok;
    private String message;
    private String token; // ✅ JWT 토큰

    // 2개짜리 생성자 — 반드시 클래스 안쪽에 위치해야 함!
    public ApiResponse(boolean ok, String message) {
        this.ok = ok;
        this.message = message;
    }
}