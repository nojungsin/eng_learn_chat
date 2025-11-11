package eng.dto;

import lombok.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 프론트에서 넘어오는 회원가입 처리
 */

@Getter @Setter
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String confirmPassword;
}

