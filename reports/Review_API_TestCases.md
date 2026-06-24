# Review API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Review/Rebuttal API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| GET | `/api/reviews/{id}` | Review detail | Authenticated | `ReviewController.getReview` | role visibility |
| GET | `/api/reviews/assignment/{assignmentId}` | Review by assignment | PC | `ReviewController.getReviewByAssignment` | FE treats 404 as null |
| GET | `/api/reviews/submission/{submissionId}` | Reviews by submission | Authenticated | `ReviewController.getReviewsBySubmission` | double blind |
| POST | `/api/reviews/draft` | Create/update review draft | PC | `ReviewController.createOrUpdateDraft` | required fields |
| POST | `/api/reviews/{id}/submit` | Submit review | PC | `ReviewController.submitReview` | submit twice |
| GET | `/api/reviews/submission/{submissionId}/average-score` | Average score | Authenticated | `ReviewController.getAverageScore` | no reviews |
| GET | `/api/reviews/conference/{conferenceId}/statistics` | Review stats | CHAIR/ADMIN | `ReviewController.getStatistics` | completion rate |
| GET | `/api/reviews/submission/{submissionId}/comments` | Internal comments | PC/CHAIR/ADMIN | `ReviewController.getComments` | role visibility |
| POST | `/api/reviews/submission/{submissionId}/comments` | Add internal comment | PC | `ReviewController.addComment` | content-type text/plain |
| GET | `/api/reviews/rebuttal/submission/{submissionId}` | Get rebuttal | Authenticated | `ReviewController.getRebuttal` | FE treats 404 as null |
| POST | `/api/reviews/rebuttal` | Create/update rebuttal | AUTHOR | `ReviewController.createOrUpdateRebuttal` | content required |
| POST | `/api/reviews/rebuttal/{id}/submit` | Submit rebuttal | AUTHOR | `ReviewController.submitRebuttal` | state transition |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Get review detail hợp lệ | `/api/reviews/{id}` | GET | Auth token, review id tồn tại | 200 | Trả `ReviewResponseDTO` | V41 |
| 2 | Get review not found | `/api/reviews/{id}` | GET | id không tồn tại | 404 | Review not found | X8 |
| 3 | Get review by assignment 404 | `/api/reviews/assignment/{assignmentId}` | GET | assignment chưa có review | 404 | FE xử lý thành null | X14 |
| 4 | Review draft hợp lệ | `/api/reviews/draft` | POST | PC token, assignmentId, summary, comments, score, isConfidential hợp lệ | 200 | Tạo/cập nhật draft | V32,V34,B45 |
| 5 | Review draft thiếu score | `/api/reviews/draft` | POST | Body thiếu `score` | 400 | Score is required | X34 |
| 6 | Review draft thiếu comments | `/api/reviews/draft` | POST | Body thiếu `comments` | 400 | Comments are required | X26 |
| 7 | Review rating dưới min | `/api/reviews/draft` | POST | `overallRating=0` theo giả định kiểm thử | 400 hoặc ghi risk nếu 200 | Không hợp lệ theo BVA | X32,B43 |
| 8 | Review rating trên max | `/api/reviews/draft` | POST | `overallRating=6` theo giả định kiểm thử | 400 hoặc ghi risk nếu 200 | Không hợp lệ theo BVA | X33,B49 |
| 9 | Submit review thành công | `/api/reviews/{id}/submit` | POST | PC owner, review DRAFT | 200 | Status SUBMITTED | V16 |
| 10 | Submit review hai lần | `/api/reviews/{id}/submit` | POST | Review đã SUBMITTED | 400/409 | Không cho submit lại | X16 |
| 11 | Get average score no reviews | `/api/reviews/submission/{submissionId}/average-score` | GET | Submission chưa có review | 200 | reviewCount=0, averageScore theo design | V14 |
| 12 | Add internal comment text/plain | `/api/reviews/submission/{submissionId}/comments` | POST | PC token, body text/plain `"comment"` | 200 | Trả `ReviewCommentDTO` | V41 |
| 13 | Add internal comment JSON sai contract | `/api/reviews/submission/{submissionId}/comments` | POST | JSON `{content:"comment"}` | 400/415 | Không hợp lệ do content-type/body không đúng | X25 |
| 14 | Create rebuttal hợp lệ | `/api/reviews/rebuttal` | POST | AUTHOR token, submissionId, content | 200 | Tạo/cập nhật rebuttal draft | V14,V16 |
| 15 | Create rebuttal thiếu content | `/api/reviews/rebuttal` | POST | Body thiếu `content` | 400 | Content is required | X26 |
| 16 | Submit rebuttal hai lần | `/api/reviews/rebuttal/{id}/submit` | POST | Rebuttal đã SUBMITTED | 400/409 | State conflict | X16 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `ReviewApiTest` | JUnit 5 + MockMvc + Spring Security Test | Draft/submit review, comments text/plain, rebuttal, rating/confidence boundary, role visibility |

