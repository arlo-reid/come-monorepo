/**
 * Web App Home Page E2E Tests
 *
 * Basic smoke tests to verify the home page renders correctly.
 *
 * @tags @e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page @e2e', () => {
  test('renders the home page', async ({ page }) => {
    await page.goto('/');

    // Verify page loads without errors
    await expect(page).toHaveTitle(/.*/, { timeout: 10000 });

    // Verify key content is visible
    await expect(page.getByAltText('Turborepo logo').first()).toBeVisible();
    await expect(page.getByText('Get started by editing')).toBeVisible();
    await expect(page.getByRole('link', { name: /Deploy now/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Read our docs/i })).toBeVisible();
  });
});
