const assert = require("node:assert/strict");

Feature("Authentication");

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
  forgotPasswordEmail: '[data-testid="forgot-password-email"]',
  forgotPasswordSubmit: '[data-testid="forgot-password-submit"]',
  forgotPasswordSuccess: '[data-testid="forgot-password-success"]',
  resetPasswordNew: '[data-testid="reset-password-new"]',
  resetPasswordConfirm: '[data-testid="reset-password-confirm"]',
  resetPasswordSubmit: '[data-testid="reset-password-submit"]',
  resetPasswordError: '[data-testid="reset-password-error"]',
};

const testUser = {
  email: `codecept.${Date.now()}@example.com`,
  password: process.env.E2E_REGISTER_PASSWORD || "Codecept@2026",
  firstName: "Codecept",
  lastName: "Tester",
  organizationSearch: process.env.E2E_ORGANIZATION_SEARCH || "UTH",
};

const uniqueEmail = (prefix) => `codecept.${prefix}.${Date.now()}@example.com`;

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

const clearBrowserState = async (I) => {
  await I.executeScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};

const selectRegisterOrganization = (I) => {
  I.fillField(selectors.registerOrganization, testUser.organizationSearch);
  I.waitForElement(selectors.registerOrganizationOption, 10);
  I.click(selectors.registerOrganizationOption);
};

const fillRegisterForm = (I, overrides = {}) => {
  const data = {
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    email: uniqueEmail("register"),
    password: testUser.password,
    confirmPassword: testUser.password,
    ...overrides,
  };

  I.waitForElement(selectors.registerFirstName, 10);
  I.fillField(selectors.registerFirstName, data.firstName);
  I.fillField(selectors.registerLastName, data.lastName);
  selectRegisterOrganization(I);
  I.fillField(selectors.registerEmail, data.email);
  I.fillField(selectors.registerPassword, data.password);
  I.fillField(selectors.registerConfirmPassword, data.confirmPassword);

  return data;
};

Scenario("login page is reachable", ({ I }) => {
  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);
  I.waitForElement(selectors.loginPassword, 10);
  I.waitForElement(selectors.loginSubmit, 10);
});

Scenario("BVA login required fields are blocked by browser validation", async ({ I }) => {
  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);

  I.click(selectors.loginSubmit);
  let emailValidity = await getFieldValidity(I, selectors.loginEmail);
  assert.equal(emailValidity.exists, true);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.valueMissing, true);
  I.seeInCurrentUrl("/login");

  I.fillField(selectors.loginEmail, "a@b.co");
  I.click(selectors.loginSubmit);
  const passwordValidity = await getFieldValidity(I, selectors.loginPassword);
  assert.equal(passwordValidity.exists, true);
  assert.equal(passwordValidity.valid, false);
  assert.equal(passwordValidity.valueMissing, true);
  I.seeInCurrentUrl("/login");
});

Scenario("BVA login with wrong password shows an error", ({ I }) => {
  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);
  I.fillField(selectors.loginEmail, uniqueEmail("wrong-login"));
  I.fillField(selectors.loginPassword, "WrongPassword@2026");
  I.click(selectors.loginSubmit);

  I.waitForElement(selectors.alertDanger, 10);
  I.seeInCurrentUrl("/login");
});

Scenario("BVA register required fields are blocked", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerFirstName, 10);

  I.click(selectors.registerSubmit);
  const firstNameValidity = await getFieldValidity(I, selectors.registerFirstName);
  assert.equal(firstNameValidity.valid, false);
  assert.equal(firstNameValidity.valueMissing, true);

  I.fillField(selectors.registerFirstName, testUser.firstName);
  I.click(selectors.registerSubmit);
  const lastNameValidity = await getFieldValidity(I, selectors.registerLastName);
  assert.equal(lastNameValidity.valid, false);
  assert.equal(lastNameValidity.valueMissing, true);

  I.fillField(selectors.registerLastName, testUser.lastName);
  I.click(selectors.registerSubmit);
  const emailValidity = await getFieldValidity(I, selectors.registerEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.valueMissing, true);

  I.fillField(selectors.registerEmail, uniqueEmail("missing-organization"));
  I.fillField(selectors.registerPassword, "Codecept@2026");
  I.fillField(selectors.registerConfirmPassword, "Codecept@2026");
  I.click(selectors.registerSubmit);
  I.waitForElement(selectors.alertDanger, 10);
  I.seeInCurrentUrl("/register");
});

Scenario("BVA register email format rejects invalid values and accepts a minimal valid format", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);

  I.fillField(selectors.registerEmail, "abc@");
  let emailValidity = await getFieldValidity(I, selectors.registerEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.typeMismatch, true);

  I.fillField(selectors.registerEmail, "abc.com");
  emailValidity = await getFieldValidity(I, selectors.registerEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.typeMismatch, true);

  I.fillField(selectors.registerEmail, "a@b.co");
  emailValidity = await getFieldValidity(I, selectors.registerEmail);
  assert.equal(emailValidity.valid, true);
});

