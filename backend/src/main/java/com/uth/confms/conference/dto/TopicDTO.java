package com.uth.confms.conference.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicDTO {
  private Long id;
  @NotBlank(message = "Topic name is required")
  private String name; // Tên chủ đề
  private String description; // Mô tả
}
