package com.openqa.platform.controller;

import com.openqa.platform.dto.AnswerRequest;
import com.openqa.platform.dto.AnswerResponse;
import com.openqa.platform.service.AnswerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AnswerController {

    @Autowired
    private AnswerService answerService;

    @PostMapping("/questions/{questionId}/answers")
    public ResponseEntity<AnswerResponse> createAnswer(
            @PathVariable Long questionId,
            @Valid @RequestBody AnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AnswerResponse response = answerService.createAnswer(questionId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/answers/{id}")
    public ResponseEntity<AnswerResponse> updateAnswer(
            @PathVariable Long id,
            @Valid @RequestBody AnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AnswerResponse response = answerService.updateAnswer(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/answers/{id}")
    public ResponseEntity<?> deleteAnswer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        answerService.deleteAnswer(id, userDetails.getUsername(), isAdmin);
        return ResponseEntity.ok("Answer deleted successfully!");
    }

    @PostMapping("/answers/{id}/accept")
    public ResponseEntity<AnswerResponse> acceptAnswer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        AnswerResponse response = answerService.acceptAnswer(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/questions/{questionId}/answers")
    public ResponseEntity<List<AnswerResponse>> getAnswersByQuestionId(@PathVariable Long questionId) {
        List<AnswerResponse> response = answerService.getAnswersByQuestionId(questionId);
        return ResponseEntity.ok(response);
    }
}
