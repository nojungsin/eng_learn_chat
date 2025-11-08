package com.example.chat.util;

import com.example.chat.domain.User;
import com.example.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {
    private final UserRepository userRepository;

    public User currentUser(Authentication auth) {
        String email = auth.getName(); // Jwt에서 subject=email
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found for email " + email));
    }
}
