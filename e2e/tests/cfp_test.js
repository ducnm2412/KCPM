const assert = require("node:assert/strict");

Feature("CFP BVA");

const selectors = {
  cfpForm: '[data-testid="cfp-form"]',
  cfpTab: '[data-testid="cfp-tab"]',
  cfpCallForPapers: '[data-testid="cfp-call-for-papers"]',
  cfpSubmissionGuidelines: '[data-testid="cfp-submission-guidelines"]',
  cfpSave: '[data-testid="cfp-save"]',
  cfpPublish: '[data-testid="cfp-publish"]',
  cfpClose: '[data-testid="cfp-close"]',
  cfpError: '[data-testid="cfp-error"]',
  cfpSuccess: '[data-testid="cfp-success"]',
  cfpNotCreated: '[data-testid="cfp-not-created"]',
};

const config = {
  conferenceId: Number(process.env.E2E_CFP_CONFERENCE_ID || 71001),
  cfpId: Number(process.env.E2E_CFP_ID || 72001),
};

const buildConference = (overrides = {}) => ({
  id: config.conferenceId,
  name: "BVA CFP Conference",
  acronym: "BVACFP",
  description: "Conference used by CFP BVA tests.",
  chairId: 81001,
  published: true,
  reviewMode: "DOUBLE_BLIND",
  topics: [
    { id: 91001, name: "Software Testing", description: "Testing topic" },
    { id: 91002, name: "Web Engineering", description: "Web topic" },
  ],
  tracks: [{ id: 92001, name: "Research", active: true }],
  deadlines: [{ id: 93001, type: "SUBMISSION", dueDate: new Date(Date.now() + 86400000).toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildCFP = (overrides = {}) => ({
  id: config.cfpId,
  callForPapers: "Existing CFP description",
  submissionGuidelines: "Existing submission guidelines",
  open: false,
  topicsList: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const jsonResponse = (data) => ({
  contentType: "application/json",
  body: JSON.stringify(data),
});

const installChairSession = async (I) => {
  await I.usePlaywrightTo("install chair session", async ({ browserContext }) => {
    await browserContext.clearCookies();
    await browserContext.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("accessToken", "codecept-cfp-token");
      window.localStorage.setItem("refreshToken", "codecept-cfp-refresh-token");
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          id: 81001,
          email: "chair.cfp.codecept@example.com",
          fullName: "CFP Chair Codecept",
          roles: ["CHAIR"],
          emailVerified: true,
        }),
      );
    });
  });
};

const mockCFPApis = async (I, options = {}) => {
  const state = {
    conference: buildConference(options.conference),
    cfp: Object.prototype.hasOwnProperty.call(options, "cfp") ? options.cfp : buildCFP(options.cfpOverrides),
    saveRequests: [],
    publishRequests: 0,
    closeRequests: 0,
    failSave: options.failSave || false,
    failPublish: options.failPublish || false,
    failClose: options.failClose || false,
  };

  await I.usePlaywrightTo("mock CFP APIs", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      if (method === "GET" && path === `/api/conferences/${state.conference.id}`) {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: { ...state.conference, cfp: state.cfp } }),
        });
        return;
      }

      if (method === "GET" && path === `/api/cfp/conference/${state.conference.id}`) {
        if (!state.cfp) {
          await route.fulfill({
            status: 404,
            ...jsonResponse({ success: false, message: "CFP not found for this conference" }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.cfp }),
        });
        return;
      }

      if (method === "POST" && path === "/api/cfp") {
        const payload = JSON.parse(request.postData() || "{}");
        state.saveRequests.push(payload);

        if (state.failSave) {
          await route.fulfill({
            status: state.failSave.status || 400,
            ...jsonResponse({
              success: false,
              message: state.failSave.message || "Invalid CFP request",
            }),
          });
          return;
        }

        state.cfp = buildCFP({
          id: state.cfp?.id || config.cfpId,
          callForPapers: payload.callForPapers,
          submissionGuidelines: payload.submissionGuidelines,
          open: Boolean(payload.open ?? state.cfp?.open ?? false),
        });

        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.cfp }),
        });
        return;
      }

      if (method === "POST" && path === `/api/cfp/${state.conference.id}/publish`) {
        state.publishRequests += 1;

        if (state.failPublish) {
          await route.fulfill({
            status: state.failPublish.status || 400,
            ...jsonResponse({
              success: false,
              message: state.failPublish.message || "Cannot publish CFP",
            }),
          });
          return;
        }

        state.cfp = buildCFP({ ...(state.cfp || {}), open: true });
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.cfp }),
        });
        return;
      }

      if (method === "POST" && path === `/api/cfp/${state.conference.id}/close`) {
        state.closeRequests += 1;

        if (state.failClose) {
          await route.fulfill({
            status: state.failClose.status || 400,
            ...jsonResponse({
              success: false,
              message: state.failClose.message || "Cannot close CFP",
            }),
          });
          return;
        }

        state.cfp = buildCFP({ ...(state.cfp || {}), open: false });
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.cfp }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        ...jsonResponse({ success: true, data: null }),
      });
    });
  });

  return state;
};

