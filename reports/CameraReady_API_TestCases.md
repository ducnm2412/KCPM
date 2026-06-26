# Camera-ready API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Camera-ready API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}` | Camera-ready detail | Authenticated/default | `AuthorCameraReadyController.getSubmission` | no explicit role annotation |
| POST | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | Upload camera-ready | Authenticated/default | `AuthorCameraReadyController.uploadVersion` | multipart `file`, header `X-User-Id` |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/versions` | List versions | Authenticated/default | `AuthorCameraReadyController.listVersions` | empty |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/versions/{versionId}/download` | Download version | Authenticated/default | `AuthorCameraReadyController.downloadVersion` | UUID versionId |
| POST | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/confirm-copyright` | Confirm copyright | Authenticated/default | `AuthorCameraReadyController.confirmCopyright` | body `{confirmed}`, header `X-User-Id` |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/submissions` | Chair list | Authenticated/default | `ChairCameraReadyController.listSubmissions` | returns Page |
| POST | `/api/v1/conferences/{conferenceId}/camera-ready/submissions/{submissionId}/review` | Review camera-ready | Authenticated/default | `ChairCameraReadyController.reviewSubmission` | enum mismatch risk |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/statistics` | Stats | Authenticated/default | `ChairCameraReadyController.getStatistics` | counts |
| GET | `/api/v1/conferences/{conferenceId}/camera-ready/export/{format}` | Export | Authenticated/default | `ChairCameraReadyController.export*` | json/csv/zip/pdf |
| POST | `/api/v1/conferences/{conferenceId}/camera-ready/open` | Open window | Authenticated/default | `ChairCameraReadyController.openCameraReady` | body `{deadline}`, header `X-User-Id` |
| POST | `/api/v1/conferences/{conferenceId}/camera-ready/close` | Close window | Authenticated/default | `ChairCameraReadyController.closeCameraReady` | body `{reason}`, header `X-User-Id` |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Get camera-ready detail hợp lệ | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}` | GET | Auth token, conferenceId/paperId tồn tại | 200 | Trả `CameraReadySubmission` | V11,V14,V41 |
| 2 | Get camera-ready detail not found | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}` | GET | paperId không tồn tại | 404 | Paper/camera-ready submission not found | X14 |
| 3 | Upload PDF hợp lệ | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | POST | Multipart PDF hợp lệ, header `X-User-Id` | 200 | Trả `VersionDTO` | V35,V36,V37 |
| 4 | Upload thiếu file | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | POST | Không có field `file` | 400 | Missing file | X35 |
| 5 | Upload non-PDF/corrupt | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | POST | File không phải PDF hoặc PDF corrupt | 400 | Reject file | X36 |
| 6 | Upload file vượt max | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | POST | PDF > 20MB | 400/413 | File quá lớn | X37,B63 |
| 7 | Upload thiếu X-User-Id | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/upload` | POST | Có file nhưng thiếu header `X-User-Id` | 400/401 | Thiếu user context | X41 |
| 8 | List versions empty | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/versions` | GET | Paper chưa upload version | 200 | Trả list rỗng | V14 |
| 9 | Download version invalid UUID | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/versions/{versionId}/download` | GET | `versionId=abc` | 400 | UUID sai định dạng | X15 |
| 10 | Confirm copyright hợp lệ | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/confirm-copyright` | POST | `{confirmed:true}`, header `X-User-Id` | 200 | copyrightConfirmed=true | V41 |
| 11 | Confirm copyright thiếu confirmed | `/api/v1/conferences/{conferenceId}/camera-ready/papers/{paperId}/confirm-copyright` | POST | `{}` | 400 | Field confirmed required | X26 |
| 12 | Open camera-ready deadline tương lai | `/api/v1/conferences/{conferenceId}/camera-ready/open` | POST | `{deadline: future ISO}`, header `X-User-Id` | 200 | Mở nộp camera-ready | V38,V41,B66 |
| 13 | Open camera-ready deadline quá khứ | `/api/v1/conferences/{conferenceId}/camera-ready/open` | POST | `{deadline: yesterday}` | 400 | Deadline quá khứ | X38,B64 |
| 14 | Close camera-ready hợp lệ | `/api/v1/conferences/{conferenceId}/camera-ready/close` | POST | `{reason:"deadline reached"}` | 200 | Đóng nộp camera-ready | V16 |
| 15 | Review camera-ready approved | `/api/v1/conferences/{conferenceId}/camera-ready/submissions/{submissionId}/review` | POST | UUID submissionId, body `{decision:"APPROVED"}` | 200 | Review accepted | V14,V41 |
| 16 | Review camera-ready invalid UUID | `/api/v1/conferences/{conferenceId}/camera-ready/submissions/{submissionId}/review` | POST | `submissionId=abc` | 400 | Path UUID sai định dạng | X15 |
| 17 | Export camera-ready PDF | `/api/v1/conferences/{conferenceId}/camera-ready/export/pdf` | GET | Auth token hợp lệ | 200 | Response blob/resource PDF | V41 |
| 18 | Export invalid format | `/api/v1/conferences/{conferenceId}/camera-ready/export/xlsx` | GET | format không mapping | 404 | Endpoint không tồn tại | X8 |
| 19 | Role authorization risk | Camera-ready endpoints | Any | Token role không phù hợp với action author/chair | 403 expected | Nếu backend trả 200, ghi bug phân quyền chưa rõ | X13 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `CameraReadyApiTest` | JUnit 5 + Spring Boot Test + MockMvc + Spring Security Test | Open/close, upload PDF, versions, review submission, export format, UUID/header validation |

