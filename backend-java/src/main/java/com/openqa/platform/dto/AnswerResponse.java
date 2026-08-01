package com.openqa.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {
    private Long id;
    private Long questionId;
    private String text;
    private Long authorId;
    private String authorUsername;
    private int authorReputation;
    private String authorAvatar;
    private boolean accepted;
    private int votes;
    private int userVote; // 1 for upvoted, -1 for downvoted, 0 for none
    private String imageUrl;
    private LocalDateTime createdAt;
}