const openCFPConfig = async (I, options = {}) => {
  await installChairSession(I);
  const state = await mockCFPApis(I, options);
  I.amOnPage(`/app/chair/conference/${state.conference.id}/config?tab=cfp`);
  I.waitForElement(selectors.cfpForm, 20);
  return state;
};

const getInputValue = async (I, selector) => {
  return I.executeScript((fieldSelector) => document.querySelector(fieldSelector)?.value || "", selector);
};

const captureSavePayload = async (I) => {
  return I.usePlaywrightTo("capture CFP save payload", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/cfp",
    );
    await page.click(selectors.cfpSave);
    const request = await requestPromise;
    return JSON.parse(request.postData() || "{}");
  });
};

const clickAndCaptureCFPAction = async (I, selector, actionPath) => {
  return I.usePlaywrightTo("capture CFP action request", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).pathname === actionPath,
    );
    await page.click(selector);
    return requestPromise;
  });
};

Scenario("BVA CFP loads existing values by conference", async ({ I }) => {
  await openCFPConfig(I, {
    cfpOverrides: {
      callForPapers: "A",
      submissionGuidelines: "G",
      open: false,
    },
  });

  assert.equal(await getInputValue(I, selectors.cfpCallForPapers), "A");
  assert.equal(await getInputValue(I, selectors.cfpSubmissionGuidelines), "G");
  I.waitForElement(selectors.cfpPublish, 10);
});

Scenario("BVA CFP conference without CFP shows not-created message", async ({ I }) => {
  await openCFPConfig(I, { cfp: null });

  I.waitForElement(selectors.cfpNotCreated, 10);
  assert.equal(await getInputValue(I, selectors.cfpCallForPapers), "");
  assert.equal(await getInputValue(I, selectors.cfpSubmissionGuidelines), "");
});

Scenario("BVA CFP empty fields can be saved for initial create", async ({ I }) => {
  const state = await openCFPConfig(I, { cfp: null });

  const payload = await captureSavePayload(I);
  I.waitForElement(selectors.cfpSuccess, 10);

  assert.equal(payload.conferenceId, state.conference.id);
  assert.equal(payload.callForPapers, "");
  assert.equal(payload.submissionGuidelines, "");
});

Scenario("BVA CFP one character fields are sent", async ({ I }) => {
  const state = await openCFPConfig(I, { cfp: null });

  I.fillField(selectors.cfpCallForPapers, "A");
  I.fillField(selectors.cfpSubmissionGuidelines, "B");
  const payload = await captureSavePayload(I);

  assert.equal(payload.conferenceId, state.conference.id);
  assert.equal(payload.callForPapers, "A");
  assert.equal(payload.submissionGuidelines, "B");
});

Scenario("BVA CFP save includes conference topic ids", async ({ I }) => {
  await openCFPConfig(I, {
    conference: {
      topics: [
        { id: 101, name: "AI" },
        { id: 102, name: "Security" },
      ],
    },
  });

  I.fillField(selectors.cfpCallForPapers, "Topic CFP");
  const payload = await captureSavePayload(I);

  assert.deepEqual(payload.topicIds, [101, 102]);
});

Scenario("BVA CFP save shows backend validation error", async ({ I }) => {
  await openCFPConfig(I, {
    failSave: { status: 400, message: "Invalid conference id" },
  });

  I.fillField(selectors.cfpCallForPapers, "Invalid CFP");
  I.click(selectors.cfpSave);
  I.waitForElement(selectors.cfpError, 10);
  I.see("Invalid conference id");
});

Scenario("BVA CFP save shows authorization error", async ({ I }) => {
  await openCFPConfig(I, {
    failSave: { status: 403, message: "Forbidden" },
  });

  I.fillField(selectors.cfpCallForPapers, "Unauthorized CFP");
  I.click(selectors.cfpSave);
  I.waitForElement(selectors.cfpError, 10);
  I.see("Forbidden");
});

Scenario("BVA CFP publish turns a closed CFP open", async ({ I }) => {
  const state = await openCFPConfig(I, {
    cfpOverrides: { open: false },
  });

  await clickAndCaptureCFPAction(I, selectors.cfpPublish, `/api/cfp/${state.conference.id}/publish`);
  I.waitForElement(selectors.cfpClose, 10);
});

Scenario("BVA CFP publish shows backend error", async ({ I }) => {
  await openCFPConfig(I, {
    cfpOverrides: { open: false },
    failPublish: { status: 400, message: "Conference without CFP" },
  });

  I.click(selectors.cfpPublish);
  I.waitForElement(selectors.cfpError, 10);
  I.see("Conference without CFP");
});

Scenario("BVA CFP close turns an open CFP closed", async ({ I }) => {
  const state = await openCFPConfig(I, {
    cfpOverrides: { open: true },
  });

  await clickAndCaptureCFPAction(I, selectors.cfpClose, `/api/cfp/${state.conference.id}/close`);
  I.waitForElement(selectors.cfpPublish, 10);
});

Scenario("BVA CFP close shows backend error", async ({ I }) => {
  await openCFPConfig(I, {
    cfpOverrides: { open: true },
    failClose: { status: 400, message: "CFP already closed" },
  });

  I.click(selectors.cfpClose);
  I.waitForElement(selectors.cfpError, 10);
  I.see("CFP already closed");
});
