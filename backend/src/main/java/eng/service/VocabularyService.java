package eng.service;

import eng.domain.User;
import eng.domain.Vocabulary;
import eng.dto.voca.CreateVocaRequest;
import eng.dto.voca.UpdateVocaRequest;
import eng.repository.VocabularyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VocabularyService {
    private final VocabularyRepository repo;

    public List<Vocabulary> list(User user) {
        return repo.findByUser_IdOrderByVocaidDesc(user.getId());
    }

    public Vocabulary create(User user, CreateVocaRequest req) {
        String word = req.getWord().trim();
        if (repo.existsByUser_IdAndWordIgnoreCase(user.getId(), word)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 단어입니다.");
        }
        try {
            Vocabulary v = Vocabulary.builder()
                    .user(user)
                    .word(word)
                    .kmeaning(req.getKmeaning() == null ? "" : req.getKmeaning().trim())
                    .example(req.getExample())
                    .known(false)
                    .build();
            return repo.save(v);
        } catch (DataIntegrityViolationException e) {
            // DB 유니크 인덱스가 막은 경우도 409로 번역
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 단어입니다.");
        }
    }

    public Vocabulary update(User user, Long vocaid, UpdateVocaRequest req) {
        Vocabulary v = repo.findByVocaidAndUser_Id(vocaid, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "단어를 찾을 수 없습니다."));

        if (req.getKnown() != null) v.setKnown(req.getKnown());
        if (req.getWord() != null) v.setWord(req.getWord());
        if (req.getKmeaning() != null) v.setKmeaning(req.getKmeaning());
        if (req.getExample() != null) v.setExample(req.getExample());

        return repo.save(v);
    }

    public void delete(User user, Long vocaid) {
        Vocabulary v = repo.findByVocaidAndUser_Id(vocaid, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "단어를 찾을 수 없습니다."));
        repo.delete(v);
    }
}
