# Conference API Test Cases

Nguồn: `API_ENDPOINT_AND_TEST_PLAN.md`, nhóm Conference/CFP API.

## Endpoint được frontend sử dụng

| Method | Endpoint | Chức năng | Auth/Role | Controller | Ghi chú |
| ------ | -------- | --------- | --------- | ---------- | ------- |
| GET | `/api/conferences/public` | Published conferences | Public | `ConferenceController.getPublishedConferences` | public portal |
| GET | `/api/conferences/my` | My chaired conferences | CHAIR/ADMIN | `ConferenceController.getMyConferences` | principal email -> user id |
| GET | `/api/conferences/{id}` | Conference detail | Public | `ConferenceController.getConference` | 404 invalid id |
| POST | `/api/conferences` | Create conference | ADMIN | `ConferenceController.createConference` | FE comment says chair/admin but BE admin only |
| PUT | `/api/conferences/{id}` | Update conference | CHAIR/ADMIN | `ConferenceController.updateConference` | ownership |
| DELETE | `/api/conferences/{id}` | Delete conference | ADMIN | `ConferenceController.deleteConference` | FE comment says chair/admin but BE admin only |
| GET | `/api/cfp/conference/{conferenceId}` | Get CFP | Public | `CFPController.getCFP` | 404 conference/CFP |
| POST | `/api/cfp` | Create/update CFP | CHAIR/ADMIN | `CFPController.createOrUpdateCFP` | required conferenceId |
| POST | `/api/cfp/{conferenceId}/publish` | Publish CFP | CHAIR/ADMIN | `CFPController.publishCFP` | state transition |
| POST | `/api/cfp/{conferenceId}/close` | Close CFP | CHAIR/ADMIN | `CFPController.closeCFP` | state transition |

## Test cases

| STT | Tên test case | API | Method | Input | Expected Status | Kết quả mong đợi | Tag |
| --: | ------------- | --- | ------ | ----- | --------------: | ---------------- | --- |
| 1 | Get published conferences public | `/api/conferences/public` | GET | Không token | 200 | Trả danh sách conference published | V43 |
| 2 | Get conference detail tồn tại | `/api/conferences/{id}` | GET | `id=1` tồn tại | 200 | Trả `ConferenceResponseDTO` | V11 |
| 3 | Get conference id không tồn tại | `/api/conferences/{id}` | GET | `id=999999` | 404 | Conference not found | X11,B74 |
| 4 | Create conference bằng ADMIN | `/api/conferences` | POST | ADMIN token, body `ConferenceCreateDTO` hợp lệ | 200 | Trả `ConferenceResponseDTO` | V11,V41 |
| 5 | Create conference bằng CHAIR | `/api/conferences` | POST | CHAIR token, body hợp lệ | 403 | Backend yêu cầu ADMIN | X13 |
| 6 | Create conference thiếu name | `/api/conferences` | POST | Body thiếu `name` | 400 | Validation failed | X23 |
| 7 | Update conference not found | `/api/conferences/{id}` | PUT | CHAIR/ADMIN token, id không tồn tại | 404 | Conference not found | X11 |
| 8 | Update conference không có quyền | `/api/conferences/{id}` | PUT | AUTHOR token | 403 | Forbidden | X13 |
| 9 | Delete conference bằng non-admin | `/api/conferences/{id}` | DELETE | CHAIR/AUTHOR token | 403 | Delete chỉ ADMIN | X13 |
| 10 | Get CFP public | `/api/cfp/conference/{conferenceId}` | GET | conferenceId tồn tại | 200 | Trả `CFPResponseDTO` | V13 |
| 11 | Save CFP thiếu conferenceId | `/api/cfp` | POST | CHAIR token, body thiếu `conferenceId` | 400 | Validation failed | X26 |
| 12 | Publish CFP state hợp lệ | `/api/cfp/{conferenceId}/publish` | POST | CHAIR/ADMIN token | 200 | CFP open/published | V12 |
| 13 | Close CFP không có quyền | `/api/cfp/{conferenceId}/close` | POST | AUTHOR token | 403 | Forbidden | X13 |

## Automation đề xuất

| Test class | Framework | Mục tiêu |
| ---------- | --------- | -------- |
| `ConferenceCfpApiTest` | JUnit 5 + MockMvc + Spring Security Test | Public read, create/update/delete conference, CFP save/publish/close, duplicate, not found |

