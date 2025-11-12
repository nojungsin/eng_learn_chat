package eng.dto;

//개인정보관리페이지 정보 업데이트 dto
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 필드는 직렬화 생략(보내지 않음)
public class UpdateUserRequest {
    private String name; // null 또는 "" -> 미수정

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    private String email; // null 또는 "" -> 미수정

    private String password; // null 또는 "" -> 미수정
}