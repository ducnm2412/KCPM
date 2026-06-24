# Ke hoach test BVA bang CodeceptJS cho frontend

Tai lieu nay tong hop cac ca can test theo ky thuat BVA (Boundary Value Analysis) cho thu muc `frontend`. Cac selector da duoc bo sung bang `data-testid` de CodeceptJS co the test on dinh, khong phu thuoc vao text hien thi.

## Nguyen tac BVA

Voi moi truong co bien, can test toi thieu 3 diem:

- `min - 1`: gia tri ngay duoi bien, ky vong fail.
- `min`: gia tri tai bien, ky vong pass.
- `min + 1`: gia tri ngay tren bien, ky vong pass.
- Voi bien tren thi dung `max - 1`, `max`, `max + 1`.

Khi truong chi co required/optional, bien quan trong la rong, chi co khoang trang, va gia tri hop le toi thieu.

## Auth

| Man hinh | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Login | `login-email`, `login-password`, `login-submit` | Email rong hoac password rong | Browser required chan submit |
| Login | `login-email`, `login-password`, `login-submit` | Sai password | Hien loi dang nhap |
| Register | `register-password`, `register-confirm-password` | Password 7 ky tu | Fail vi nho hon 8 |
| Register | `register-password`, `register-confirm-password` | Password 8 ky tu | Pass validation |
| Register | `register-password`, `register-confirm-password` | Password 9 ky tu | Pass validation |
| Register | `register-email` | Sai format `abc@`, `abc.com` | Fail |
| Register | `register-email` | Dung format `a@b.co` | Pass |
| Register | `register-first-name`, `register-last-name`, `register-organization` | Bo trong tung truong required | Fail |

## Submission

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Title required | `submission-title`, `submission-submit` | Rong | Fail |
| Title required | `submission-title`, `submission-submit` | Chi khoang trang | Hien `submission-error` |
| Title required | `submission-title`, `submission-submit` | 1 ky tu | Pass validation frontend |
| Abstract required | `submission-abstract`, `submission-submit` | Rong | Fail |
| Abstract required | `submission-abstract`, `submission-submit` | Chi khoang trang | Hien `submission-error` |
| Abstract required | `submission-abstract`, `submission-submit` | 1 ky tu | Pass validation frontend |
| Keywords optional | `submission-keywords` | Rong | Tao mang keywords rong |
| Keywords parse | `submission-keywords` | `ai` | 1 keyword |
| Keywords parse | `submission-keywords` | `ai, ml` | 2 keywords |
| Keywords parse | `submission-keywords` | `ai,, ml, ` | Bo keyword rong, con 2 keyword |
| Track optional | `submission-track` | Khong chon | `trackId` undefined |
| Track optional | `submission-track` | Chon 1 track | Gui dung `trackId` |
| PDF upload | `submission-pdf-file` | Khong chon file | Van tao draft duoc |
| PDF upload | `submission-pdf-file` | PDF `20MB - 1 byte` | Pass |
| PDF upload | `submission-pdf-file` | PDF dung `20MB` | Pass |
| PDF upload | `submission-pdf-file` | PDF `20MB + 1 byte` | Hien `submission-error` |

## Author Editor

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Danh sach author | `author-empty` | 0 author | Hien empty state |
| Them author | `author-add`, `author-first-name`, `author-last-name`, `author-save` | First name rong | Alert loi |
| Them author | `author-add`, `author-first-name`, `author-last-name`, `author-save` | Last name rong | Alert loi |
| Them author | `author-add`, `author-first-name`, `author-last-name`, `author-save` | First/last name 1 ky tu | Them author thanh cong |
| Email author | `author-email` | Rong | Pass vi optional |
| Email author | `author-email` | Sai format | Browser email validation chan |
| Corresponding | `author-corresponding`, `author-row-0` | Author dau tien | Mac dinh la corresponding |
| Corresponding | `author-set-corresponding-1` | 2 authors | Chi 1 author la corresponding |
| Reorder | `author-move-up-0` | Author dau tien | Nut disabled |
| Reorder | `author-move-down-{last}` | Author cuoi | Nut disabled |
| Reorder | `author-move-up-1`, `author-move-down-0` | 2 authors | Thu tu doi dung |

## Review

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Summary required | `review-summary`, `review-save` | Rong | Fail |
| Summary required | `review-summary`, `review-save` | Chi khoang trang | Hien `review-error` |
| Summary required | `review-summary`, `review-save` | 1 ky tu | Pass validation frontend |
| Comments required | `review-comments`, `review-save` | Rong | Fail |
| Comments required | `review-comments`, `review-save` | Chi khoang trang | Hien `review-error` |
| Comments required | `review-comments`, `review-save` | 1 ky tu | Pass validation frontend |
| Score enum | `review-score` | Tung gia tri enum | Gui dung score |
| Overall rating | `review-overall-rating` | 0 | Fail HTML min/backend |
| Overall rating | `review-overall-rating` | 1 | Pass |
| Overall rating | `review-overall-rating` | 5 | Pass |
| Overall rating | `review-overall-rating` | 6 | Fail HTML max/backend |
| Confidence | `review-confidence` | 0 | Fail HTML min/backend |
| Confidence | `review-confidence` | 1 | Pass |
| Confidence | `review-confidence` | 5 | Pass |
| Confidence | `review-confidence` | 6 | Fail HTML max/backend |
| Deadline/status lock | `review-locked-warning`, `review-save` | Qua deadline hoac da submit | Form/nut save disabled |

