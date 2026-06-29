const assert = require("node:assert/strict");

Feature("Manual Assignment BVA");

const selectors = {
  manualAssignButton: 'button[title="Manual Assign"]',
  assignmentError: '[data-testid="assignment-error"]',
  assignmentReviewer: '[data-testid="assignment-reviewer"]',
  assignmentWorkload: '[data-testid="assignment-workload"]',
  assignmentWorkloadHigh: '[data-testid="assignment-workload-high"]',
  assignmentWorkloadOverloaded: '[data-testid="assignment-workload-overloaded"]',
  assignmentPrimary: '[data-testid="assignment-primary"]',
  assignmentSubmit: '[data-testid="assignment-submit"]',
};

const config = {
  conferenceId: Number(process.env.E2E_ASSIGNMENT_CONFERENCE_ID || 1),
  submissionId: Number(process.env.E2E_ASSIGNMENT_SUBMISSION_ID || 73001),
};

const setChairSession = () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem("accessToken", "codecept-assignment-token");
  window.localStorage.setItem("refreshToken", "codecept-assignment-refresh-token");
  window.localStorage.setItem("activeConferenceId", "1");
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      id: 81001,
      email: "chair.codecept@example.com",
      fullName: "Assignment Chair",
      roles: ["CHAIR"],
      emailVerified: true,
    }),
  );
};

const jsonResponse = (data) => ({
  contentType: "application/json",
  body: JSON.stringify(data),
});

