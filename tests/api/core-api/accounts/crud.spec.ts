/**
 * Accounts API CRUD Tests
 *
 * Tests account linking and unlinking endpoints.
 * Each test is independent and creates its own authenticated user.
 *
 * @tags @api @crud @accounts
 */

import { test, expect } from '@playwright/test';
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
} from '../../../utils/auth-helpers';

/**
 * Auth provider types as defined in the domain
 */
const AuthProviderType = {
  EMAIL_PASSWORD: 'email_password',
  GOOGLE: 'google',
  APPLE: 'apple',
} as const;

test.describe('Accounts API - CRUD @api @crud', () => {
  test.describe('POST /accounts/link', () => {
    test('links a Google account to current user', async ({ request }) => {
      // Setup: Create an authenticated user (already has email_password account)
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link a Google account
      const linkPayload = {
        providerType: AuthProviderType.GOOGLE,
        providerAccountId: `google-${Date.now()}`,
        providerEmail: 'test@gmail.com',
        providerDisplayName: 'Test Google User',
      };
      const response = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        userId: testUser.id,
        providerType: linkPayload.providerType,
        providerAccountId: linkPayload.providerAccountId,
        providerEmail: linkPayload.providerEmail,
        providerDisplayName: linkPayload.providerDisplayName,
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('links an Apple account to current user', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link an Apple account
      const linkPayload = {
        providerType: AuthProviderType.APPLE,
        providerAccountId: `apple-${Date.now()}`,
        providerEmail: 'test@icloud.com',
      };
      const response = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.providerType).toBe(AuthProviderType.APPLE);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('links account with photo URL', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link account with photo URL
      const linkPayload = {
        providerType: AuthProviderType.GOOGLE,
        providerAccountId: `google-photo-${Date.now()}`,
        providerPhotoUrl: 'https://example.com/photo.jpg',
      };
      const response = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.providerPhotoUrl).toBe(linkPayload.providerPhotoUrl);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when provider type is missing', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link without provider type
      const response = await authRequest.post('/accounts/link', {
        data: {
          providerAccountId: 'some-id',
        },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when provider account ID is missing', async ({
      request,
    }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link without provider account ID
      const response = await authRequest.post('/accounts/link', {
        data: {
          providerType: AuthProviderType.GOOGLE,
        },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when provider type is invalid', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link with invalid provider type
      const response = await authRequest.post('/accounts/link', {
        data: {
          providerType: 'invalid_provider',
          providerAccountId: 'some-id',
        },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when provider email is invalid', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link with invalid email
      const response = await authRequest.post('/accounts/link', {
        data: {
          providerType: AuthProviderType.GOOGLE,
          providerAccountId: 'some-id',
          providerEmail: 'not-an-email',
        },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when provider photo URL is invalid', async ({
      request,
    }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Link with invalid photo URL
      const response = await authRequest.post('/accounts/link', {
        data: {
          providerType: AuthProviderType.GOOGLE,
          providerAccountId: 'some-id',
          providerPhotoUrl: 'not-a-url',
        },
      });

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 409 when account already linked', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const linkPayload = {
        providerType: AuthProviderType.GOOGLE,
        providerAccountId: `google-dup-${Date.now()}`,
      };

      // Link the account first
      const firstResponse = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });
      expect(firstResponse.status()).toBe(201);

      // Test: Try to link the same provider type again
      const secondResponse = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });

      expect(secondResponse.status()).toBe(409);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.post('/accounts/link', {
        data: {
          providerType: AuthProviderType.GOOGLE,
          providerAccountId: 'some-id',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('DELETE /accounts/unlink/:providerType', () => {
    test('unlinks a linked account (when multiple accounts exist)', async ({
      request,
    }) => {
      // Setup: Create user and link a second account
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Link a Google account first
      const linkPayload = {
        providerType: AuthProviderType.GOOGLE,
        providerAccountId: `google-unlink-${Date.now()}`,
      };
      const linkResponse = await authRequest.post('/accounts/link', {
        data: linkPayload,
      });
      expect(linkResponse.status()).toBe(201);

      // Test: Unlink the Google account (user still has email_password)
      const response = await authRequest.delete(
        `/accounts/unlink/${AuthProviderType.GOOGLE}`,
      );

      expect(response.status()).toBe(204);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 400 when trying to unlink only auth method', async ({
      request,
    }) => {
      // Setup: Create an authenticated user (only has email_password account)
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Try to unlink the only auth method
      const response = await authRequest.delete(
        `/accounts/unlink/${AuthProviderType.EMAIL_PASSWORD}`,
      );

      expect(response.status()).toBe(400);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 404 when account not found', async ({ request }) => {
      // Setup: Create an authenticated user
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Test: Try to unlink a non-existent account
      const response = await authRequest.delete(
        `/accounts/unlink/${AuthProviderType.GOOGLE}`,
      );

      expect(response.status()).toBe(404);

      // Cleanup: Delete the user
      await authRequest.delete('/users/me');
    });

    test('returns 401 when not authenticated', async ({ request }) => {
      const response = await request.delete(
        `/accounts/unlink/${AuthProviderType.GOOGLE}`,
      );

      expect(response.status()).toBe(401);
    });
  });
});
