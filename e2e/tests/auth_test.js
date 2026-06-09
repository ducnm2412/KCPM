const assert = require("node:assert/strict");

Feature("Authentication");

const selectors = {
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
};

const testUser = {
  email: `codecept.${Date.now()}@example.com`,
  password: process.env.E2E_REGISTER_PASSWORD || "Codecept@2026",
  firstName: "Codecept",
  lastName: "Tester",
  organizationSearch: process.env.E2E_ORGANIZATION_SEARCH || "UTH",
};

Scenario("login page is reachable", ({ I }) => {
  I.amOnPage("/login");
  I.seeElement(selectors.loginEmail);
  I.seeElement(selectors.loginPassword);
  I.seeElement(selectors.loginSubmit);
});

Scenario("user can register and login", async ({ I }) => {
  I.amOnPage("/register");
  I.seeElement(selectors.registerEmail);

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
  I.fillField(selectors.loginEmail, testUser.email);
  I.fillField(selectors.loginPassword, testUser.password);
  I.click(selectors.loginSubmit);

  I.waitInUrl("/app", 20);
  I.seeInCurrentUrl("/app");
});
