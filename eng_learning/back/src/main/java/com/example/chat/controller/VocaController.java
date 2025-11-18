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

import java.util.List;

@RestController
@RequestMapping("/api/voca")
@RequiredArgsConstructor
public class VocaController {

    private final VocabularyService service;
    private final AuthUtils auth;

    @GetMapping
    public ResponseEntity<List<VocaDto>> list(Authentication authentication) {
        User user = auth.currentUser(authentication);
        var items = service.list(user).stream().map(VocaDto::from).toList();
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<VocaDto> create(@RequestBody CreateVocaRequest req,
                                           Authentication authentication) {
        User user = auth.currentUser(authentication);
        Vocabulary saved = service.create(user, req);
        return ResponseEntity.ok(VocaDto.from(saved));
    }

    @PatchMapping("/{vocaid}")
    public ResponseEntity<VocaDto> update(@PathVariable Long vocaid,
                                           @RequestBody UpdateVocaRequest req,
                                           Authentication authentication) {
        User user = auth.currentUser(authentication);
        Vocabulary updated = service.update(user, vocaid, req);
        return ResponseEntity.ok(VocaDto.from(updated));
    }

    @DeleteMapping("/{vocaid}")
    public ResponseEntity<Void> delete(@PathVariable Long vocaid,
                                       Authentication authentication) {
        User user = auth.currentUser(authentication);
        service.delete(user, vocaid);
        return ResponseEntity.noContent().build();
    }
}
