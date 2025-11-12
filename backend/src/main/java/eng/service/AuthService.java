package eng.service;

import eng.config.JwtTokenProvider;
import eng.domain.User;
import eng.dto.LoginRequest;
import eng.dto.LoginResponse;
import eng.dto.RegisterRequest;
import eng.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider; // 스프링이 자동으로 주입
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // 이메일 형식 정규식
    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    // 생성자 따로 필요 없음 (Lombok이 자동 생성)

    // 회원가입
    public String register(RegisterRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank()
                || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()
                || req.getConfirmPassword() == null || req.getConfirmPassword().isBlank()) {
            return "모든 필드를 입력해주세요.";
        }

        if (!EMAIL_REGEX.matcher(req.getEmail()).matches()) {
            return "올바른 이메일 형식이 아닙니다.";
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            return "비밀번호가 일치하지 않습니다.";
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            return "이미 사용 중인 이메일입니다.";
        }

        String hash = encoder.encode(req.getPassword());

        User u = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .passwordHash(hash)
                .build();

        userRepository.save(u);
        return null; // 성공
    }

    //로그인 메소드
    public LoginResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            return new LoginResponse(false, "이메일과 비밀번호를 모두 입력해주세요.", null);
        }

        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "존재하지 않는 이메일입니다.", null);
        }

        User user = userOpt.get();
        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            return new LoginResponse(false, "비밀번호가 올바르지 않습니다.", null);
        }

        // 로그인 성공 시 JWT 발급
        String token = jwtTokenProvider.createToken(user.getEmail(), "USER");
        return new LoginResponse(true, "로그인 성공", token);
    }
}
