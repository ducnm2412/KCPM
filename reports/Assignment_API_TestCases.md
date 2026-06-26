# Assignment API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Assignment API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| POST | `/api/assignments` | Manual assign | CHAIR/ADMIN | `AssignmentController.createAssignment` | duplicate/COI |
| POST | `/api/assignments/bulk` | Bulk assign | CHAIR/ADMIN | `AssignmentController.bulkAssign` | partial failure |
| POST | `/api/assignments/auto-assign` | Auto assign | CHAIR/ADMIN | `AssignmentController.autoAssign` | numberOfReviewers min 1 |
| GET | `/api/assignments/submission/{submissionId}/suggestions` | Reviewer suggestions | CHAIR/ADMIN | `AssignmentController.getSuggestions` | scores 0..1 |
| POST | `/api/assignments/{id}/accept` | Accept assignment | PC | `AssignmentController.acceptAssignment` | state/owner |
| POST | `/api/assignments/{id}/decline` | Decline assignment | PC | `AssignmentController.declineAssignment` | state/owner |
| PUT | `/api/assignments/{id}/reassign` | Reassign | CHAIR/ADMIN | `AssignmentController.reassignAssignment` | newReviewerId required |
| DELETE | `/api/assignments/{id}` | Delete assignment | CHAIR/ADMIN | `AssignmentController.deleteAssignment` | review exists conflict |
| GET | `/api/assignments/submission/{submissionId}` | Assignments by submission | CHAIR/ADMIN | `AssignmentController.getAssignmentsBySubmission` | empty list |
| GET | `/api/assignments/my` | My assignments | PC | `AssignmentController.getMyAssignments` | used by review UI |
| GET | `/api/assignments/{id}` | Assignment detail | Authenticated | `AssignmentController.getAssignment` | visibility |
| GET | `/api/assignments/conference/{conferenceId}/statistics` | Assignment stats | CHAIR/ADMIN | `AssignmentController.getStatistics` | distribution totals |
| GET | `/api/assignments/conference/{conferenceId}/quality-metrics` | Assignment quality | CHAIR/ADMIN | `AssignmentController.getQualityMetrics` | score/rate |
| GET | `/api/assignments/{id}/file` | Download anonymized file | FE expects PC/auth | Missing backend | mismatch |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Create assignment thành công | `/api/assignments` | POST | CHAIR token, submissionId/reviewerId tồn tại, không COI | 200 | Trả `AssignmentResponseDTO` | V29,V31,V41 |
| 2 | Create assignment thiếu reviewerId | `/api/assignments` | POST | Body thiếu `reviewerId` | 400 | Reviewer ID is required | X26 |
| 3 | Create assignment duplicate | `/api/assignments` | POST | Cùng submissionId và reviewerId đã assign | 400/409 | Duplicate assignment | X31 |
| 4 | Create assignment wrong role | `/api/assignments` | POST | AUTHOR token | 403 | Forbidden | X13 |
| 5 | Bulk assign partial failure | `/api/assignments/bulk` | POST | List có 1 assignment hợp lệ, 1 assignment duplicate | 200/207 | Response có createdAssignments và failedAssignments | X31 |
| 6 | Auto assign reviewer count min | `/api/assignments/auto-assign` | POST | `{submissionId, numberOfReviewers:1}` | 200 | Tạo tối đa 1 assignment | V29,B36 |
| 7 | Auto assign reviewer count dưới min | `/api/assignments/auto-assign` | POST | `numberOfReviewers=0` | 400 | Min là 1 | X29,B36 |
| 8 | Auto assign reviewer vượt khả dụng | `/api/assignments/auto-assign` | POST | `numberOfReviewers > available reviewers` | 200/400 | Có failedAssignments hoặc lỗi business rõ ràng | X30,B42 |
| 9 | Get suggestions hợp lệ | `/api/assignments/submission/{submissionId}/suggestions` | GET | CHAIR token, submissionId tồn tại | 200 | Trả suggestions, score 0..1 | V14,B50-B56 |
| 10 | Accept assignment đúng PC | `/api/assignments/{id}/accept` | POST | PC assignee token | 200 | Status ACCEPTED | V41 |
| 11 | Decline assignment sai reviewer | `/api/assignments/{id}/decline` | POST | PC không phải assignee | 403 | Forbidden | X43 |
| 12 | Reassign thiếu newReviewerId | `/api/assignments/{id}/reassign` | PUT | Body thiếu `newReviewerId` | 400 | New reviewer ID is required | X26 |
| 13 | Delete assignment có submitted review | `/api/assignments/{id}` | DELETE | Assignment đã có review submitted | 400/409 | Không cho xóa vì state conflict | X16 |
| 14 | Get my assignments | `/api/assignments/my` | GET | PC token | 200 | Trả assignments của reviewer | V41 |
| 15 | Get assignment not found | `/api/assignments/{id}` | GET | id không tồn tại | 404 | Assignment not found | X8 |
| 16 | Assignment file endpoint mismatch | `/api/assignments/{id}/file` | GET | PC token, assignmentId tồn tại | 404 | Backend chưa có endpoint | X8 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `AssignmentApiTest` | JUnit 5 + MockMvc + Spring Security Test | Manual/bulk/auto assign, accept/decline, reassign, duplicate, COI, reviewer count boundary |
| `FrontendBackendContractMismatchTest` | JUnit 5 + MockMvc | Ghi nhận `/api/assignments/{id}/file` chưa có backend mapping |

