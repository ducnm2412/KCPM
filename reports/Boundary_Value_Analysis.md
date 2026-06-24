# Boundary Value Analysis

Nguồn dữ liệu: `API_ENDPOINT_AND_TEST_PLAN.md`.

## Bảng giá trị biên

| Biến đầu vào | API liên quan | min | min+ | nominal | max- | max | dưới min | trên max | Tag biên |
| ------------ | ------------- | --: | ---: | ------: | ---: | --: | -------: | -------: | -------- |
| Password length | Register, change-password, reset-password | 8 | 9 | 12 | Giả định không có max rõ | Giả định không có max rõ | 7 | N/A | B1-B4 |
| Page | List users, search users, audit logs | 0 | 1 | 5 | N/A | N/A | -1 | N/A | B5-B8 |
| Size | List users, search users, audit logs | 1 | 2 | 20 | 99 | 100 | 0 | 101 | B9-B15 |
| Title bài nộp | Create/update submission, AI keyword/spell-check | 1 | 2 | 100 | 499 | 500 | 0 | 501 | B16-B22 |
| Abstract bài nộp | Create/update submission, AI APIs | 1 | 2 | 1000 | 4999 | 5000 | 0 | 5001 | B23-B29 |
| Keywords | Create/update submission | 0 | 1 | 100 | 999 | 1000 | N/A | 1001 | B30-B35 |
| Reviewer count | Auto assign reviewers | 1 | 2 | 3 | Giả định available - 1 | Giả định available | 0 | Giả định available + 1 | B36-B42 |
| Rating / Confidence | Review draft | 1 | 2 | 3 | 4 | 5 | 0 | 6 | B43-B49 |
| Similarity score | AI similarity hint, assignment suggestions | 0 | 0.01 | 0.5 | 0.99 | 1 | -0.01 | 1.01 | B50-B56 |
| File size PDF | Submission upload, camera-ready upload | 1 byte | 2 bytes | 1 MB | 20 MB - 1 byte | 20 MB | 0 byte/missing | 20 MB + 1 byte | B57-B63 |
| Deadline | Camera-ready open, conference deadlines | Hiện tại hoặc min hợp lệ theo rule | Hiện tại + 1 phút | Tương lai + 7 ngày | N/A | N/A | Quá khứ | Sai định dạng hoặc start > end | B64-B69 |
| User/Conference/Submission ID | Path params `{id}`, `{conferenceId}`, `{submissionId}` | 1 | 2 | 100 | N/A | N/A | 0 hoặc -1 | ID rất lớn không tồn tại | B70-B74 |

## Ghi chú kiểm thử

- `size <= 100`, rating/confidence `1..5`, reviewer capacity max là giả định kiểm thử vì file nguồn ghi rõ cần xác nhận/enforce từ backend.
- File upload dùng mốc 20MB theo cấu hình/ghi chú trong test plan.
- Với các biến không có max rõ ràng, test automation nên vẫn có ca "chuỗi rất dài" để bắt lỗi performance hoặc validation thiếu.

