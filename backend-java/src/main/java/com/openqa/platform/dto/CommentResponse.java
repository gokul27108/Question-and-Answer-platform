package com.openqa.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long id;
    private String text;
    private Long authorId;
    private String authorUsername;
    private int authorReputation;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}
