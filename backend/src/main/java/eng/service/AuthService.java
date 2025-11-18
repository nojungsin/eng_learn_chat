package eng.service;

import eng.config.JwtTokenProvider;
import eng.domain.User;
import eng.dto.*;
import eng.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // 이메일 형식 정규식
    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    // -------------------------------
    // 회원가입
    // -------------------------------
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
        return null; // 성공 시 null 반환
    }

    // -------------------------------
    // 로그인
    // -------------------------------
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

        // JWT 발급
        String token = jwtTokenProvider.createToken(user.getEmail(), "USER");
        return new LoginResponse(true, "로그인 성공", token);
    }

    // -------------------------------
    // 내 정보 조회 (/api/auth/me GET)
    // -------------------------------
    @Transactional(readOnly = true)
    public UserProfileDto getMyProfile() {
        String email = currentUserEmail();
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        // name은 username과 동일한 값으로 세팅
        return new UserProfileDto(me.getUsername(), me.getEmail());
    }

    // -------------------------------
    // 내 정보 수정 (/api/auth/me PUT)
    // -------------------------------
    @Transactional
    public void updateMyProfile(UpdateUserRequest req) {
        String email = currentUserEmail();
        User me = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        boolean changed = false;

        // 이름(name) -> username에 반영
        if (req.getName() != null && !req.getName().isBlank()) {
            me.setUsername(req.getName().trim());
            changed = true;
        }

        // 이메일(email) 변경
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String newEmail = req.getEmail().trim();
            if (!Objects.equals(newEmail, me.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new IllegalStateException("이미 사용 중인 이메일입니다.");
                }
                me.setEmail(newEmail);
                changed = true;
            }
        }

        // 비밀번호(password) 변경
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            me.setPasswordHash(encoder.encode(req.getPassword()));
            changed = true;
        }

        if (changed) {
            userRepository.save(me);
        }
    }

    // -------------------------------
    // 현재 로그인 사용자 이메일 추출
    // -------------------------------
    private String currentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new IllegalStateException("인증 정보가 없습니다.");
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return ud.getUsername(); // 보통 이메일
        }
        return auth.getName();
    }
}