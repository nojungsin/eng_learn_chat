package eng.repository;

import eng.domain.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {
    List<Vocabulary> findByUser_IdOrderByVocaidDesc(Long userId);
    Optional<Vocabulary> findByVocaidAndUser_Id(Long vocaid, Long userId);
    boolean existsByUser_IdAndWordIgnoreCase(Long userId, String word);
}