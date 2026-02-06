/**
 * Profile API CRUD Tests
 *
 * Tests profile endpoints for getting and updating user profiles.
 * Each test is independent and creates its own authenticated user.
 *
 * @tags @api @crud @profile
 */

import { test, expect } from '@playwright/test';
import { generateProfileUpdate } from '../../fixtures/test-data';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
} from '../../../utils/auth-helpers';

test.describe('Profile API - CRUD @api @crud', () => {
  test.describe('GET /profile', () => {
    test('returns current user profile', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Get profile
      const response = await authRequest.get('/profile');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        userId: testUser.id,
        timezone: expect.any(String),
        locale: expect.any(String),
        notificationPreferences: {
          emailNotifications: expect.any(Boolean),
          pushNotifications: expect.any(Boolean),
          marketingEmails: expect.any(Boolean),
        },
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.get('/profile');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('PATCH /profile', () => {
    test('updates profile display name', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = { displayName: 'Updated Display Name' };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.displayName).toBe(updatePayload.displayName);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates profile bio', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = { bio: 'This is my updated bio for testing' };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.bio).toBe(updatePayload.bio);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates profile timezone', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = { timezone: 'Europe/London' };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.timezone).toBe(updatePayload.timezone);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates profile locale', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = { locale: 'fr-FR' };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.locale).toBe(updatePayload.locale);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates notification preferences', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = {
        notificationPreferences: {
          emailNotifications: false,
          pushNotifications: true,
          marketingEmails: false,
        },
      };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.notificationPreferences).toMatchObject(
        updatePayload.notificationPreferences,
      );

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates multiple profile fields at once', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile with multiple fields
      const updatePayload = generateProfileUpdate({
        displayName: 'Multi Field Update',
        bio: 'Updated via multi-field test',
        timezone: 'Asia/Tokyo',
        locale: 'ja-JP',
      });
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        displayName: updatePayload.displayName,
        bio: updatePayload.bio,
        timezone: updatePayload.timezone,
        locale: updatePayload.locale,
      });

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('updates avatar URL', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile
      const updatePayload = { avatarUrl: 'https://example.com/avatar.jpg' };
      const response = await authRequest.patch('/profile', {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.avatarUrl).toBe(updatePayload.avatarUrl);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when display name is too short', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile with invalid data
      const response = await authRequest.patch('/profile', {
        data: { displayName: 'A' },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when avatar URL is invalid', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile with invalid URL
      const response = await authRequest.patch('/profile', {
        data: { avatarUrl: 'not-a-valid-url' },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when bio exceeds max length', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Update profile with bio over 500 characters
      const response = await authRequest.patch('/profile', {
        data: { bio: 'x'.repeat(501) },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.patch('/profile', {
        data: { displayName: 'Test' },
      });

      expect(response.status()).toBe(401);
    });
  });
});
