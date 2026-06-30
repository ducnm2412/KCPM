const assert = require("node:assert/strict");

Feature("Deadline Editor BVA");

const selectors = {
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
  conferenceCreateForm: '[data-testid="conference-create-form"]',
  conferenceName: '[data-testid="conference-name"]',
  conferenceCreateSubmit: '[data-testid="conference-create-submit"]',
  deadlineEditor: '[data-testid="deadline-editor"]',
  deadlineEmpty: '[data-testid="deadline-empty"]',
  deadlineAdd: '[data-testid="deadline-add"]',
  deadlineType: '[data-testid="deadline-type"]',
  deadlineDueDate: '[data-testid="deadline-due-date"]',
  deadlineDescription: '[data-testid="deadline-description"]',
  deadlineSave: '[data-testid="deadline-save"]',
  deadlineRow: '[data-testid^="deadline-row-"]',
};

const config = {
  adminEmail: process.env.E2E_LOGIN_EMAIL || "admin@uth.edu.vn",
  adminPassword: process.env.E2E_LOGIN_PASSWORD || "admin123",
};

const clearBrowserState = async (I) => {
  await I.executeScript(() => {
    try {
      window.localStorage.clear();
    } catch {}
    try {
      window.sessionStorage.clear();
    } catch {}
  });
};

const installAlertSpy = async (I) => {
  await I.executeScript(() => {
    window.__lastAlert = null;
    window.alert = (message) => {
      window.__lastAlert = String(message);
    };
  });
};

const getLastAlert = async (I) => {
  return I.executeScript(() => window.__lastAlert || "");
};

const loginAsChair = async (I) => {
  await I.amOnPage("/login");
  await I.waitForElement(selectors.loginEmail, 10);
  await I.fillField(selectors.loginEmail, config.adminEmail);
  await I.fillField(selectors.loginPassword, config.adminPassword);
  await I.click(selectors.loginSubmit);
  await I.waitInUrl("/app", 20);
};

const createConference = async (I) => {
  await I.amOnPage("/app/chair/conferences/new");
  await I.waitForElement(selectors.conferenceCreateForm, 20);
  await I.fillField(selectors.conferenceName, `E2E Conference ${Date.now()}`);
  await I.click(selectors.conferenceCreateSubmit);
  await I.waitInUrl("/app/chair/conference/", 20);

  const currentUrl = await I.grabCurrentUrl();
  const match = currentUrl.match(/\/app\/chair\/conference\/(\d+)\/config/);
  if (!match) {
    throw new Error(`Unable to determine created conference id from url: ${currentUrl}`);
  }
  return match[1];
};

const openDeadlineEditor = async (I) => {
  await clearBrowserState(I);
  await loginAsChair(I);
  const conferenceId = await createConference(I);
  await I.amOnPage(`/app/chair/conference/${conferenceId}/config?tab=deadlines`);
  await I.waitForElement(selectors.deadlineEditor, 20);
};

const addDeadline = async (I, { type, dueDate, description }) => {
  await I.click(selectors.deadlineAdd);
  await I.waitForElement(selectors.deadlineDueDate, 10);
  await I.selectOption(selectors.deadlineType, type);
  await I.fillField(selectors.deadlineDueDate, dueDate);
  if (description) {
    await I.fillField(selectors.deadlineDescription, description);
  }
  await I.click(selectors.deadlineSave);
  await I.waitForElement(selectors.deadlineRow, 10);
};

Scenario("BVA Deadline Editor shows empty state when no deadlines exist", async ({ I }) => {
  await openDeadlineEditor(I);
  await I.waitForElement(selectors.deadlineEmpty, 10);
});

Scenario("BVA Deadline Editor rejects saving without a due date", async ({ I }) => {
  await openDeadlineEditor(I);
  await installAlertSpy(I);

  await I.click(selectors.deadlineAdd);
  await I.waitForElement(selectors.deadlineSave, 10);
  await I.click(selectors.deadlineSave);

  const alertMessage = await getLastAlert(I);
  assert.match(
    alertMessage,
    /deadline|hạn chót|date and time|ngày giờ/i,
    `Expected deadline required alert, got: "${alertMessage}"`,
  );
});

Scenario("BVA Deadline Editor can add a submission deadline with a future date", async ({ I }) => {
  await openDeadlineEditor(I);

  await addDeadline(I, {
    type: "SUBMISSION",
    dueDate: "2099-12-31T23:59",
    description: "Submission deadline for BVA",
  });

  const rowCount = await I.grabNumberOfVisibleElements(selectors.deadlineRow);
  assert.equal(rowCount, 1, "Expected exactly one deadline row after saving");
});

Scenario("BVA Deadline Editor supports REVIEW and CAMERA_READY types", async ({ I }) => {
  await openDeadlineEditor(I);

  await addDeadline(I, {
    type: "REVIEW",
    dueDate: "2100-01-15T12:00",
    description: "Review deadline",
  });

  await addDeadline(I, {
    type: "CAMERA_READY",
    dueDate: "2100-02-15T12:00",
    description: "Camera-ready deadline",
  });

  const rowCount = await I.grabNumberOfVisibleElements(selectors.deadlineRow);
  assert.equal(rowCount, 2, "Expected two deadline rows for REVIEW and CAMERA_READY");
});
