// controller/AuthController.java
package eng.controller;
import eng.config.JwtTokenProvider;
import eng.dto.ApiResponse;
import eng.dto.LoginRequest;
import eng.dto.LoginResponse;
import eng.dto.RegisterRequest;
import eng.repository.UserRepository;
import eng.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@CrossOrigin // 프런트 분리 시 CORS 허용
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider; // 사용 안 해도 보관 가능
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest req) {
        String err = authService.register(req);
        if (err == null) {
            return ResponseEntity.ok(new ApiResponse(true, "회원가입이 완료되었습니다."));
        }
        return ResponseEntity.badRequest().body(new ApiResponse(false, err));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        LoginResponse res = authService.login(req);
        if (!res.isSuccess()) { // 실패 시 400
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    // 토큰 검증용: SecurityContext에 인증이 들어오면 authentication != null
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "인증 필요"));
        }
        String email = authentication.getName(); // Jwt subject = email

        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(u ->
                        ResponseEntity.ok(new MeResponse(u.getId(), u.getUsername(), u.getEmail())))
                .orElseGet(() ->
                        ResponseEntity.status(404).body(new ApiResponse(false, "사용자를 찾을 수 없습니다.")));
    }

    // 메서드 밖에서 선언해야 함
    public static record MeResponse(Long id, String username, String email) {}
}
