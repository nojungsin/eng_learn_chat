package com.example.chat.controller;

import com.example.chat.service.ChatService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public Mono<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String topic = request.getOrDefault("topic", "General conversation");
        String userMessage = request.getOrDefault("userMessage", "");
        String messages = request.getOrDefault("messages", "");

        return chatService.generateReply(topic, userMessage, messages)
                .map(reply -> Map.of("reply", reply));
    }
}
