const assert = require("node:assert/strict");

Feature("Review BVA");

const selectors = {
  reviewForm: '[data-testid="review-form"]',
  reviewError: '[data-testid="review-error"]',
  reviewLockedWarning: '[data-testid="review-locked-warning"]',
  reviewSummary: '[data-testid="review-summary"]',
  reviewComments: '[data-testid="review-comments"]',
  reviewScore: '[data-testid="review-score"]',
  reviewOverallRating: '[data-testid="review-overall-rating"]',
  reviewConfidence: '[data-testid="review-confidence"]',
  reviewSave: '[data-testid="review-save"]',
};

const config = {
  assignmentId: Number(process.env.E2E_REVIEW_ASSIGNMENT_ID || 41001),
  draftReviewId: Number(process.env.E2E_REVIEW_ID || 42001),
  submittedReviewId: Number(process.env.E2E_SUBMITTED_REVIEW_ID || 42002),
};

const scoreValues = [
  "STRONG_ACCEPT",
  "ACCEPT",
  "WEAK_ACCEPT",
  "BORDERLINE",
  "WEAK_REJECT",
  "REJECT",
  "STRONG_REJECT",
];

const futureDeadline = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDeadline = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const buildAssignment = (overrides = {}) => ({
  id: config.assignmentId,
  submissionId: 51001,
  submissionTitle: "BVA Review Submission",
  submissionAbstract: "Submission abstract for Review BVA tests.",
  conferenceId: 1,
  conferenceName: "BVA Conference",
  trackName: "Software Testing",
  status: "ACCEPTED",
  deadline: futureDeadline(),
  canReview: true,
  hasCOI: false,
  ...overrides,
});

const buildReview = (overrides = {}) => ({
  id: config.draftReviewId,
  assignmentId: config.assignmentId,
  submissionId: 51001,
  reviewerId: 61001,
  reviewerName: null,
  summary: "Existing review summary",
  strengths: "",
  weaknesses: "",
  comments: "Existing review comments",
  score: "BORDERLINE",
  status: "DRAFT",
  isConfidential: false,
  overallRating: 3,
  confidence: 3,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const jsonResponse = (data) => ({
  contentType: "application/json",
  body: JSON.stringify(data),
});

const installPcSession = async (I) => {
  await I.usePlaywrightTo("install PC session", async ({ browserContext }) => {
    await browserContext.clearCookies();
    await browserContext.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("accessToken", "codecept-review-token");
      window.localStorage.setItem("refreshToken", "codecept-review-refresh-token");
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          id: 61001,
          email: "reviewer.codecept@example.com",
          fullName: "Review Codecept",
          roles: ["PC"],
          emailVerified: true,
        }),
      );
    });
  });
};

const mockReviewApis = async (I, options = {}) => {
  const state = {
    assignment: buildAssignment(options.assignment),
    existingReview:
      Object.prototype.hasOwnProperty.call(options, "existingReview")
        ? options.existingReview
        : null,
    draftRequests: [],
  };

  await I.usePlaywrightTo("mock review APIs", async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const method = request.method();

      if (method === "GET" && path === `/api/assignments/${state.assignment.id}`) {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.assignment }),
        });
        return;
      }

      if (method === "GET" && path === `/api/reviews/assignment/${state.assignment.id}`) {
        if (!state.existingReview) {
          await route.fulfill({
            status: 404,
            ...jsonResponse({ success: false, message: "Review not found" }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: state.existingReview }),
        });
        return;
      }

      if (method === "GET" && path === `/api/reviews/${config.submittedReviewId}`) {
        const review = buildReview({
          id: config.submittedReviewId,
          status: "SUBMITTED",
          submittedAt: new Date().toISOString(),
          ...(options.existingReview || {}),
        });
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: review }),
        });
        return;
      }

      if (method === "POST" && path.endsWith("/api/reviews/draft")) {
        const payload = JSON.parse(request.postData() || "{}");
        state.draftRequests.push(payload);
        const review = buildReview({
          ...payload,
          id: config.draftReviewId,
          status: "DRAFT",
        });
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: review }),
        });
        return;
      }

      if (method === "GET" && path === "/api/assignments/my") {
        await route.fulfill({
          status: 200,
          ...jsonResponse({ success: true, data: [] }),
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

const openNewReviewForm = async (I, options = {}) => {
  await installPcSession(I);
  const state = await mockReviewApis(I, options);
  I.amOnPage(`/app/pc/reviews/new?assignmentId=${state.assignment.id}`);
  I.waitForElement(selectors.reviewForm, 20);
  return state;
};

const openSubmittedReviewForm = async (I) => {
  await installPcSession(I);
  const submittedReview = buildReview({
    id: config.submittedReviewId,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
  });
  const state = await mockReviewApis(I, {
    assignment: { deadline: pastDeadline() },
    existingReview: submittedReview,
  });
  I.amOnPage(`/app/pc/reviews/${config.submittedReviewId}/edit`);
  I.waitForElement(selectors.reviewForm, 20);
  return state;
};

const getFieldValidity = async (I, selector) => {
  return I.executeScript((fieldSelector) => {
    const element = document.querySelector(fieldSelector);
    return element
      ? {
          exists: true,
          valid: element.checkValidity(),
          valueMissing: element.validity.valueMissing,
          rangeUnderflow: element.validity.rangeUnderflow,
          rangeOverflow: element.validity.rangeOverflow,
          validationMessage: element.validationMessage,
          value: element.value,
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

const fillValidReview = (I, overrides = {}) => {
  const data = {
    summary: "A valid BVA review summary.",
    comments: "A valid BVA review comment.",
    score: "BORDERLINE",
    overallRating: "",
    confidence: "",
    ...overrides,
  };

  I.fillField(selectors.reviewSummary, data.summary);
  I.fillField(selectors.reviewComments, data.comments);
  I.selectOption(selectors.reviewScore, data.score);
  I.fillField(selectors.reviewOverallRating, data.overallRating);
  I.fillField(selectors.reviewConfidence, data.confidence);
  return data;
};

const captureDraftPayload = async (I) => {
  return I.usePlaywrightTo("capture review draft payload", async ({ page }) => {
    const requestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" && new URL(request.url()).pathname.endsWith("/api/reviews/draft"),
    );
    await page.click(selectors.reviewSave);
    const request = await requestPromise;
    return JSON.parse(request.postData() || "{}");
  });
};

Scenario("BVA review summary empty fails browser required validation", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewComments, "A");
  I.click(selectors.reviewSave);
  const summaryValidity = await getFieldValidity(I, selectors.reviewSummary);
  assert.equal(summaryValidity.exists, true);
  assert.equal(summaryValidity.valid, false);
  assert.equal(summaryValidity.valueMissing, true);
});

Scenario("BVA review summary spaces shows review error", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewSummary, "   ");
  I.fillField(selectors.reviewComments, "A");
  I.click(selectors.reviewSave);
  I.waitForElement(selectors.reviewError, 10);
  I.seeInCurrentUrl("/app/pc/reviews/new");
});

Scenario("BVA review summary 1 character passes frontend validation", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewSummary, "A");
  const summaryValidity = await getFieldValidity(I, selectors.reviewSummary);
  assert.equal(summaryValidity.valid, true);
});

