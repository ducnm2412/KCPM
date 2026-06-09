exports.config = {
  tests: "./tests/*_test.js",
  output: "./output",
  noGlobals: true,
  helpers: {
    Playwright: {
      url: process.env.CODECEPT_URL || "http://localhost",
      browser: "chromium",
      show: false,
      waitForTimeout: 15000,
      waitForAction: 250,
      chromium: {
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
  },
  retry: {
    Scenario: 1,
  },
  name: "uth-confms-e2e",
};
