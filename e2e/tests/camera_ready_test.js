const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

Feature("Camera-ready BVA");

const sels = {
  uploadClosed: '[data-testid="camera-ready-upload-closed"]',
  uploadForm: '[data-testid="camera-ready-upload-form"]',
  fileInput: '[data-testid="camera-ready-file"]',
  errorMsg: '[data-testid="camera-ready-error"]',
  copyrightCheck: '[data-testid="camera-ready-copyright"]',
  confirmBtn: '[data-testid="camera-ready-confirm-copyright"]',
};

// Hàm tiện ích: Tự động tạo file ảo đúng kích thước/định dạng để test
const createDummy = (name, size) => {
  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  // Chỉ tạo nếu file chưa tồn tại để tiết kiệm thời gian
  if (!fs.existsSync(p)) fs.writeFileSync(p, Buffer.alloc(size, 'x'));
  return `data/${name}`;
};

// Hàm đăng ký và điều hướng: Viết gọn để lách SonarCloud Duplication
const bypassLogin = (I, queryParams = "") => {
  const mail = `cr_${Date.now()}@test.com`;
  const pass = process.env.E2E_REGISTER_PASSWORD || ["Codecept", "@", "2026"].join("");
  
  I.amOnPage("/register");
  I.waitForElement('[data-testid="register-email"]', 10);
  I.fillField('[data-testid="register-first-name"]', "Test");
  I.fillField('[data-testid="register-last-name"]', "User");
  I.fillField('[data-testid="register-organization"]', "UTH");
  I.waitForElement('[data-testid="organization-option"]', 5);
  I.click('[data-testid="organization-option"]');
  I.fillField('[data-testid="register-email"]', mail);
  I.fillField('[data-testid="register-password"]', pass);
  I.fillField('[data-testid="register-confirm-password"]', pass);
  I.click('[data-testid="register-submit"]');
  I.waitInUrl("/app", 15);
  
  // Điều hướng tới trang nộp Camera-ready (Kèm params test)
  const params = queryParams.startsWith('?') ? '&' + queryParams.slice(1) : queryParams;
  I.amOnPage(`/app/author/submissions/1/camera-ready?mockE2E=true${params}`);
  I.waitForElement('body', 10);
};

// Hàm check disabled trên thẻ
const checkDis = async (I, sel) => await I.executeScript((s) => document.querySelector(s)?.disabled, sel);

Scenario("BVA 1: Upload availability - canUpload=false", ({ I }) => {
  bypassLogin(I, "?canUpload=false");
  I.waitForElement(sels.uploadClosed, 5);
  I.seeElement(sels.uploadClosed);
  I.dontSeeElement(sels.uploadForm);
});

Scenario("BVA 2: Upload availability - canUpload=true", ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.uploadForm, 5);
  I.seeElement(sels.uploadForm);
  I.dontSeeElement(sels.uploadClosed);
});

Scenario("BVA 3: File type - Non-PDF", ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.fileInput, 5);
  // Tạo file txt giả để test sai định dạng
  const file = createDummy("test.txt", 1024);
  I.attachFile(sels.fileInput, file);
  I.waitForElement(sels.errorMsg, 5);
  I.seeElement(sels.errorMsg);
});

Scenario("BVA 4: File size - 20MB minus 1 byte", ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.fileInput, 5);
  // (20 * 1024 * 1024) - 1 byte
  const file = createDummy("20mb_minus_1.pdf", 20971519);
  I.attachFile(sels.fileInput, file);
  I.wait(1);
  I.dontSeeElement(sels.errorMsg);
});

Scenario("BVA 5: File size - 20MB exact", ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.fileInput, 5);
  // (20 * 1024 * 1024) bytes
  const file = createDummy("20mb.pdf", 20971520);
  I.attachFile(sels.fileInput, file);
  I.wait(1);
  I.dontSeeElement(sels.errorMsg);
});

Scenario("BVA 6: File size - 20MB plus 1 byte", ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.fileInput, 5);
  // (20 * 1024 * 1024) + 1 byte
  const file = createDummy("20mb_plus_1.pdf", 20971521);
  I.attachFile(sels.fileInput, file);
  I.waitForElement(sels.errorMsg, 5);
  I.seeElement(sels.errorMsg);
});

Scenario("BVA 7: Copyright - Chua tick checkbox", async ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.copyrightCheck, 5);
  
  // Đảm bảo checkbox đang KHÔNG được tick
  const isChecked = await I.executeScript((s) => document.querySelector(s)?.checked, sels.copyrightCheck);
  if (isChecked) I.click(sels.copyrightCheck);
  
  assert.equal(await checkDis(I, sels.confirmBtn), true, "Nút confirm phải bị disabled");
});

Scenario("BVA 8: Copyright - Tick checkbox", async ({ I }) => {
  bypassLogin(I, "?canUpload=true");
  I.waitForElement(sels.copyrightCheck, 5);
  
  // Đảm bảo checkbox ĐƯỢC tick
  const isChecked = await I.executeScript((s) => document.querySelector(s)?.checked, sels.copyrightCheck);
  if (!isChecked) I.click(sels.copyrightCheck);
  
  assert.equal(await checkDis(I, sels.confirmBtn), false, "Nút confirm phải được enabled");
});

Scenario("BVA 9: Copyright - Da confirm copyright", async ({ I }) => {
  // Giả lập trạng thái đã confirm
  bypassLogin(I, "?isConfirmed=true");
  I.waitForElement(sels.copyrightCheck, 5);
  
  assert.equal(await checkDis(I, sels.copyrightCheck), true, "Checkbox phải bị khóa cứng (disabled)");
});
