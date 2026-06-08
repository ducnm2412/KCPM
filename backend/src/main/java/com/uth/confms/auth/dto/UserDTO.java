package com.uth.confms.auth.dto;

import java.time.LocalDateTime;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
  private Long id; // ID người dùng
  private String email; // Email
  
  @NotBlank(message = "Validation failed")
  @jakarta.validation.constraints.Pattern(regexp = "^[^0-9]+$", message = "Validation failed")
  private String firstName; // Tên
  
  @NotBlank(message = "Validation failed")
  @jakarta.validation.constraints.Pattern(regexp = "^[^0-9]+$", message = "Validation failed")
  private String lastName; // Họ
  
  @jakarta.validation.constraints.NotNull(message = "Validation failed")
  private Long organizationId; // ID tổ chức
  private String organizationName; // Tên tổ chức
  
  @NotBlank(message = "Validation failed")
  @jakarta.validation.constraints.Pattern(regexp = "^\\d+$", message = "Validation failed")
  private String phone; // Số điện thoại
  private Boolean emailVerified; // Đã xác thực email chưa
  private Boolean active; // Trạng thái hoạt động
  private Set<String> roles; // Các vai trò của user
  private LocalDateTime createdAt; // Ngày tạo
  private LocalDateTime updatedAt; // Ngày cập nhật
}
