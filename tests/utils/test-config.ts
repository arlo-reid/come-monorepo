/**
 * Test configuration that adapts to different environments
 *
 * Usage:
 *   API_BASE_URL=https://staging.example.com npm run test:api
 */
export const testConfig = {
  /** Base URL for API requests */
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8000',

  /** Current test environment identifier */
  environment: process.env.TEST_ENV || 'local',

  /** Request timeout in milliseconds */
  timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : 30000,
} as const;

export type TestEnvironment = 'local' | 'ci' | 'staging' | 'production';
