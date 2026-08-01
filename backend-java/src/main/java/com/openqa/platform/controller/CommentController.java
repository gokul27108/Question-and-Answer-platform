package com.openqa.platform.controller;

import com.openqa.platform.dto.CommentRequest;
import com.openqa.platform.dto.CommentResponse;
import com.openqa.platform.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping("/questions/{questionId}/comments")
    public ResponseEntity<CommentResponse> createQuestionComment(
            @PathVariable Long questionId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = commentService.createQuestionComment(questionId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/answers/{answerId}/comments")
    public ResponseEntity<CommentResponse> createAnswerComment(
            @PathVariable Long answerId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = commentService.createAnswerComment(answerId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        commentService.deleteComment(id, userDetails.getUsername(), isAdmin);
        return ResponseEntity.ok("Comment deleted successfully!");
    }

    @GetMapping("/questions/{questionId}/comments")
    public ResponseEntity<List<CommentResponse>> getCommentsByQuestionId(@PathVariable Long questionId) {
        List<CommentResponse> response = commentService.getCommentsByQuestionId(questionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/answers/{answerId}/comments")
    public ResponseEntity<List<CommentResponse>> getCommentsByAnswerId(@PathVariable Long answerId) {
        List<CommentResponse> response = commentService.getCommentsByAnswerId(answerId);
        return ResponseEntity.ok(response);
    }
}
