package eng.dto.voca;
import eng.domain.Vocabulary;
import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class VocaDto {
    private Long vocaid;
    private String word;
    private String kmeaning;
    private String example;
    private boolean known;

    public static VocaDto from(Vocabulary v) {
        return VocaDto.builder()
                .vocaid(v.getVocaid())
                .word(v.getWord())
                .kmeaning(v.getKmeaning())
                .example(v.getExample())
                .known(v.isKnown())
                .build();
    }
}