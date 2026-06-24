# User API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm User/Admin API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| GET | `/api/users/me` | Lấy user hiện tại | Authenticated | `UserController.getCurrentUser` | used by auth/user service |
| PUT | `/api/users/me` | Cập nhật profile | Authenticated | `UserController.updateCurrentUser` | validates `UserDTO` |
| GET | `/api/users/{id}` | Lấy user theo id | ADMIN | `UserController.getUserById` | id not found |
| GET | `/api/users?page&size` | List users | ADMIN/CHAIR | `UserController.getAllUsers` | pagination boundary |
| GET | `/api/users/active/list?page&size` | List active users | ADMIN | `UserController.getActiveUsers` | pagination boundary |
| GET | `/api/users/search?keyword&page&size` | Search users | ADMIN/CHAIR | `UserController.searchUsers` | blank keyword returns 400 |
| PUT | `/api/users/{id}/deactivate` | Deactivate user | ADMIN | `UserController.deactivateUser` | self-deactivate risk |
| PUT | `/api/users/{id}/activate` | Activate user | ADMIN | `UserController.activateUser` | id not found |
| PUT | `/api/users/{id}/roles` | Update roles | ADMIN | `UserController.updateRoles` | invalid role |
| GET | `/api/users/stats/summary` | User stats | ADMIN | `UserController.getUserStats` | count consistency |
| GET | `/api/organizations` | List organizations | Public by SecurityConfig | `OrganizationController.getAll` | raw list, not `ApiResponse` |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Get current user thành công | `/api/users/me` | GET | Authorization hợp lệ | 200 | Trả `UserDTO` hiện tại | V41 |
| 2 | Get current user không token | `/api/users/me` | GET | Không Authorization | 401 | Unauthorized | X41 |
| 3 | Update profile hợp lệ | `/api/users/me` | PUT | Body `UserDTO` hợp lệ | 200 | Profile updated successfully | V9 |
| 4 | Update profile sai email | `/api/users/me` | PUT | Email sai định dạng | 400 | Validation failed | X2 |
| 5 | Get user by id admin | `/api/users/{id}` | GET | ADMIN token, `id=1` tồn tại | 200 | Trả `UserDTO` | V8,V41 |
| 6 | Get user by id không tồn tại | `/api/users/{id}` | GET | ADMIN token, `id=999999` | 404 | User not found | X8,B74 |
| 7 | Get user by id forbidden | `/api/users/{id}` | GET | AUTHOR token | 403 | Forbidden vì thiếu ADMIN | X10 |
| 8 | List users page min | `/api/users?page=0&size=20` | GET | ADMIN/CHAIR token | 200 | Trả page data | V17,V20,B5,B11 |
| 9 | List users page dưới min | `/api/users?page=-1&size=20` | GET | ADMIN token | 400 | Page âm không hợp lệ | X17,B5 |
| 10 | List users size trên max giả định | `/api/users?page=0&size=101` | GET | ADMIN token | 400 hoặc ghi risk nếu 200 | Không hợp lệ theo giả định kiểm thử | X21,B15 |
| 11 | Search users blank keyword | `/api/users/search?keyword=&page=0&size=20` | GET | ADMIN/CHAIR token | 400 | Keyword is required | X1 |
| 12 | Activate user thành công | `/api/users/{id}/activate` | PUT | ADMIN token, user inactive tồn tại | 200 | User activated successfully | V8,V41 |
| 13 | Deactivate user không phải admin | `/api/users/{id}/deactivate` | PUT | CHAIR/AUTHOR token | 403 | Forbidden | X10 |
| 14 | Update roles invalid role | `/api/users/{id}/roles` | PUT | Body `["UNKNOWN_ROLE"]` | 400 | Role không hợp lệ | X22 |
| 15 | Get organization public | `/api/organizations` | GET | Không token | 200 | Trả danh sách organization raw list | V43 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `UserApiSecurityTest` | JUnit 5 + MockMvc + Spring Security Test | `/users/me`, list/search users, activate/deactivate, roles, role matrix |
| `OrganizationApiContractTest` | JUnit 5 + MockMvc | Kiểm tra public access và response raw list/contract |

