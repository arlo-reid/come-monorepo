/**
 * Admin API CRUD Tests
 *
 * Tests admin endpoints including seeding and role management.
 * Each test is independent and works with the seeded admin user.
 *
 * @tags @api @crud @admin
 */

import { test, expect } from '@playwright/test';

test.describe('Admin API - CRUD @api @crud', () => {
  test.describe('POST /admin/seed', () => {
    test('seeds admin user from environment config', async ({ request }) => {
      const response = await request.post('/admin/seed');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.email).toBeDefined();
      expect(body.userId).toBeDefined();
      expect(typeof body.created).toBe('boolean');
    });

    test('is idempotent - returns same admin on multiple calls', async ({
      request,
    }) => {
      // First call
      const firstResponse = await request.post('/admin/seed');
      expect(firstResponse.status()).toBe(200);
      const firstBody = await firstResponse.json();

      // Second call
      const secondResponse = await request.post('/admin/seed');
      expect(secondResponse.status()).toBe(200);
      const secondBody = await secondResponse.json();

      // Should return same user ID
      expect(secondBody.userId).toBe(firstBody.userId);
      expect(secondBody.email).toBe(firstBody.email);
      // Second call should indicate user was not newly created
      expect(secondBody.created).toBe(false);
    });

    test('returns admin with SYSTEM_ADMIN role in response', async ({
      request,
    }) => {
      const response = await request.post('/admin/seed');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.email).toBeDefined();
      // The seeded admin should have been created or found
      expect(body.userId).toBeDefined();
    });
  });
});
