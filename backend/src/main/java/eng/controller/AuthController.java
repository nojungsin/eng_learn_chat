package eng.controller;

import eng.dto.*;
import eng.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest req) {
        String err = authService.register(req);
        if (err != null) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, err));
        }
        return ResponseEntity.ok(new ApiResponse(true, "회원가입 성공"));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    // 내 정보 조회
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "인증 필요"));
        }
        try {
            return ResponseEntity.ok(authService.getMyProfile());
        } catch (Exception e) {
            return ResponseEntity.status(404).body(new ApiResponse(false, "사용자를 찾을 수 없습니다."));
        }
    }

    // 내 정보 수정 (입력된 칸만 반영)
    @PutMapping("/me")
    public ResponseEntity<ApiResponse> updateMe(@RequestBody UpdateUserRequest req) {
        try {
            authService.updateMyProfile(req);
            return ResponseEntity.ok(new ApiResponse(true, "수정 완료"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false, "수정 중 오류 발생"));
        }
    }
}
