const assert = require("node:assert/strict");

Feature("Conference BVA");

const selectors = {
  conferenceCreateForm: '[data-testid="conference-create-form"]',
  conferenceCreateError: '[data-testid="conference-create-error"]',
  conferenceName: '[data-testid="conference-name"]',
  conferenceAcronym: '[data-testid="conference-acronym"]',
  conferenceReviewMode: '[data-testid="conference-review-mode"]',
  conferenceCreateSubmit: '[data-testid="conference-create-submit"]',

  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
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

const getFieldValidity = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    const element = document.querySelector(fieldSelector);

    return element
      ? {
          exists: true,
          valid: element.checkValidity(),
          valueMissing: element.validity.valueMissing,
          validationMessage: element.validationMessage,
        }
      : { exists: false };
  }, selector);
};

const getInputValue = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    return document.querySelector(fieldSelector)?.value || "";
  }, selector);
};

const loginAsChair = (I) => {
  I.amOnPage("/login");

  I.waitForElement(selectors.loginEmail, 10);

  I.fillField(selectors.loginEmail, config.adminEmail);
  I.fillField(selectors.loginPassword, config.adminPassword);

  I.click(selectors.loginSubmit);

  I.waitInUrl("/app", 20);
};

const openConferenceForm = async (I) => {
  await clearBrowserState(I);

  loginAsChair(I);

  I.amOnPage("/app/chair/conferences/new");

  I.waitForElement(selectors.conferenceCreateForm, 20);
};

Scenario("BVA Conference Name Empty", async ({ I }) => {
  await openConferenceForm(I);

  I.click(selectors.conferenceCreateSubmit);

  const validity = await getFieldValidity(I, selectors.conferenceName);

  assert.equal(validity.exists, true);
  assert.equal(validity.valid, false);
  assert.equal(validity.valueMissing, true);
});

Scenario("BVA Conference Name Spaces Only", async ({ I }) => {
  await openConferenceForm(I);

  I.fillField(selectors.conferenceName, "     ");

  I.click(selectors.conferenceCreateSubmit);

  I.waitForElement(selectors.conferenceCreateError, 10);
});

Scenario("BVA Conference Name One Character", async ({ I }) => {
  await openConferenceForm(I);

  I.fillField(selectors.conferenceName, "A");

  const validity = await getFieldValidity(I, selectors.conferenceName);

  assert.equal(validity.valid, true);
});

Scenario("BVA Conference Acronym Empty", async ({ I }) => {
  await openConferenceForm(I);

  I.fillField(selectors.conferenceAcronym, "");

  assert.equal(
    await getInputValue(I, selectors.conferenceAcronym),
    ""
  );
});

Scenario("BVA Conference Acronym One Character", async ({ I }) => {
  await openConferenceForm(I);

  I.fillField(selectors.conferenceAcronym, "A");

  assert.equal(
    await getInputValue(I, selectors.conferenceAcronym),
    "A"
  );
});

Scenario("BVA Conference Review Mode SINGLE_BLIND", async ({ I }) => {
  await openConferenceForm(I);

  I.selectOption(
    selectors.conferenceReviewMode,
    "SINGLE_BLIND"
  );

  assert.equal(
    await getInputValue(selectors.conferenceReviewMode),
    "SINGLE_BLIND"
  );
});

Scenario("BVA Conference Review Mode DOUBLE_BLIND", async ({ I }) => {
  await openConferenceForm(I);

  I.selectOption(
    selectors.conferenceReviewMode,
    "DOUBLE_BLIND"
  );

  assert.equal(
    await getInputValue(I, selectors.conferenceReviewMode),
    "DOUBLE_BLIND"
  );
});