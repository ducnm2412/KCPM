# Equivalence Partitioning

Nguồn dữ liệu: `API_ENDPOINT_AND_TEST_PLAN.md`.

## Bảng phân hoạch lớp tương đương

| Biến đầu vào | API liên quan | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
| ------------ | ------------- | ---------- | --- | ---------------- | --- |
| Email | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/pc/invite` | Email đúng định dạng, domain hợp lệ | V1 | Rỗng hoặc thiếu field | X1 |
| Email | Auth/PC invite | Email mới khi đăng ký hoặc invite | V2 | Sai định dạng: `abc`, `a@`, `a@b` | X2 |
| Email | Auth/PC invite | Email đã tồn tại dùng cho login | V3 | Email đã tồn tại khi register hoặc invite trùng | X3 |
| Password | Register, login, change/reset password | Password mạnh, >= 8 ký tự, có chữ hoa/thường/số/ký tự đặc biệt | V4 | Rỗng hoặc thiếu password | X4 |
| Password | Register, change/reset password | Password đạt policy | V5 | Dưới 8 ký tự | X5 |
| Password | Register, change/reset password | Password hiện tại đúng khi đổi mật khẩu | V6 | Thiếu chữ hoa/thường/số/ký tự đặc biệt | X6 |
| Password | Login/change-password | Password đúng với tài khoản | V7 | Password sai | X7 |
| User ID | `/api/users/{id}`, activate/deactivate/roles | Số nguyên dương và tồn tại | V8 | ID không tồn tại | X8 |
| User ID | User Admin APIs | ID thuộc user được phép thao tác | V9 | ID âm, bằng 0, hoặc sai kiểu | X9 |
| User ID | User Admin APIs | Caller có role ADMIN | V10 | Caller không có role ADMIN | X10 |
| Conference ID | Conference/CFP/Reporting/Camera-ready APIs | Số nguyên dương và conference tồn tại | V11 | Conference không tồn tại | X11 |
| Conference ID | Protected conference APIs | Caller là CHAIR/ADMIN hợp lệ | V12 | ID âm, bằng 0, hoặc sai kiểu | X12 |
| Conference ID | Public conference APIs | Public ID xem được | V13 | Không có quyền với conference | X13 |
| Submission ID | Submission/Assignment/Review/Decision APIs | Số nguyên dương và submission tồn tại | V14 | Submission không tồn tại | X14 |
| Submission ID | Submission APIs | User là owner hoặc role được phép | V15 | ID sai kiểu, âm, bằng 0 | X15 |
| Submission state | Submit/withdraw/delete/review APIs | State hợp lệ cho action | V16 | State không hợp lệ, ví dụ submit lại | X16 |
| Page | List/search/audit APIs | `page >= 0` | V17 | `page < 0` | X17 |
| Page | List/search/audit APIs | Không truyền, dùng default `0` | V18 | Sai kiểu dữ liệu | X18 |
| Page | List/search/audit APIs | Page lớn hợp lệ, trả empty page | V19 | Không có quyền đọc danh sách | X19 |
| Size | List/search/audit APIs | Giả định kiểm thử `1 <= size <= 100` | V20 | `size < 1` | X20 |
| Size | List/search/audit APIs | Không truyền, dùng default `20` | V21 | `size > 100` theo giả định kiểm thử | X21 |
| Size | List/search/audit APIs | Size hợp lệ nhưng lớn hơn số bản ghi | V22 | Sai kiểu dữ liệu | X22 |
| Title bài nộp | Submission create/update, AI keyword/spell-check | 1 đến 500 ký tự | V23 | Thiếu hoặc rỗng | X23 |
| Title bài nộp | Submission/AI APIs | Unicode/tiếng Việt hợp lệ | V24 | Dài hơn 500 ký tự | X24 |
| Title bài nộp | Submission APIs | Chuỗi hợp lệ | V25 | Sai kiểu dữ liệu | X25 |
| Abstract bài nộp | Submission create/update, AI APIs | 1 đến 5000 ký tự | V26 | Thiếu hoặc rỗng | X26 |
| Abstract bài nộp | Submission/AI APIs | Nội dung khoa học hợp lệ | V27 | Dài hơn 5000 ký tự | X27 |
| Abstract bài nộp | AI APIs | Chuỗi hợp lệ cho AI | V28 | Sai kiểu dữ liệu | X28 |
| Reviewer count | `POST /api/assignments/auto-assign` | `numberOfReviewers >= 1` | V29 | `numberOfReviewers < 1` | X29 |
| Reviewer count | Auto/bulk assign | Không truyền, backend dùng default | V30 | Lớn hơn số reviewer khả dụng | X30 |
| Reviewer count | Bulk assign | Reviewer hợp lệ, không trùng | V31 | Reviewer trùng hoặc có COI | X31 |
| Rating / Confidence | `POST /api/reviews/draft` | Giả định kiểm thử 1 đến 5 | V32 | Nhỏ hơn 1 | X32 |
| Rating / Confidence | Review APIs | Optional nếu backend cho phép | V33 | Lớn hơn 5 | X33 |
| Rating / Confidence | Review APIs | Giá trị số nguyên hợp lệ | V34 | Sai kiểu dữ liệu | X34 |
| File upload PDF | Submission upload, camera-ready upload | PDF hợp lệ, trong giới hạn size | V35 | Thiếu file | X35 |
| File upload PDF | Upload APIs | Multipart field đúng tên `file` | V36 | Không phải PDF hoặc PDF corrupt | X36 |
| File upload PDF | Upload APIs | File dưới max size | V37 | Vượt max size, khoảng 20MB | X37 |
| Deadline | Camera-ready open, conference deadlines | Tương lai, đúng ISO date/time | V38 | Ngày quá khứ | X38 |
| Deadline | Camera-ready/conference APIs | Hiện tại hoặc tương lai gần nếu rule cho phép | V39 | Sai định dạng ngày | X39 |
| Deadline | Audit/reporting filters | `startDate <= endDate` | V40 | `startDate > endDate` | X40 |
| Role / Permission | Protected APIs | Token hợp lệ và role đúng | V41 | Không có token | X41 |
| Role / Permission | Protected APIs | Token hợp lệ nhưng role không đủ quyền | V42 | Token hết hạn hoặc sai format | X42 |
| Role / Permission | Public APIs | Không cần token | V43 | Có token nhưng không phải owner/resource scope | X43 |

