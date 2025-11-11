package com.example.chat.controller;

import com.example.chat.domain.User;
import com.example.chat.domain.Vocabulary;
import com.example.chat.dto.voca.CreateVocaRequest;
import com.example.chat.dto.voca.UpdateVocaRequest;
import com.example.chat.dto.voca.VocaDto;
import com.example.chat.service.VocabularyService;
import com.example.chat.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;


import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.ArrayList;
import java.time.OffsetDateTime;

//단어장 기능
@RestController
@RequestMapping("/api/voca")
@RequiredArgsConstructor
public class VocaController {

    private final VocabularyService service;
    private final AuthUtils auth;
    private final UserRepository userRepository;

    //ai쪽에서 voca관련해서 단어 추가할 때 사용
    @PostMapping("/bulk")
    public ResponseEntity<?> saveBulk(
            @AuthenticationPrincipal User user,
            @RequestBody CreateVocaBulkRequest req
    ) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error","items required"));
        }

        List<Vocabulary> entities = new ArrayList<>();
        for (CreateVocaRequest item : req.getItems()) {
            if (item.getWord() == null || item.getWord().isBlank()) continue;

            Vocabulary v = new Vocabulary();
            v.setUser(user);
            v.setWord(item.getWord().trim().toLowerCase());
            v.setMeaningKo(
                    (item.getMeaningKo() == null || item.getMeaningKo().isBlank()) ? null : item.getMeaningKo().trim()
            );
            v.setExample(
                    (item.getExample() == null || item.getExample().isBlank()) ? null : item.getExample().trim()
            );
            v.setKnown(Boolean.FALSE); // 요구사항: 항상 false로 저장
            v.setCreatedAt(OffsetDateTime.now()); // 필드 있으면
            entities.add(v);
        }

        if (!entities.isEmpty()) {
            vocabularyRepository.saveAll(entities);
        }
        return ResponseEntity.ok(Map.of("saved", entities.size()));
    }

    //단어장 조회
    @GetMapping
    public ResponseEntity<List<VocaDto>> list(Authentication authentication) {
        User user = auth.currentUser(authentication);
        var items = service.list(user).stream().map(VocaDto::from).toList();
        return ResponseEntity.ok(items);
    }

    //단어 추가
    @PostMapping
    public ResponseEntity<VocaDto> create(@RequestBody CreateVocaRequest req,
                                           Authentication authentication) {
        User user = auth.currentUser(authentication);
        Vocabulary saved = service.create(user, req);
        return ResponseEntity.ok(VocaDto.from(saved));
    }

    //단어장 수정
    @PatchMapping("/{vocaid}")
    public ResponseEntity<VocaDto> update(@PathVariable Long vocaid,
                                           @RequestBody UpdateVocaRequest req,
                                           Authentication authentication) {
        User user = auth.currentUser(authentication);
        Vocabulary updated = service.update(user, vocaid, req);
        return ResponseEntity.ok(VocaDto.from(updated));
    }

    //단어장 목록 삭제
    @DeleteMapping("/{vocaid}")
    public ResponseEntity<Void> delete(@PathVariable Long vocaid,
                                       Authentication authentication) {
        User user = auth.currentUser(authentication);
        service.delete(user, vocaid);
        return ResponseEntity.noContent().build();
    }
}
