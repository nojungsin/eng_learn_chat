package com.example.chat.dto.voca;

import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.ArrayList;
import java.time.OffsetDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;


@Getter @Setter
public class CreateVocaBulkRequest {
    private List<CreateVocaRequest> items;
}