const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

Feature("Submission BVA");

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
  submissionError: '[data-testid="submission-error"]',
  submissionTitle: '[data-testid="submission-title"]',
  submissionAbstract: '[data-testid="submission-abstract"]',
  submissionKeywords: '[data-testid="submission-keywords"]',
  submissionTrack: '[data-testid="submission-track"]',
  submissionPdfFile: '[data-testid="submission-pdf-file"]',
  submissionSubmit: '[data-testid="submission-submit"]',
  authorEmpty: '[data-testid="author-empty"]',
  authorAdd: '[data-testid="author-add"]',
  authorFirstName: '[data-testid="author-first-name"]',
  authorLastName: '[data-testid="author-last-name"]',
  authorEmail: '[data-testid="author-email"]',
  authorCorresponding: '[data-testid="author-corresponding"]',
  authorSave: '[data-testid="author-save"]',
  authorRow0: '[data-testid="author-row-0"]',
  authorMoveUp0: '[data-testid="author-move-up-0"]',
  authorMoveDown0: '[data-testid="author-move-down-0"]',
};

const config = {
  conferenceId: process.env.E2E_CONFERENCE_ID || "1",
  authorEmail: process.env.E2E_AUTHOR_EMAIL || process.env.E2E_LOGIN_EMAIL,
  authorPassword: process.env.E2E_AUTHOR_PASSWORD || process.env.E2E_LOGIN_PASSWORD,
  registerPassword: process.env.E2E_REGISTER_PASSWORD || "Codecept@2026",
  organizationSearch: process.env.E2E_ORGANIZATION_SEARCH || "UTH",
};

const fixtureDir = path.join(__dirname, "..", "output", "generated-fixtures");

const uniqueEmail = (prefix) => `codecept.${prefix}.${Date.now()}@example.com`;

const clearBrowserState = async (I) => {
  await I.executeScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      // Some browser contexts (for example about:blank) deny storage access.
    }
    try {
      window.sessionStorage.clear();
    } catch {
      // Keep navigation resilient; tests will still establish a fresh session.
    }
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

const getFileInputSize = async (I) => {
  return I.executeScript((fieldSelector) => {
    const element = document.querySelector(fieldSelector);
    return element?.files?.[0]?.size || 0;
  }, selectors.submissionPdfFile);
};

const getInputValue = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    return document.querySelector(fieldSelector)?.value || "";
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

const ensurePdfFixture = (filename, size) => {
  fs.mkdirSync(fixtureDir, { recursive: true });
  const filePath = path.join(fixtureDir, filename);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size !== size) {
    const fd = fs.openSync(filePath, "w");
    try {
      fs.writeSync(fd, Buffer.from("%PDF-1.4\n"));
      if (size > 9) {
        fs.writeSync(fd, Buffer.alloc(1), 0, 1, size - 1);
      }
    } finally {
      fs.closeSync(fd);
    }
  }
  return filePath;
};

const pdfFixtures = {
  belowMax: () => ensurePdfFixture("valid-20mb-minus-1.pdf", 20 * 1024 * 1024 - 1),
  atMax: () => ensurePdfFixture("valid-20mb.pdf", 20 * 1024 * 1024),
  aboveMax: () => ensurePdfFixture("invalid-20mb-plus-1.pdf", 20 * 1024 * 1024 + 1),
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
  const email = uniqueEmail("submission-author");
  I.amOnPage("/register");
  I.waitForElement(selectors.registerEmail, 10);
  I.fillField(selectors.registerFirstName, "Submission");
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

const fillValidSubmissionBasics = (I, overrides = {}) => {
  const data = {
    title: `BVA Submission ${Date.now()}`,
    abstract: "A",
    keywords: "",
    ...overrides,
  };
  I.fillField(selectors.submissionTitle, data.title);
  I.fillField(selectors.submissionAbstract, data.abstract);
  I.fillField(selectors.submissionKeywords, data.keywords);
  return data;
};

Scenario("BVA submission title required: empty, spaces, and 1 character", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.fillField(selectors.submissionAbstract, "A");
  I.click(selectors.submissionSubmit);
  let titleValidity = await getFieldValidity(I, selectors.submissionTitle);
  assert.equal(titleValidity.exists, true);
  assert.equal(titleValidity.valid, false);
  assert.equal(titleValidity.valueMissing, true);

  I.fillField(selectors.submissionTitle, "   ");
  I.click(selectors.submissionSubmit);
  I.waitForElement(selectors.submissionError, 10);
  I.seeInCurrentUrl("/app/author/submissions/new");

  I.fillField(selectors.submissionTitle, "A");
  titleValidity = await getFieldValidity(I, selectors.submissionTitle);
  assert.equal(titleValidity.valid, true);
});

