const assert = require("node:assert/strict");

Feature("Author Editor BVA");

const selectors = {
  alertDanger: ".alert-danger",
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
  registerFirstName: '[data-testid="register-first-name"]',
  registerLastName: '[data-testid="register-last-name"]',
  registerOrganization: '[data-testid="register-organization"]',
  registerOrganizationOption: '[data-testid="organization-option"]',
  registerEmail: '[data-testid="register-email"]',
  registerPassword: '[data-testid="register-password"]',
  registerConfirmPassword: '[data-testid="register-confirm-password"]',
  registerSubmit: '[data-testid="register-submit"]',
  submissionForm: '[data-testid="submission-form"]',
  authorEmpty: '[data-testid="author-empty"]',
  authorAdd: '[data-testid="author-add"]',
  authorFirstName: '[data-testid="author-first-name"]',
  authorLastName: '[data-testid="author-last-name"]',
  authorEmail: '[data-testid="author-email"]',
  authorCorresponding: '[data-testid="author-corresponding"]',
  authorSave: '[data-testid="author-save"]',
  authorRow0: '[data-testid="author-row-0"]',
  authorRow1: '[data-testid="author-row-1"]',
  authorMoveUp0: '[data-testid="author-move-up-0"]',
  authorMoveDown0: '[data-testid="author-move-down-0"]',
  authorMoveUp1: '[data-testid="author-move-up-1"]',
  authorMoveDown1: '[data-testid="author-move-down-1"]',
  authorSetCorresponding1: '[data-testid="author-set-corresponding-1"]',
};

const config = {
  conferenceId: process.env.E2E_CONFERENCE_ID || "1",
  authorEmail: process.env.E2E_AUTHOR_EMAIL || process.env.E2E_LOGIN_EMAIL,
  authorPassword: process.env.E2E_AUTHOR_PASSWORD || process.env.E2E_LOGIN_PASSWORD,
  registerPassword: process.env.E2E_REGISTER_PASSWORD,
  organizationSearch: process.env.E2E_ORGANIZATION_SEARCH || "UTH",
};

const uniqueEmail = (prefix) => `codecept.${prefix}.${Date.now()}@example.com`;

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
          typeMismatch: element.validity.typeMismatch,
          validationMessage: element.validationMessage,
        }
      : { exists: false };
  }, selector);
};

const getDisabledState = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    const element = document.querySelector(fieldSelector);
    return element ? element.disabled : null;
  }, selector);
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

const loginExistingAuthor = (I) => {
  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);
  I.fillField(selectors.loginEmail, config.authorEmail);
  I.fillField(selectors.loginPassword, config.authorPassword);
  I.click(selectors.loginSubmit);
  I.waitInUrl("/app", 20);
};

const registerNewAuthor = (I) => {
  const email = uniqueEmail("author-editor");
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  I.fillField(selectors.registerFirstName, "Author");
  I.fillField(selectors.registerLastName, "Tester");
  I.fillField(selectors.registerOrganization, config.organizationSearch);
  I.waitForElement(selectors.registerOrganizationOption, 10);
  I.click(selectors.registerOrganizationOption);
  I.fillField(selectors.registerEmail, email);
  I.fillField(selectors.registerPassword, config.registerPassword);
  I.fillField(selectors.registerConfirmPassword, config.registerPassword);
  I.click(selectors.registerSubmit);
  I.waitInUrl("/app", 20);
  return email;
};

const ensureAuthorSession = async (I) => {
  await clearBrowserState(I);
  if (config.authorEmail && config.authorPassword) {
    loginExistingAuthor(I);
  } else {
    registerNewAuthor(I);
  }
};

const openNewSubmissionForm = async (I) => {
  await ensureAuthorSession(I);
  I.amOnPage(`/app/author/submissions/new?conferenceId=${config.conferenceId}`);
  I.waitForElement(selectors.submissionForm, 20);
};


Scenario("BVA Author Editor: 0 author hien empty state", async ({ I }) => {
  await openNewSubmissionForm(I);
  
  I.seeElement(selectors.authorEmpty);
});

