const assert = require("node:assert/strict");

Feature("Deadline Editor BVA");

const selectors = {
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
  conferenceCreateForm: '[data-testid="conference-create-form"]',
  conferenceName: '[data-testid="conference-name"]',
  conferenceCreateSubmit: '[data-testid="conference-create-submit"]',
  deadlineTab: '[data-testid="deadline-tab"]',
  deadlineEditor: '[data-testid="deadline-editor"]',
  deadlineEmpty: '[data-testid="deadline-empty"]',
  deadlineAdd: '[data-testid="deadline-add"]',
  deadlineType: '[data-testid="deadline-type"]',
  deadlineDueDate: '[data-testid="deadline-due-date"]',
  deadlineDescription: '[data-testid="deadline-description"]',
  deadlineHard: '[data-testid="deadline-hard"]',
  deadlineSave: '[data-testid="deadline-save"]',
  deadlineCancel: '[data-testid="deadline-cancel"]',
};

const config = {
  conferenceId: process.env.E2E_CONFERENCE_ID || undefined,
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

const loginAsChair = (I) => {
  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);
  I.fillField(selectors.loginEmail, config.adminEmail);
  I.fillField(selectors.loginPassword, config.adminPassword);
  I.click(selectors.loginSubmit);
  I.waitInUrl("/app", 20);
};

const createConferenceIfNeeded = async (I) => {
  if (config.conferenceId) {
    return config.conferenceId
  }

  // Create one conference via UI so the deadline editor test can run against a valid conference.
  I.amOnPage('/app/chair/conferences/new')
  I.waitForElement(selectors.conferenceCreateForm, 20)
  I.fillField(selectors.conferenceName, `E2E Conference ${Date.now()}`)
  I.click(selectors.conferenceCreateSubmit)

  // Wait for navigation to the created conference config page
  I.waitInUrl('/app/chair/conference/', 20)
  const currentUrl = await I.grabCurrentUrl()
  const match = currentUrl.match(/\/app\/chair\/conference\/(\d+)\/config/)
  if (!match) {
    throw new Error(`Unable to determine created conference id from url: ${currentUrl}`)
  }
  return match[1]
}

const openConferenceConfig = async (I) => {
  await clearBrowserState(I)
  loginAsChair(I)
  const conferenceId = await createConferenceIfNeeded(I)
  I.amOnPage(`/app/chair/conference/${conferenceId}/config?tab=deadlines`)
  I.waitForElement(selectors.deadlineEditor, 20)
};

Scenario("BVA Deadline Editor shows empty state when no deadlines exist", async ({ I }) => {
  await openConferenceConfig(I);
  I.waitForElement(selectors.deadlineEmpty, 10);
});

Scenario("BVA Deadline Editor rejects saving without a due date", async ({ I }) => {
  await openConferenceConfig(I);
  await installAlertSpy(I);

  I.click(selectors.deadlineAdd);
  I.waitForElement(selectors.deadlineSave, 10);
  I.click(selectors.deadlineSave);

  assert.notEqual(await getLastAlert(I), "");
});

Scenario("BVA Deadline Editor can add a submission deadline with a future date", async ({ I }) => {
  await openConferenceConfig(I);

  I.click(selectors.deadlineAdd);
  I.waitForElement(selectors.deadlineDueDate, 10);

  I.selectOption(selectors.deadlineType, "SUBMISSION");
  I.fillField(selectors.deadlineDueDate, "2099-12-31T23:59");
  I.fillField(selectors.deadlineDescription, "Submission deadline for BVA");
  I.click(selectors.deadlineHard);
  I.click(selectors.deadlineSave);

  I.waitForElement('[data-testid^="deadline-row-"]', 10);
  const rowCount = await I.grabNumberOfVisibleElements('[data-testid^="deadline-row-"]');
  assert.ok(rowCount > 0, "Expected at least one deadline row after saving");
});

Scenario("BVA Deadline Editor supports REVIEW and CAMERA_READY types", async ({ I }) => {
  await openConferenceConfig(I);

  I.click(selectors.deadlineAdd);
  I.waitForElement(selectors.deadlineType, 10);
  I.selectOption(selectors.deadlineType, "REVIEW");
  I.fillField(selectors.deadlineDueDate, "2100-01-15T12:00");
  I.fillField(selectors.deadlineDescription, "Review deadline");
  I.click(selectors.deadlineSave);

  I.click(selectors.deadlineAdd);
  I.waitForElement(selectors.deadlineType, 10);
  I.selectOption(selectors.deadlineType, "CAMERA_READY");
  I.fillField(selectors.deadlineDueDate, "2100-02-15T12:00");
  I.fillField(selectors.deadlineDescription, "Camera-ready deadline");
  I.click(selectors.deadlineSave);

  const rowCount = await I.grabNumberOfVisibleElements('[data-testid^="deadline-row-"]');
  assert.ok(rowCount >= 2, "Expected two deadline rows for REVIEW and CAMERA_READY");
});