Scenario("BVA submission abstract required: empty, spaces, and 1 character", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.fillField(selectors.submissionTitle, "A");
  I.click(selectors.submissionSubmit);
  let abstractValidity = await getFieldValidity(I, selectors.submissionAbstract);
  assert.equal(abstractValidity.exists, true);
  assert.equal(abstractValidity.valid, false);
  assert.equal(abstractValidity.valueMissing, true);

  I.fillField(selectors.submissionAbstract, "   ");
  I.click(selectors.submissionSubmit);
  I.waitForElement(selectors.submissionError, 10);
  I.seeInCurrentUrl("/app/author/submissions/new");

  I.fillField(selectors.submissionAbstract, "A");
  abstractValidity = await getFieldValidity(I, selectors.submissionAbstract);
  assert.equal(abstractValidity.valid, true);
});

Scenario("BVA submission keywords accept empty, one, two, and sparse comma values", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.fillField(selectors.submissionKeywords, "");
  assert.equal(await getInputValue(I, selectors.submissionKeywords), "");

  I.fillField(selectors.submissionKeywords, "ai");
  assert.equal(await getInputValue(I, selectors.submissionKeywords), "ai");

  I.fillField(selectors.submissionKeywords, "ai, ml");
  assert.equal(await getInputValue(I, selectors.submissionKeywords), "ai, ml");

  I.fillField(selectors.submissionKeywords, "ai,, ml, ");
  assert.equal(await getInputValue(I, selectors.submissionKeywords), "ai,, ml, ");
});

Scenario("BVA submission track is optional when the select exists", async ({ I }) => {
  await openNewSubmissionForm(I);

  const hasTrackSelect = await I.grabNumberOfVisibleElements(selectors.submissionTrack);
  if (hasTrackSelect === 0) {
    return;
  }

  assert.equal(await getInputValue(I, selectors.submissionTrack), "");
});

Scenario("BVA submission can create draft without PDF", async ({ I }) => {
  await openNewSubmissionForm(I);
  fillValidSubmissionBasics(I, {
    title: `BVA Draft Without PDF ${Date.now()}`,
    abstract: "This abstract verifies that a draft can be created without uploading a PDF file.",
    keywords: "",
  });

  I.click(selectors.submissionSubmit);
  I.waitInUrl("/app/author/submissions", 20);
});

Scenario("BVA submission PDF accepts 20MB minus 1 byte", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.attachFile(selectors.submissionPdfFile, pdfFixtures.belowMax());
  assert.equal(await getFileInputSize(I), 20 * 1024 * 1024 - 1);
  I.dontSeeElement(selectors.submissionError);
});

Scenario("BVA submission PDF accepts exactly 20MB", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.attachFile(selectors.submissionPdfFile, pdfFixtures.atMax());
  assert.equal(await getFileInputSize(I), 20 * 1024 * 1024);
  I.dontSeeElement(selectors.submissionError);
});

Scenario("BVA submission PDF rejects 20MB plus 1 byte", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.attachFile(selectors.submissionPdfFile, pdfFixtures.aboveMax());
  I.waitForElement(selectors.submissionError, 10);
  I.seeInCurrentUrl("/app/author/submissions/new");
});

Scenario("BVA author editor starts with zero authors", async ({ I }) => {
  await openNewSubmissionForm(I);
  I.waitForElement(selectors.authorEmpty, 10);
});

Scenario("BVA author first name and last name are required", async ({ I }) => {
  await openNewSubmissionForm(I);
  await installAlertSpy(I);

  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 10);
  I.fillField(selectors.authorLastName, "A");
  I.click(selectors.authorSave);
  assert.notEqual(await getLastAlert(I), "");

  await installAlertSpy(I);
  I.fillField(selectors.authorFirstName, "A");
  I.fillField(selectors.authorLastName, "");
  I.click(selectors.authorSave);
  assert.notEqual(await getLastAlert(I), "");
});

Scenario("BVA author accepts 1 character names and optional empty email", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 10);
  I.fillField(selectors.authorFirstName, "A");
  I.fillField(selectors.authorLastName, "B");
  I.fillField(selectors.authorEmail, "");
  I.click(selectors.authorSave);

  I.waitForElement(selectors.authorRow0, 10);
});

Scenario("BVA author email reports browser invalid state for bad format", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorEmail, 10);
  I.fillField(selectors.authorEmail, "abc@");

  const emailValidity = await getFieldValidity(I, selectors.authorEmail);
  assert.equal(emailValidity.valid, false);
  assert.equal(emailValidity.typeMismatch, true);
});

Scenario("BVA first author is corresponding and reorder buttons are bounded", async ({ I }) => {
  await openNewSubmissionForm(I);

  I.click(selectors.authorAdd);
  I.waitForElement(selectors.authorFirstName, 10);
  const correspondingChecked = await I.executeScript((fieldSelector) => {
    return document.querySelector(fieldSelector)?.checked || false;
  }, selectors.authorCorresponding);
  assert.equal(correspondingChecked, true);

  I.fillField(selectors.authorFirstName, "A");
  I.fillField(selectors.authorLastName, "B");
  I.click(selectors.authorSave);
  I.waitForElement(selectors.authorRow0, 10);

  assert.equal(await getDisabledState(I, selectors.authorMoveUp0), true);
  assert.equal(await getDisabledState(I, selectors.authorMoveDown0), true);
});