Scenario("BVA review comments empty fails browser required validation", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewSummary, "A");
  I.click(selectors.reviewSave);
  const commentsValidity = await getFieldValidity(I, selectors.reviewComments);
  assert.equal(commentsValidity.exists, true);
  assert.equal(commentsValidity.valid, false);
  assert.equal(commentsValidity.valueMissing, true);
});

Scenario("BVA review comments spaces shows review error", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewSummary, "A");
  I.fillField(selectors.reviewComments, "   ");
  I.click(selectors.reviewSave);
  I.waitForElement(selectors.reviewError, 10);
  I.seeInCurrentUrl("/app/pc/reviews/new");
});

Scenario("BVA review comments 1 character passes frontend validation", async ({ I }) => {
  await openNewReviewForm(I);

  I.fillField(selectors.reviewComments, "A");
  const commentsValidity = await getFieldValidity(I, selectors.reviewComments);
  assert.equal(commentsValidity.valid, true);
});

scoreValues.forEach((score) => {
  Scenario(`BVA review score enum sends ${score}`, async ({ I }) => {
    await openNewReviewForm(I);
    fillValidReview(I, {
      summary: `Summary for ${score}`,
      comments: `Comments for ${score}`,
      score,
    });
    const draftPayload = await captureDraftPayload(I);
    I.waitInUrl("/app/pc/assignments", 10);

    assert.equal(draftPayload.score, score);
  });
});

Scenario("BVA review overall rating 0 fails HTML min validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewOverallRating, "0");
  const ratingValidity = await getFieldValidity(I, selectors.reviewOverallRating);
  assert.equal(ratingValidity.valid, false);
  assert.equal(ratingValidity.rangeUnderflow, true);
});

Scenario("BVA review overall rating 1 passes validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewOverallRating, "1");
  const ratingValidity = await getFieldValidity(I, selectors.reviewOverallRating);
  assert.equal(ratingValidity.valid, true);
});

Scenario("BVA review overall rating 5 passes validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewOverallRating, "5");
  const ratingValidity = await getFieldValidity(I, selectors.reviewOverallRating);
  assert.equal(ratingValidity.valid, true);
});

Scenario("BVA review overall rating 6 fails HTML max validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewOverallRating, "6");
  const ratingValidity = await getFieldValidity(I, selectors.reviewOverallRating);
  assert.equal(ratingValidity.valid, false);
  assert.equal(ratingValidity.rangeOverflow, true);
});

Scenario("BVA review confidence 0 fails HTML min validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewConfidence, "0");
  const confidenceValidity = await getFieldValidity(I, selectors.reviewConfidence);
  assert.equal(confidenceValidity.valid, false);
  assert.equal(confidenceValidity.rangeUnderflow, true);
});

Scenario("BVA review confidence 1 passes validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewConfidence, "1");
  const confidenceValidity = await getFieldValidity(I, selectors.reviewConfidence);
  assert.equal(confidenceValidity.valid, true);
});

Scenario("BVA review confidence 5 passes validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewConfidence, "5");
  const confidenceValidity = await getFieldValidity(I, selectors.reviewConfidence);
  assert.equal(confidenceValidity.valid, true);
});

Scenario("BVA review confidence 6 fails HTML max validation", async ({ I }) => {
  await openNewReviewForm(I);

  fillValidReview(I);
  I.fillField(selectors.reviewConfidence, "6");
  const confidenceValidity = await getFieldValidity(I, selectors.reviewConfidence);
  assert.equal(confidenceValidity.valid, false);
  assert.equal(confidenceValidity.rangeOverflow, true);
});

Scenario("BVA submitted or expired review is locked", async ({ I }) => {
  await openSubmittedReviewForm(I);

  I.waitForElement(selectors.reviewLockedWarning, 10);
  assert.equal(await getDisabledState(I, selectors.reviewSave), true);
  assert.equal(await getDisabledState(I, selectors.reviewSummary), true);
  assert.equal(await getDisabledState(I, selectors.reviewComments), true);
  assert.equal(await getDisabledState(I, selectors.reviewScore), true);
});