Scenario("BVA register password length 7 fails client validation", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  fillRegisterForm(I, {
    email: uniqueEmail("password-7"),
    password: "Code@26",
    confirmPassword: "Code@26",
  });
  I.click(selectors.registerSubmit);

  I.waitForElement(selectors.alertDanger, 10);
  const alertText = await I.grabTextFrom(selectors.alertDanger);
  assert.match(alertText, /8|it nhat|at least|ít nhất/i);
  I.seeInCurrentUrl("/register");
});

Scenario("BVA register password length 8 passes validation", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  const user = fillRegisterForm(I, {
    email: uniqueEmail("password-8"),
    password: "Code@026",
    confirmPassword: "Code@026",
  });
  I.click(selectors.registerSubmit);

  I.waitInUrl("/app", 20);
  const registeredUser = await I.executeScript(() => {
    const rawUser = window.localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  });
  assert.ok(registeredUser, "password length 8 should pass registration");
  assert.equal(registeredUser.email, user.email);
  await clearBrowserState(I);
});

Scenario("BVA register password length 9 passes validation", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  const user = fillRegisterForm(I, {
    email: uniqueEmail("password-9"),
    password: "Code@2026",
    confirmPassword: "Code@2026",
  });
  I.click(selectors.registerSubmit);

  I.waitInUrl("/app", 20);
  const registeredUser = await I.executeScript(() => {
    const rawUser = window.localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  });
  assert.ok(registeredUser, "password length 9 should pass registration");
  assert.equal(registeredUser.email, user.email);
  await clearBrowserState(I);
});

Scenario("BVA register confirm password mismatch fails", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  fillRegisterForm(I, {
    email: uniqueEmail("password-mismatch"),
    password: "Codecept@2026",
    confirmPassword: "Codecept@2027",
  });
  I.click(selectors.registerSubmit);

  I.waitForElement(selectors.alertDanger, 10);
  I.seeInCurrentUrl("/register");
});

Scenario("BVA forgot password email format is validated", async ({ I }) => {
  I.amOnPage("/forgot-password");
  I.waitForElement(selectors.forgotPasswordEmail, 10);

  I.click(selectors.forgotPasswordSubmit);
  let emailValidity = await getFieldValidity(I, selectors.forgotPasswordEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.valueMissing, true);

  I.fillField(selectors.forgotPasswordEmail, "abc@");
  emailValidity = await getFieldValidity(I, selectors.forgotPasswordEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.typeMismatch, true);

  I.fillField(selectors.forgotPasswordEmail, "a@b.co");
  emailValidity = await getFieldValidity(I, selectors.forgotPasswordEmail);
  assert.equal(emailValidity.valid, true);
});

Scenario("BVA reset password without token disables submit", async ({ I }) => {
  I.amOnPage("/reset-password");
  I.waitForElement(selectors.resetPasswordSubmit, 10);

  const isDisabled = await getDisabledState(I, selectors.resetPasswordSubmit);
  assert.equal(isDisabled, true);
});

Scenario("BVA reset password confirm mismatch fails", ({ I }) => {
  I.amOnPage("/reset-password?token=fake-token-for-bva");
  I.waitForElement(selectors.resetPasswordNew, 10);
  I.fillField(selectors.resetPasswordNew, "Codecept@2026");
  I.fillField(selectors.resetPasswordConfirm, "Codecept@2027");
  I.click(selectors.resetPasswordSubmit);

  I.waitForElement(selectors.resetPasswordError, 10);
});

Scenario("user can register and login", async ({ I }) => {
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);

  I.waitForElement(selectors.registerFirstName, 10);
  I.fillField(selectors.registerFirstName, testUser.firstName);
  I.fillField(selectors.registerLastName, testUser.lastName);
  I.fillField(selectors.registerOrganization, testUser.organizationSearch);
  I.waitForElement(selectors.registerOrganizationOption, 10);
  I.click(selectors.registerOrganizationOption);
  I.fillField(selectors.registerEmail, testUser.email);
  I.fillField(selectors.registerPassword, testUser.password);
  I.fillField(selectors.registerConfirmPassword, testUser.password);
  I.click(selectors.registerSubmit);

  I.waitInUrl("/app", 20);
  I.seeInCurrentUrl("/app");

  const registeredUser = await I.executeScript(() => {
    const rawUser = window.localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  });
  assert.ok(registeredUser, "registered user should be stored after auto-login");
  assert.equal(registeredUser.email, testUser.email);

  await I.executeScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  I.amOnPage("/login");
  I.waitForElement(selectors.loginEmail, 10);
  I.fillField(selectors.loginEmail, testUser.email);
  I.fillField(selectors.loginPassword, testUser.password);
  I.click(selectors.loginSubmit);

  I.waitInUrl("/app", 20);
  I.seeInCurrentUrl("/app");
});