const buildSubmission = (overrides = {}) => ({
  id: config.submissionId,
  conferenceId: config.conferenceId,
  authorId: 82001,
  title: "Manual Assignment BVA Submission",
  abstractText: "Submission used for manual assignment BVA tests.",
  status: "SUBMITTED",
  trackId: 1,
  trackName: "Software Testing",
  keywords: "bva, assignment",
  authors: [
    {
      firstName: "Manual",
      lastName: "Author",
      email: "manual.author@example.com",
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildPcMember = (overrides = {}) => ({
  id: 91001,
  conferenceId: config.conferenceId,
  userId: 92001,
  email: "reviewer.assignment@example.com",
  fullName: "Assignment Reviewer",
  status: "ACCEPTED",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildWorkload = (status, overrides = {}) => {
  const totalsByStatus = {
    LOW: 1,
    NORMAL: 3,
    HIGH: 4,
    OVERLOADED: 6,
  };
  const maxAssignments = 5;
  const totalAssignments = totalsByStatus[status] ?? 0;

  return {
    reviewerId: overrides.reviewerId || 92001,
    reviewerEmail: overrides.reviewerEmail || "reviewer.assignment@example.com",
    reviewerName: overrides.reviewerName || "Assignment Reviewer",
    conferenceId: config.conferenceId,
    conferenceName: "Codecept BVA Conference",
    totalAssignments,
    assignedCount: totalAssignments,
    acceptedCount: 0,
    declinedCount: 0,
    completedCount: 0,
    workloadStatus: status,
    maxAssignments,
    workloadPercentage: Math.round((totalAssignments / maxAssignments) * 100),
    ...overrides,
  };
};

const buildAssignment = (payload, overrides = {}) => ({
  id: 94001,
  submissionId: payload.submissionId,
  submissionTitle: "Manual Assignment BVA Submission",
  reviewerId: payload.reviewerId,
  reviewerEmail: "reviewer.assignment@example.com",
  reviewerName: "Assignment Reviewer",
  status: "ASSIGNED",
  isPrimary: Boolean(payload.isPrimary),
  assignedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const installChairSession = async (I) => {
  await I.usePlaywrightTo("install chair session", async ({ browserContext }) => {
    await browserContext.clearCookies();
    await browserContext.addInitScript(setChairSession);
  });
};

const mockAssignmentApis = async (I, options = {}) => {
  const acceptedReviewer = buildPcMember(options.acceptedReviewer);
  const state = {
    submissions: options.submissions || [buildSubmission()],
    members:
      Object.prototype.hasOwnProperty.call(options, "members")
        ? options.members
        : [acceptedReviewer],
    workloadsByReviewerId: {
      [acceptedReviewer.userId]: buildWorkload(options.workloadStatus || "LOW", {
        reviewerId: acceptedReviewer.userId,
        reviewerEmail: acceptedReviewer.email,
        reviewerName: acceptedReviewer.fullName,
      }),
      ...(options.workloadsByReviewerId || {}),
    },
    createdAssignments: [],
    rejectOverloaded: Boolean(options.rejectOverloaded),
  };

  await I.usePlaywrightTo("mock manual assignment APIs", async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      if (method === "GET" && path === `/api/submissions/conference/${config.conferenceId}`) {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.submissions }),
        });
        return;
      }

      if (method === "GET" && path === `/api/assignments/submission/${config.submissionId}`) {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: [] }),
        });
        return;
      }

      if (method === "GET" && path === `/api/pc/conference/${config.conferenceId}/members`) {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.members }),
        });
        return;
      }

      const workloadMatch = path.match(/^\/api\/pc\/reviewer\/(\d+)\/workload$/);
      if (method === "GET" && workloadMatch) {
        const reviewerId = Number(workloadMatch[1]);
        const workload = state.workloadsByReviewerId[reviewerId];
        await route.fulfill({
          status: workload ? 200 : 404,
          ...jsonResponse({ success: Boolean(workload), data: workload || null }),
        });
        return;
      }

      if (method === "POST" && path === "/api/assignments") {
        const payload = JSON.parse(request.postData() || "{}");
        const workload = state.workloadsByReviewerId[payload.reviewerId];
        state.createdAssignments.push(payload);

        if (state.rejectOverloaded && workload?.workloadStatus === "OVERLOADED") {
          await route.fulfill({
            status: 400,
            ...jsonResponse({
              success: false,
              message: "Reviewer overloaded",
            }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: buildAssignment(payload) }),
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

const openManualAssignmentForm = async (I, options = {}) => {
  await installChairSession(I);
  const state = await mockAssignmentApis(I, options);
  I.amOnPage(`/app/chair/submissions?conferenceId=${config.conferenceId}`);
  I.waitForElement(selectors.manualAssignButton, 20);
  I.click(selectors.manualAssignButton);
  I.waitForElement(selectors.assignmentReviewer, 20);
  return state;
};

const getDisabledState = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    const element = document.querySelector(fieldSelector);
    return element ? element.disabled : null;
  }, selector);
};

const getReviewerOptions = async (I) => {
  return I.executeScript((fieldSelector) => {
    const field = document.querySelector(fieldSelector);
    return Array.from(field?.options || []).map((option) => ({
      value: option.value,
      text: option.textContent,
    }));
  }, selectors.assignmentReviewer);
};

const getTextContent = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    return document.querySelector(fieldSelector)?.textContent || "";
  }, selector);
};

const selectReviewer = async (I, reviewerId) => {
  await I.usePlaywrightTo("select assignment reviewer", async ({ page }) => {
    await page.selectOption(selectors.assignmentReviewer, String(reviewerId));
  });
};

const captureAssignmentPayload = async (I) => {
  return I.usePlaywrightTo("capture assignment payload", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" && new URL(request.url()).pathname === "/api/assignments",
    );
    await page.click(selectors.assignmentSubmit);
    const request = await requestPromise;
    return JSON.parse(request.postData() || "{}");
  });
};

Scenario("BVA assignment reviewer required disables submit when no reviewer", async ({ I }) => {
  await openManualAssignmentForm(I);

  assert.equal(await getDisabledState(I, selectors.assignmentSubmit), true);
});