Scenario("BVA Author Editor: First name / Last name rong hien alert loi", async ({ I }) => {
  await openNewSubmissionForm(I);
  await installAlertSpy(I);
  
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  
  I.fillField(selectors.authorFirstName, "");
  I.fillField(selectors.authorLastName, "Doe");
  I.click(selectors.authorSave);
  let alertMsg = await getLastAlert(I);

  assert.equal(alertMsg.toLowerCase().includes("first name"), true, "Thieu alert loi cho First name rong");
  

  await I.executeScript(() => window.__lastAlert = null); // Reset alert
  I.fillField(selectors.authorFirstName, "John");
  I.fillField(selectors.authorLastName, "");
  I.click(selectors.authorSave);
  alertMsg = await getLastAlert(I);

  assert.equal(alertMsg.toLowerCase().includes("last name"), true, "Thieu alert loi cho Last name rong");
});

Scenario("BVA Author Editor: First/last name 1 ky tu them thanh cong & Email rong pass", async ({ I }) => {
  await openNewSubmissionForm(I);
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  
  I.fillField(selectors.authorFirstName, "A");
  I.fillField(selectors.authorLastName, "B");
  I.fillField(selectors.authorEmail, "");
  I.click(selectors.authorSave);
  
  I.waitForElement(selectors.authorRow0, 5);
  I.see("A", selectors.authorRow0);
  I.see("B", selectors.authorRow0);
});

Scenario("BVA Author Editor: Email sai format bi browser validation chan", async ({ I }) => {
  await openNewSubmissionForm(I);
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorEmail, 5);
  
  I.fillField(selectors.authorEmail, "invalid-email-format");
  I.click(selectors.authorSave);
  
  const emailValidity = await getFieldValidity(I, selectors.authorEmail);
  assert.equal(emailValidity.exists, true);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.typeMismatch, true);
});

Scenario("BVA Author Editor: Mac dinh la corresponding & Chi 1 author la corresponding", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  I.fillField(selectors.authorFirstName, "Author");
  I.fillField(selectors.authorLastName, "One");
  I.click(selectors.authorSave);
  I.waitForElement(selectors.authorRow0, 5);
  
  // Dung seeElementInDOM thay cho seeElement de tranh loi not visible khi Dev dung CSS an the input
  I.seeElementInDOM(selectors.authorCorresponding);
  
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  I.fillField(selectors.authorFirstName, "Author");
  I.fillField(selectors.authorLastName, "Two");
  I.click(selectors.authorSave);
  I.waitForElement(selectors.authorRow1, 5);
  
  I.click(selectors.authorSetCorresponding1);
});

Scenario("BVA Author Editor: Reorder buttons (Move Up/Down) disabled dung & Thu tu doi dung", async ({ I }) => {
  await openNewSubmissionForm(I);
  
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  I.fillField(selectors.authorFirstName, "Author");
  I.fillField(selectors.authorLastName, "One");
  I.click(selectors.authorSave);
  I.waitForElement(selectors.authorRow0, 5);
  
  let upDisabled = await getDisabledState(I, selectors.authorMoveUp0);
  let downDisabled = await getDisabledState(I, selectors.authorMoveDown0);
  assert.equal(upDisabled, true, "Nut Move Up o dong duy nhat phai disabled");
  assert.equal(downDisabled, true, "Nut Move Down o dong duy nhat phai disabled");
  
  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 5);
  I.fillField(selectors.authorFirstName, "Author");
  I.fillField(selectors.authorLastName, "Two");
  I.click(selectors.authorSave);
  I.waitForElement(selectors.authorRow1, 5);
  
  upDisabled = await getDisabledState(I, selectors.authorMoveUp0);
  downDisabled = await getDisabledState(I, selectors.authorMoveDown0);
  assert.equal(upDisabled, true, "Dong dau tien khong the Move Up");
  assert.equal(downDisabled, false, "Dong dau tien co the Move Down");
  
  let upDisabled1 = await getDisabledState(I, selectors.authorMoveUp1);
  let downDisabled1 = await getDisabledState(I, selectors.authorMoveDown1);
  assert.equal(upDisabled1, false, "Dong cuoi co the Move Up");
  assert.equal(downDisabled1, true, "Dong cuoi khong the Move Down");
  
  I.click(selectors.authorMoveDown0);
  
  I.see("Two", selectors.authorRow0);
  I.see("One", selectors.authorRow1);
});
