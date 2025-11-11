package com.example.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final WebClient webClient;

    //텍스트 채팅
    @PostMapping("/text")
    public Mono<Map<String,Object>> text(@RequestBody Map<String,Object> body) {
        return webClient.post()
                .uri("http://localhost:8000/text-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<>() {});
    }

    //보이스 채팅
    @PostMapping("/voice")
    public Mono<Map<String,Object>> voice(@RequestBody Map<String,Object> body) {
        return webClient.post()
                .uri("http://localhost:8000/voice-chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<>() {});
    }
}
