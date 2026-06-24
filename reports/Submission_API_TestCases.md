# Submission API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Submission/File API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| GET | `/api/submissions/my` | My submissions | AUTHOR | `SubmissionController.getMySubmissions` | empty list |
| GET | `/api/submissions/{id}` | Submission detail | AUTHOR/CHAIR/PC/ADMIN | `SubmissionController.getSubmission` | visibility/owner |
| GET | `/api/submissions/conference/{conferenceId}` | Conference submissions | CHAIR/ADMIN | `SubmissionController.getSubmissionsByConference` | 403 non chair/admin |
| POST | `/api/submissions` | Create draft submission | AUTHOR | `SubmissionController.createSubmission` | conferenceId/title/abstract required |
| PUT | `/api/submissions/{id}` | Update submission | AUTHOR | `SubmissionController.updateSubmission` | title/abstract/keyword boundary |
| DELETE | `/api/submissions/{id}` | Delete draft | AUTHOR | `SubmissionController.deleteSubmission` | only draft/owner |
| POST | `/api/submissions/{id}/upload-pdf` | Upload PDF | AUTHOR | `SubmissionController.uploadPdf` | PDF and max file size |
| POST | `/api/submissions/{id}/withdraw` | Withdraw submission | AUTHOR | `SubmissionController.withdrawSubmission` | state transition |
| POST | `/api/submissions/{id}/submit` | Submit submission | AUTHOR | `SubmissionController.submitSubmission` | deadline/PDF required |
| GET | `/api/submissions/{id}/file` | Download current file | AUTHOR/CHAIR/PC/ADMIN | `SubmissionController.downloadFile` | blob response |
| GET | `/api/submissions/{id}/files` | List file versions | AUTHOR/CHAIR/PC/ADMIN | `SubmissionController.getFileVersions` | empty versions |
| GET | `/api/submissions/{id}/files/{fileId}` | Download version | AUTHOR/CHAIR/PC/ADMIN | `SubmissionController.downloadFileVersion` | fileId ownership |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Get my submissions | `/api/submissions/my` | GET | AUTHOR token | 200 | Trả list submissions, có thể empty | V41 |
| 2 | Get my submissions wrong role | `/api/submissions/my` | GET | CHAIR/ADMIN token không AUTHOR | 403 | Forbidden | X13 |
| 3 | Get submission detail hợp lệ | `/api/submissions/{id}` | GET | Token role hợp lệ, id tồn tại | 200 | Trả `SubmissionResponseDTO` | V14,V15 |
| 4 | Get submission id không tồn tại | `/api/submissions/{id}` | GET | `id=999999` | 404 | Submission not found | X14,B74 |
| 5 | Create submission thành công | `/api/submissions` | POST | AUTHOR token, conferenceId tồn tại, title 100 ký tự, abstract 1000 ký tự | 200 | Tạo draft submission | V14,V23,V26,B18,B25 |
| 6 | Create submission thiếu title | `/api/submissions` | POST | Body thiếu `title` | 400 | Title required | X23 |
| 7 | Create submission title quá dài | `/api/submissions` | POST | Title 501 ký tự | 400 | Title vượt max 500 | X24,B22 |
| 8 | Create submission abstract rỗng | `/api/submissions` | POST | `abstractText=""` | 400 | Abstract required | X26,B23 |
| 9 | Create submission abstract quá dài | `/api/submissions` | POST | Abstract 5001 ký tự | 400 | Abstract vượt max 5000 | X27,B29 |
| 10 | Update submission hợp lệ | `/api/submissions/{id}` | PUT | AUTHOR owner, body title/abstract hợp lệ | 200 | Submission updated | V15,V23,V26 |
| 11 | Update submission không phải owner | `/api/submissions/{id}` | PUT | AUTHOR khác owner | 403 | Forbidden/business owner error | X43 |
| 12 | Delete draft thành công | `/api/submissions/{id}` | DELETE | AUTHOR owner, submission DRAFT | 200 | Submission deleted successfully | V16 |
| 13 | Delete submitted submission | `/api/submissions/{id}` | DELETE | AUTHOR owner, submission SUBMITTED | 400/409 | Không cho xóa state không hợp lệ | X16 |
| 14 | Upload PDF hợp lệ | `/api/submissions/{id}/upload-pdf` | POST | Multipart `file` là PDF hợp lệ dưới 20MB | 200 | Trả `SubmissionFileDTO` | V35,V36,V37 |
| 15 | Upload thiếu file | `/api/submissions/{id}/upload-pdf` | POST | Không có multipart field `file` | 400 | Missing file | X35 |
| 16 | Upload non-PDF | `/api/submissions/{id}/upload-pdf` | POST | File `.txt` hoặc PDF corrupt | 400 | Reject file type/content | X36 |
| 17 | Upload file vượt max | `/api/submissions/{id}/upload-pdf` | POST | PDF > 20MB | 400/413 | File vượt max size | X37,B63 |
| 18 | Submit submission hợp lệ | `/api/submissions/{id}/submit` | POST | Draft có PDF, còn deadline | 200 | Status chuyển SUBMITTED | V16 |
| 19 | Submit submission không có PDF | `/api/submissions/{id}/submit` | POST | Draft chưa upload PDF | 400/409 | Chưa đủ điều kiện submit | X16 |
| 20 | Withdraw submission hợp lệ | `/api/submissions/{id}/withdraw` | POST | AUTHOR owner, submission SUBMITTED | 200 | Status chuyển WITHDRAWN | V16 |
| 21 | Withdraw draft | `/api/submissions/{id}/withdraw` | POST | Submission DRAFT | 400/409 | State không hợp lệ | X16 |
| 22 | Download file hợp lệ | `/api/submissions/{id}/file` | GET | Role hợp lệ, file tồn tại | 200 | Response blob/resource PDF | V35,V41 |
| 23 | Download file không tồn tại | `/api/submissions/{id}/file` | GET | id tồn tại nhưng chưa có file | 404 | File not found | X14 |
| 24 | Download version sai fileId | `/api/submissions/{id}/files/{fileId}` | GET | fileId không thuộc submission | 404 | File version not found | X14 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `SubmissionApiTest` | JUnit 5 + Spring Boot Test + MockMvc + Spring Security Test | Create/update/upload/submit/withdraw/delete/download, owner/role, boundary title/abstract/file |

