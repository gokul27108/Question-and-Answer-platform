package com.openqa.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private String title;
    private String description;
    private Long authorId;
    private String authorUsername;
    private int authorReputation;
    private String authorAvatar;
    private String categoryName;
    private Set<String> tags;
    private int views;
    private int votes;
    private int answersCount;
    private Long acceptedAnswerId;
    private String imageUrl;
    private int userVote; // 1 for upvoted, -1 for downvoted, 0 for none
    private LocalDateTime createdAt;
}