## Conference

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Tao conference | `conference-name`, `conference-create-submit` | Name rong | Fail |
| Tao conference | `conference-name`, `conference-create-submit` | Name chi khoang trang | Hien `conference-create-error` |
| Tao conference | `conference-name`, `conference-create-submit` | Name 1 ky tu | Pass validation frontend |
| Acronym optional | `conference-acronym` | Rong | Pass |
| Acronym optional | `conference-acronym` | 1 ky tu | Pass |
| Review mode | `conference-review-mode` | `SINGLE_BLIND` | Pass |
| Review mode | `conference-review-mode` | `DOUBLE_BLIND` | Pass |

## Track Editor

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Track list | `track-empty` | 0 track | Hien empty state |
| Track name | `track-add`, `track-name`, `track-save` | Rong | Alert loi |
| Track name | `track-add`, `track-name`, `track-save` | Chi khoang trang | Alert loi |
| Track name | `track-add`, `track-name`, `track-save` | 1 ky tu | Them track thanh cong |
| Active | `track-active` | Checked | Track active |
| Active | `track-active` | Unchecked | Track inactive |
| Edit/delete | `track-edit-0`, `track-delete-0` | Track dau danh sach | Sua/xoa dung dong |

## Deadline Editor

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Deadline list | `deadline-empty` | 0 deadline | Hien empty state |
| Due date required | `deadline-add`, `deadline-due-date`, `deadline-save` | Rong | Alert loi |
| Due date | `deadline-due-date` | Qua khu | Frontend cho nhap, can xac nhan backend reject hay accept |
| Due date | `deadline-due-date` | Hien tai/sat hien tai | Kiem tra xu ly can deadline |
| Due date | `deadline-due-date` | Tuong lai | Pass |
| Type enum | `deadline-type` | `SUBMISSION` | Pass |
| Type enum | `deadline-type` | `REVIEW` | Pass |
| Type enum | `deadline-type` | `CAMERA_READY` | Pass |
| Hard deadline | `deadline-hard` | Checked | Luu hard deadline |
| Hard deadline | `deadline-hard` | Unchecked | Luu soft deadline |

## Camera-ready

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Upload availability | `camera-ready-upload-closed` | `canUpload=false` | Khong hien form upload |
| Upload availability | `camera-ready-upload-form` | `canUpload=true` | Hien form upload |
| File type | `camera-ready-file` | Non-PDF | Hien `camera-ready-error` |
| File size | `camera-ready-file` | PDF `20MB - 1 byte` | Pass |
| File size | `camera-ready-file` | PDF dung `20MB` | Pass |
| File size | `camera-ready-file` | PDF `20MB + 1 byte` | Hien `camera-ready-error` |
| Copyright | `camera-ready-confirm-copyright` | Chua tick checkbox | Nut disabled |
| Copyright | `camera-ready-copyright` | Tick checkbox | Nut confirm enabled neu duoc phep confirm |
| Copyright | `camera-ready-copyright` | Da confirm copyright | Checkbox disabled |

## Manual Assignment

| Chuc nang | Selector | Bien/gia tri | Ky vong |
| --- | --- | --- | --- |
| Reviewer required | `assignment-reviewer`, `assignment-submit` | Khong chon reviewer | Nut submit disabled hoac hien `assignment-error` |
| Reviewer list | `assignment-reviewer` | 0 accepted reviewer | Khong submit duoc |
| Reviewer list | `assignment-reviewer` | 1 accepted reviewer | Chon va submit duoc |
| Workload | `assignment-workload` | `LOW`/`NORMAL` | Hien thong tin workload |
| Workload | `assignment-workload-high` | `HIGH` | Hien warning |
| Workload | `assignment-workload-overloaded` | `OVERLOADED` | Hien danger, backend nen chan assign |
| Primary reviewer | `assignment-primary` | Unchecked | Gui `isPrimary=false` |
| Primary reviewer | `assignment-primary` | Checked | Gui `isPrimary=true` |

## Goi y to chuc file CodeceptJS

- `auth_bva_test.js`: login, register, forgot password, reset password.
- `submission_bva_test.js`: submission required fields, keywords, PDF boundary, author editor.
- `review_bva_test.js`: summary/comments/rating/confidence/deadline lock.
- `conference_bva_test.js`: create conference, track, deadline.
- `camera_ready_bva_test.js`: upload file boundary va copyright.
- `assignment_bva_test.js`: reviewer selection va workload.

## Luu y khi viet test file upload

Nen tao fixture file trong `e2e/fixtures`:

- `valid-small.pdf`: PDF nho hop le.
- `valid-20mb-minus-1.pdf`: kich thuoc `20 * 1024 * 1024 - 1` bytes.
- `valid-20mb.pdf`: kich thuoc dung `20 * 1024 * 1024` bytes.
- `invalid-20mb-plus-1.pdf`: kich thuoc `20 * 1024 * 1024 + 1` bytes.
- `invalid.txt`: file khong phai PDF.

Neu moi truong CI khong muon luu file 20MB trong repo, co the generate file fixtures truoc khi chay test.
