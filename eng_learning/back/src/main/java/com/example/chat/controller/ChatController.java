package com.example.chat.controller;

import com.example.chat.dto.ChatRequest;
import com.example.chat.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody ChatRequest request) {
        String topic = request.getTopic();
        String userMessage = request.getUserMessage();

        String prompt = "주제: " + topic + "\n사용자: " + userMessage;
        String reply = chatService.getGeminiResponse(prompt);

        Map<String, String> response = new HashMap<>();
        response.put("reply", reply);

        return ResponseEntity.ok(response);
    }
}
