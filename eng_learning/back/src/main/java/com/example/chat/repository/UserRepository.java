package com.example.chat.repository;

import com.example.chat.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);   // ✅ 추가
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
