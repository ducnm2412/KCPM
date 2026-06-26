# Auth API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Auth API.

## Endpoint được sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| POST | `/api/auth/register` | Đăng ký tài khoản | Public | `AuthController.register` | email/password/name required, duplicate email |
| POST | `/api/auth/login` | Đăng nhập | Public | `AuthController.login` | returns access/refresh token |
| POST | `/api/auth/refresh` | Refresh access token | Public | `AuthController.refreshToken` | header `Authorization: Bearer refreshToken` |
| POST | `/api/auth/logout` | Đăng xuất | Auth/default nhưng `/api/auth/**` được permit | `AuthController.logout` | cần xác minh behavior thực tế |
| POST | `/api/auth/change-password` | Đổi mật khẩu | Authenticated | `AuthController.changePassword` | password policy |
| POST | `/api/auth/forgot-password` | Gửi reset mail | Public | `AuthController.forgotPassword` | email format |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Register thành công | `/api/auth/register` | POST | Email mới hợp lệ, password `Abcdef1!`, firstName, lastName | 200 | `success=true`, có token/user | V1,V2,V4 |
| 2 | Register thiếu email | `/api/auth/register` | POST | Body thiếu `email` | 400 | Validation lỗi field `email` | X1 |
| 3 | Register email sai định dạng | `/api/auth/register` | POST | `email="abc"` | 400 | `success=false`, invalid email | X2 |
| 4 | Register duplicate email | `/api/auth/register` | POST | Email đã tồn tại | 400/409 | Báo email đã tồn tại | X3 |
| 5 | Register password yếu | `/api/auth/register` | POST | Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&) | 400 | Validation failed  | X5,B1 |
| 6 | Login thành công | `/api/auth/login` | POST | Email/password đúng | 200 | Trả `accessToken`, `refreshToken`, roles | V3,V7 |
| 7 | Login sai password | `/api/auth/login` | POST | Email đúng, password sai | 401 | Invalid email or password | X7 |
| 8 | Login thiếu password | `/api/auth/login` | POST | Body chỉ có email | 400 | Lỗi field `password` | X4 |
| 9 | Refresh token thành công | `/api/auth/refresh` | POST | Header `Authorization: Bearer <validRefreshToken>` | 200 | Trả access token mới | V41 |
| 10 | Refresh token sai format | `/api/auth/refresh` | POST | Header thiếu Bearer hoặc token rỗng | 401/400 | Token invalid | X42 |
| 11 | Logout thành công | `/api/auth/logout` | POST | Body `{refreshToken}` hợp lệ | 200 | Logged out successfully | V41 |
| 12 | Change password không token | `/api/auth/change-password` | POST | Body hợp lệ, không Authorization | 401 | Unauthorized | X41 |
| 13 | Change password yếu | `/api/auth/change-password` | POST | `newPassword="abcdefg"` | 400 | Password dưới 8 ký tự/thiếu policy | X5,X6,B1 |


