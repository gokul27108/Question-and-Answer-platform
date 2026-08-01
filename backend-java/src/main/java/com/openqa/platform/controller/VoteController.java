package com.openqa.platform.controller;

import com.openqa.platform.service.VoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VoteController {

    @Autowired
    private VoteService voteService;

    @PostMapping("/questions/{questionId}/vote")
    public ResponseEntity<?> voteQuestion(
            @PathVariable Long questionId,
            @RequestParam int value,
            @AuthenticationPrincipal UserDetails userDetails) {
        voteService.voteQuestion(questionId, value, userDetails.getUsername());
        return ResponseEntity.ok("Vote submitted successfully!");
    }

    @PostMapping("/answers/{answerId}/vote")
    public ResponseEntity<?> voteAnswer(
            @PathVariable Long answerId,
            @RequestParam int value,
            @AuthenticationPrincipal UserDetails userDetails) {
        voteService.voteAnswer(answerId, value, userDetails.getUsername());
        return ResponseEntity.ok("Vote submitted successfully!");
    }
}