Scenario("BVA assignment reviewer list with 0 accepted reviewers cannot submit", async ({ I }) => {
  await openManualAssignmentForm(I, {
    members: [
      buildPcMember({
        id: 91002,
        userId: 92002,
        email: "pending.reviewer@example.com",
        fullName: "Pending Reviewer",
        status: "PENDING",
      }),
    ],
  });

  const options = await getReviewerOptions(I);
  assert.deepEqual(
    options.map((option) => option.value),
    [""],
  );
  assert.equal(await getDisabledState(I, selectors.assignmentSubmit), true);
});

Scenario("BVA assignment reviewer list with 1 accepted reviewer can select and submit", async ({ I }) => {
  const state = await openManualAssignmentForm(I);
  const reviewerId = state.members[0].userId;

  await selectReviewer(I, reviewerId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  assert.equal(await getDisabledState(I, selectors.assignmentSubmit), false);

  const payload = await captureAssignmentPayload(I);
  assert.equal(payload.submissionId, config.submissionId);
  assert.equal(payload.reviewerId, reviewerId);
});

Scenario("BVA assignment workload LOW shows workload info", async ({ I }) => {
  const state = await openManualAssignmentForm(I, { workloadStatus: "LOW" });

  await selectReviewer(I, state.members[0].userId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  assert.match(await getTextContent(I, selectors.assignmentWorkload), /1\s*\/\s*5/);
  assert.equal(await I.grabNumberOfVisibleElements(selectors.assignmentWorkloadHigh), 0);
  assert.equal(await I.grabNumberOfVisibleElements(selectors.assignmentWorkloadOverloaded), 0);
});

Scenario("BVA assignment workload NORMAL shows workload info", async ({ I }) => {
  const state = await openManualAssignmentForm(I, { workloadStatus: "NORMAL" });

  await selectReviewer(I, state.members[0].userId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  assert.match(await getTextContent(I, selectors.assignmentWorkload), /3\s*\/\s*5/);
  assert.equal(await I.grabNumberOfVisibleElements(selectors.assignmentWorkloadHigh), 0);
  assert.equal(await I.grabNumberOfVisibleElements(selectors.assignmentWorkloadOverloaded), 0);
});

Scenario("BVA assignment workload HIGH shows warning", async ({ I }) => {
  const state = await openManualAssignmentForm(I, { workloadStatus: "HIGH" });

  await selectReviewer(I, state.members[0].userId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  I.waitForElement(selectors.assignmentWorkloadHigh, 10);
  assert.match(await getTextContent(I, selectors.assignmentWorkload), /4\s*\/\s*5/);
});

Scenario("BVA assignment workload OVERLOADED shows danger and backend blocks assign", async ({ I }) => {
  const state = await openManualAssignmentForm(I, {
    workloadStatus: "OVERLOADED",
    rejectOverloaded: true,
  });

  await selectReviewer(I, state.members[0].userId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  I.waitForElement(selectors.assignmentWorkloadOverloaded, 10);
  assert.match(await getTextContent(I, selectors.assignmentWorkload), /6\s*\/\s*5/);
  I.click(selectors.assignmentSubmit);
  I.waitForElement(selectors.assignmentError, 10);
});

Scenario("BVA assignment primary unchecked sends isPrimary false", async ({ I }) => {
  const state = await openManualAssignmentForm(I);

  await selectReviewer(I, state.members[0].userId);
  I.waitForElement(selectors.assignmentWorkload, 10);
  const payload = await captureAssignmentPayload(I);

  assert.equal(payload.isPrimary, false);
});

Scenario("BVA assignment primary checked sends isPrimary true", async ({ I }) => {
  const state = await openManualAssignmentForm(I);

  await selectReviewer(I, state.members[0].userId);
  I.checkOption(selectors.assignmentPrimary);
  I.waitForElement(selectors.assignmentWorkload, 10);
  const payload = await captureAssignmentPayload(I);

  assert.equal(payload.isPrimary, true);
});
