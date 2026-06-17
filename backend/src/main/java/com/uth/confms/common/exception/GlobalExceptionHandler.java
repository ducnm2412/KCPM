package com.uth.confms.common.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import com.uth.confms.common.dto.ApiResponse;
import io.jsonwebtoken.JwtException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
/**
 * Global Exception Handler để xử lý các ngoại lệ trong toàn bộ ứng dụng.
 *
 * <p>
 * Class này bắt các exception được ném ra từ Controller và trả về response
 * chuẩn
 * hóa (ApiResponse).
 * Các loại exception được xử lý bao gồm:
 * <ul>
 * <li>BusinessException: Lỗi nghiệp vụ (400)</li>
 * <li>NotFoundException: Không tìm thấy tài nguyên (404)</li>
 * <li>UnauthorizedException: Lỗi xác thực (401)</li>
 * <li>AccessDeniedException: Lỗi quyền truy cập (403)</li>
 * <li>Validation Exceptions: Lỗi validate dữ liệu đầu vào (400)</li>
 * <li>Internal Server Error: Các lỗi không xác định khác (500)</li>
 * </ul>
 *
 * @author UTH-ConfMS Team
 * @version 1.0
 */
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(BusinessException.class)
  // Xử lý lỗi nghiệp vụ (Business Exception)
  public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException e) {
    log.warn("Business exception: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(NotFoundException.class)
  // Xử lý lỗi không tìm thấy tài nguyên
  public ResponseEntity<ApiResponse<Object>> handleNotFoundException(NotFoundException e) {
    log.warn("Not found: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(UnauthorizedException.class)
  // Xử lý lỗi chưa xác thực (Unauthorized)
  public ResponseEntity<ApiResponse<Object>> handleUnauthorizedException(UnauthorizedException e) {
    log.warn("Unauthorized: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(
      BadCredentialsException e) {
    log.warn("Bad credentials: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error("Invalid email or password"));
  }

  @ExceptionHandler(AccessDeniedException.class)
  // Xử lý lỗi từ chối truy cập (Access Denied)
  public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException e) {
    log.warn("Access denied: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
  }

  @ExceptionHandler(JwtException.class)
  public ResponseEntity<ApiResponse<Object>> handleJwtException(JwtException e) {
    log.warn("JWT error: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error("Invalid or expired token"));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(
      IllegalArgumentException e) {
    // Check if it's a JWT-related error
    String message = e.getMessage();
    if (message != null && (message.contains("JWT") || message.contains("token") || message.contains("Token"))) {
      log.warn("JWT validation error: {}", message);
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.error("Invalid token format"));
    }
    log.warn("Illegal argument: {}", message);
    log.warn("Stack trace: ", e);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(message != null ? message : "Invalid argument"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  // Xử lý lỗi validation dữ liệu đầu vào
  public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
      MethodArgumentNotValidException e) {
    Map<String, String> errors = new HashMap<>();
    e.getBindingResult()
        .getAllErrors()
        .forEach(
            error -> {
              String fieldName =
                  error instanceof FieldError fieldError
                      ? fieldError.getField()
                      : error.getObjectName();
              String errorMessage = error.getDefaultMessage();
              errors.put(fieldName, errorMessage);
            });
    log.warn("Validation errors: {}", errors);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error("Validation failed", errors));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleHttpMessageNotReadableException(
      HttpMessageNotReadableException e) {
    Map<String, String> errors = new HashMap<>();
    Throwable cause = e.getMostSpecificCause();
    String fieldName = "request";
    String errorMessage = "Invalid request body";

    if (cause instanceof InvalidFormatException invalidFormatException) {
      fieldName = extractFieldName(invalidFormatException.getPath());
      errorMessage = "Invalid value type";
    } else if (cause instanceof MismatchedInputException mismatchedInputException) {
      fieldName = extractFieldName(mismatchedInputException.getPath());
      errorMessage = "Invalid value type";
    }

    errors.put(fieldName, errorMessage);
    log.warn("Request body validation errors: {}", errors);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error("Validation failed", errors));
  }

  @ExceptionHandler(TypeMismatchException.class)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleTypeMismatchException(
      TypeMismatchException e) {
    Map<String, String> errors = new HashMap<>();
    String fieldName = e.getPropertyName() != null ? e.getPropertyName() : "request";
    errors.put(fieldName, "Invalid value type");
    log.warn("Request parameter validation errors: {}", errors);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error("Validation failed", errors));
  }

  private String extractFieldName(List<JsonMappingException.Reference> path) {
    if (path == null || path.isEmpty()) {
      return "request";
    }

    StringBuilder fieldName = new StringBuilder();
    for (JsonMappingException.Reference reference : path) {
      if (reference.getFieldName() != null) {
        if (fieldName.length() > 0) {
          fieldName.append(".");
        }
        fieldName.append(reference.getFieldName());
      } else if (reference.getIndex() >= 0) {
        fieldName.append("[").append(reference.getIndex()).append("]");
      }
    }
    return fieldName.length() > 0 ? fieldName.toString() : "request";
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiResponse<Object>> handleHttpRequestMethodNotSupportedException(
      HttpRequestMethodNotSupportedException e) {
    log.warn("HTTP method not supported: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .body(ApiResponse.error(e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  // Xử lý các lỗi không xác định (Internal Server Error)
  public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception e) {
    log.error("Unexpected error: ", e);
    // In development, return detailed error message
    String errorMessage = "An unexpected error occurred";
    if (e.getMessage() != null) {
      errorMessage = e.getMessage();
    }
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(errorMessage));
  }
}
