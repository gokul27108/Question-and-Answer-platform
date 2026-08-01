package com.openqa.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Set;

@Data
public class QuestionRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private String categoryName;

    private Set<String> tags;

    private String imageUrl;
}
