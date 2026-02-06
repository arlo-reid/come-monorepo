import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import path from "path";
import { testConfig } from "./utils/test-config";

// Load environment variables from .env.local (using absolute path for VS Code extension compatibility)
// path.resolve with __dirname works in both CJS and ESM when run through ts-node/tsx
const testsDir = path.resolve(__dirname);
config({ path: path.join(testsDir, ".env") });
config({ path: path.join(testsDir, ".env.local") });

/**
 * App URLs - can be overridden via environment variables
 */
const appUrls = {
  api: testConfig.baseUrl,
  web: process.env.WEB_BASE_URL || "http://localhost:3000",
  devtools: process.env.DEVTOOLS_BASE_URL || "http://localhost:5173",
};

export default defineConfig({
  testDir: ".",
  testMatch: ["**/*.spec.ts"],

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: process.env.CI
    ? [["junit", { outputFile: "test-results/junit.xml" }], ["html"]]
    : [["html"], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in API requests */
    baseURL: testConfig.baseUrl,

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for different test types */
  projects: [
    {
      name: "api",
      testDir: "./api",
      testMatch: "**/*.spec.ts",
      use: {
        baseURL: appUrls.api,
      },
    },
    {
      name: "e2e-web",
      testDir: "./e2e/web",
      testMatch: "**/*.spec.ts",
      use: {
        baseURL: appUrls.web,
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "e2e-devtools",
      testDir: "./e2e/devtools-ui",
      testMatch: "**/*.spec.ts",
      use: {
        baseURL: appUrls.devtools,
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
