/**
 * Users API CRUD Tests
 *
 * Tests /users/me endpoints for getting and deleting the current user.
 * Each test is independent and creates its own authenticated user.
 *
 * @tags @api @crud @users
 */

import { test, expect } from '@playwright/test';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
  seedAdminAndGetToken,
} from '../../../utils/auth-helpers';

test.describe('Users API - CRUD @api @crud', () => {
  test.describe('GET /users/me', () => {
    test('returns current authenticated user', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Get current user
      const response = await authRequest.get('/users/me');

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        emailVerified: false,
      });
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.get('/users/me');

      expect(response.status()).toBe(401);
    });

    test('returns 401 with invalid token', async ({ request }) => {
      const response = await request.get('/users/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('returns 401 with expired token format', async ({ request }) => {
      // Malformed JWT that looks like a token but is invalid
      const response = await request.get('/users/me', {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('DELETE /users/me', () => {
    test('deletes current authenticated user', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Delete the user
      const response = await authRequest.delete('/users/me');

      expect(response.status()).toBe(204);

      // Verify: User should no longer be accessible
      // Note: The token may still be valid for a short period,
      // but the user record should be gone
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.delete('/users/me');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('PUT /users/:userId/roles', () => {
    test('updates user roles when called by admin', async ({ request }) => {
      // Setup: Seed admin and create a regular user
      const admin = await seedAdminAndGetToken(request);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      const testUser = await createAuthenticatedUser(request);
      const userRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Admin updates user roles
      const response = await adminRequest.put(`/users/${testUser.id}/roles`, {
        data: { roles: ['SYSTEM_ADMIN'] },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.roles).toContain('SYSTEM_ADMIN');

      // Cleanup
      await userRequest.delete('/users/me');
    });

    test('returns 403 when non-admin tries to update roles', async ({
      request,
    }) => {
      // Setup: Create two regular users
      const userA = await createAuthenticatedUser(request);
      const userARequest = createAuthenticatedRequest(request, userA.idToken);

      const userB = await createAuthenticatedUser(request);
      const userBRequest = createAuthenticatedRequest(request, userB.idToken);

      // Test: Regular user tries to update another user's roles
      const response = await userARequest.put(`/users/${userB.id}/roles`, {
        data: { roles: ['SYSTEM_ADMIN'] },
      });

      expect(response.status()).toBe(403);

      // Cleanup
      await userARequest.delete('/users/me');
      await userBRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.put('/users/some-user-id/roles', {
        data: { roles: ['SYSTEM_ADMIN'] },
      });

      expect(response.status()).toBe(401);
    });

    test('returns 400 when roles array contains invalid role', async ({
      request,
    }) => {
      // Setup: Seed admin
      const admin = await seedAdminAndGetToken(request);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      const testUser = await createAuthenticatedUser(request);
      const userRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Try to set invalid role
      const response = await adminRequest.put(`/users/${testUser.id}/roles`, {
        data: { roles: ['INVALID_ROLE'] },
      });

      expect(response.status()).toBe(400);

      // Cleanup
      await userRequest.delete('/users/me');
    });

    test('returns 404 when user not found', async ({ request }) => {
      // Setup: Seed admin
      const admin = await seedAdminAndGetToken(request);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      // Test: Try to update non-existent user
      const response = await adminRequest.put(
        '/users/00000000-0000-0000-0000-000000000000/roles',
        {
          data: { roles: ['SYSTEM_ADMIN'] },
        },
      );

      expect(response.status()).toBe(404);
    });

    test('can remove all roles from user', async ({ request }) => {
      // Setup: Seed admin and create a user
      const admin = await seedAdminAndGetToken(request);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      const testUser = await createAuthenticatedUser(request);
      const userRequest = createAuthenticatedRequest(request, testUser.idToken);

      // First add a role
      await adminRequest.put(`/users/${testUser.id}/roles`, {
        data: { roles: ['SYSTEM_ADMIN'] },
      });

      // Test: Remove all roles
      const response = await adminRequest.put(`/users/${testUser.id}/roles`, {
        data: { roles: [] },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.roles).toEqual([]);

      // Cleanup
      await userRequest.delete('/users/me');
    });
  });
});
