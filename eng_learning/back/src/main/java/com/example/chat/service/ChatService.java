package com.example.chat.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class ChatService {

    private static final String GEMINI_API_KEY = "AIzaSyC7K3XTSADZWzvk8B7zDwYYRWjvmtmyRmI";
    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

    private final WebClient webClient;

    public ChatService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(GEMINI_API_URL).build();
    }

    public Mono<String> generateReply(String topic, String userMessage, String messageHistory) {
        String prompt = buildPrompt(topic, userMessage, messageHistory);

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[] {
                        Map.of("role", "user", "parts", new Object[] { Map.of("text", prompt) })
                }
        );

        return webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    var candidates = (java.util.List<Map<String, Object>>) response.get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                        java.util.List<Map<String, Object>> parts = (java.util.List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                    return "❌ No response from Gemini.";
                });
    }

    private String buildPrompt(String topic, String userMessage, String messageHistory) {
        return """
        You are a friendly and encouraging English conversation AI tutor.
        Always reply only in English...
        (중략)

        Topic: %s

        Conversation so far:
        %s

        The last thing the user said was:
        "%s"

        Reply directly and naturally to this last message. Do not repeat earlier questions.
        Ask a follow-up based on this specific input.
        """.formatted(topic, messageHistory == null ? "" : messageHistory, userMessage);
    }

}
