import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

export const CHROMIUM_AUTH_FILE = path.join(
  import.meta.dirname,
  "./.auth/user-chromium.json",
);
export const FIREFOX_AUTH_FILE = path.join(
  import.meta.dirname,
  "./.auth/user-firefox.json",
);
export const WEBKIT_AUTH_FILE = path.join(
  import.meta.dirname,
  "./.auth/user-webkit.json",
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    // { name: "setup", testMatch: /.*\.setup\.ts/ },

    //--begin-chromium
    {
      name: "chromium-setup",
      testMatch: /chromium.setup.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: CHROMIUM_AUTH_FILE,
      },
      dependencies: ["chromium-setup"],
    },
    //--end-chromium

    //--begin-firefox
    {
      name: "firefox-setup",
      testMatch: /firefox.setup.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: FIREFOX_AUTH_FILE,
      },
      dependencies: ["firefox-setup"],
    },
    //--end-firefox

    //--begin-webkit
    // setup using chromium to get the secure cookies and alter it later
    {
      name: "webkit-setup",
      testMatch: /webkit.setup.ts/,
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: WEBKIT_AUTH_FILE,
      },
      dependencies: ["webkit-setup"],
    },
    //--end-webkit
  ],
});
