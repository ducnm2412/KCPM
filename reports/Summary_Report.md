# Summary Report

## Tổng quan

- Tên dự án: UTH-ConfMS - UTH Scientific Conference Paper Management System.
- Backend: Java 17, Spring Boot 3.3.5, Spring MVC REST Controller, Spring Security JWT, Spring Data JPA.
- Frontend API client: React/Vite TypeScript, Axios `apiClient` với `baseURL: /api`.
- Tổng số API frontend đang sử dụng: 130 call patterns.
- API có backend mapping rõ ràng: 125.
- API mismatch hoặc chưa thấy mapping backend: 5.
- Framework automation test đề xuất: JUnit 5 + Spring Boot Test + MockMvc + Spring Security Test.

## Danh sách file report

| File | Nội dung |
| ---- | -------- |
| `reports/Auth_API_TestCases.md` | Test case Auth API |
| `reports/User_API_TestCases.md` | Test case User/Admin/Organization API |
| `reports/Conference_API_TestCases.md` | Test case Conference/CFP API |
| `reports/Submission_API_TestCases.md` | Test case Submission/File API |
| `reports/Assignment_API_TestCases.md` | Test case Assignment API |
| `reports/Review_API_TestCases.md` | Test case Review/Rebuttal API |
| `reports/CameraReady_API_TestCases.md` | Test case Camera-ready API |
| `reports/Boundary_Value_Analysis.md` | Phân tích giá trị biên |
| `reports/Equivalence_Partitioning.md` | Phân hoạch lớp tương đương |
| `reports/Summary_Report.md` | Tổng hợp, rủi ro và automation |

## Số lượng test case đã tách

| Nhóm | Số test case |
| ---- | -----------: |
| Auth | 13 |
| User/Admin/Organization | 15 |
| Conference/CFP | 13 |
| Submission/File | 24 |
| Assignment | 16 |
| Review/Rebuttal | 16 |
| Camera-ready | 19 |
| Tổng | 120 |

## API rủi ro / mismatch

| STT | Method | Endpoint | Vấn đề | Mức độ ưu tiên | Gợi ý xử lý |
| --: | ------ | -------- | ------ | -------------- | ----------- |
| 1 | POST | `/api/auth/verify-email?token={token}` | Frontend gọi verify email nhưng backend không có mapping | Cao | Thêm endpoint trong `AuthController` hoặc sửa flow frontend |
| 2 | POST | `/api/auth/sso/callback` | FE gửi JSON body nhưng backend nhận query param; backend chưa implemented | Cao | Thống nhất contract và implement OAuth callback |
| 3 | GET | `/api/assignments/{id}/file` | FE cần download anonymized file theo assignment nhưng backend chưa có endpoint | Cao | Thêm endpoint vào `AssignmentController` hoặc sửa FE dùng submission file API |
| 4 | POST | `/api/notifications/email/preview` | FE legacy endpoint chưa có backend | Trung bình | Implement preview endpoint hoặc bỏ UI call |
| 5 | POST | `/api/notifications/email` | FE legacy endpoint chưa có backend | Trung bình | Reuse decision notification hoặc thêm email controller |
| 6 | GET | `/api/proceedings/export` | FE proceedings service gọi endpoint không có controller | Trung bình | Map sang camera-ready export hoặc thêm `ProceedingsController` |
| 7 | Multiple | Camera-ready APIs | Chưa thấy `@PreAuthorize` rõ cho role author/chair | Cao | Bổ sung method security và tests owner/role |
| 8 | POST/DELETE | `/api/conferences`, `/api/conferences/{id}` | FE comment CHAIR/ADMIN nhưng backend chỉ ADMIN | Trung bình | Đồng bộ UI permission hoặc backend role |

## Nhóm API cần ưu tiên automation

1. Auth/session: login, refresh, logout, change-password.
2. Submission lifecycle: create/update/upload/submit/withdraw/delete/download.
3. Assignment/Review lifecycle: manual/bulk/auto assign, accept/decline, draft/submit review, comments, rebuttal.
4. Decision/Notification: create/update/bulk/notify, locked/notified state.
5. Camera-ready: upload/version/download/review/open/close/export, UUID, file validation, `X-User-Id`.
6. Admin destructive APIs: backup/restore, delete conference, deactivate user, update roles.
7. FE/BE mismatch APIs để tránh UI gọi nhầm endpoint.

## Lệnh chạy test đề xuất

```bash
cd backend
mvn test
```

## Kết luận

Bộ report đã được chia nhỏ để dễ đọc và dễ review trong VS Code. Các kỹ thuật đã áp dụng gồm phân hoạch lớp tương đương, phân tích giá trị biên, positive/negative testing, missing field, invalid data type, unauthorized, forbidden, not found, duplicate, state transition và contract mismatch testing.

