package eng.domain;

import java.time.LocalDate;

public class TestData {
    private Long testId;

    private Long userId;
    private LocalDate date;// yyyy-MM-dd 출력용

    private Double wscore;//단어 점수      // 해당 카테고리에 속한 메시지들의 score 평균
    private Double gscore;//문법 점수
    private Double vscore;//어휘 점수
    private Double pscore;// 텍
}
