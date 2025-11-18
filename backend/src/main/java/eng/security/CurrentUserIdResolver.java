package eng.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * - 1순위: SecurityContext의 Principal에서 getId()/getUserId() 메서드가 있으면 사용
 * - 2순위: 컨트롤러에서 넘겨준 X-User-Id 헤더
 * - 3순위: (없음) -> Optional.empty()
 */
public class CurrentUserIdResolver {

    public static Optional<Long> fromSecurityContext() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return Optional.empty();
            Object principal = auth.getPrincipal();
            if (principal == null) return Optional.empty();

            // 커스텀 UserPrincipal에 맞게 확장
            try {
                var m = principal.getClass().getMethod("getId");
                Object v = m.invoke(principal);
                if (v instanceof Long) return Optional.of((Long) v);
                if (v instanceof Number) return Optional.of(((Number) v).longValue());
            } catch (NoSuchMethodException ignore) { }

            try {
                var m = principal.getClass().getMethod("getUserId");
                Object v = m.invoke(principal);
                if (v instanceof Long) return Optional.of((Long) v);
                if (v instanceof Number) return Optional.of(((Number) v).longValue());
            } catch (NoSuchMethodException ignore) { }

            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
