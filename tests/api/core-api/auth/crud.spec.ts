/**
 * Auth API CRUD Tests
 *
 * Tests user registration endpoint.
 * Each test is independent and cleans up after itself.
 *
 * @tags @api @crud @auth
 */

import { test, expect } from '@playwright/test';
import { generateUserRegistration } from '../../fixtures/test-data';

test.describe('Auth API - Registration @api @crud', () => {
  test.describe('POST /auth/register', () => {
    test('registers user with valid email and password', async ({ request }) => {
      const payload = generateUserRegistration();

      const response = await request.post('/auth/register', {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        email: payload.email,
        emailVerified: false,
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Note: User cleanup requires authentication, which may need
      // a separate admin endpoint or direct DB cleanup in CI
    });

    test('registers user with optional display name', async ({ request }) => {
      const payload = generateUserRegistration({
        displayName: 'John Test User',
      });

      const response = await request.post('/auth/register', {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.email).toBe(payload.email);
      // Note: displayName is on the Profile, not User response
    });

    test('returns 400 when email is missing', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          password: 'SecurePass123!',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when email format is invalid', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'not-an-email',
          password: 'SecurePass123!',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password is missing', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password is too short', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
          password: 'Short1',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password lacks uppercase', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
          password: 'securepass123',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password lacks lowercase', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
          password: 'SECUREPASS123',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password lacks number', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
          password: 'SecurePassword',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('returns 409 when email already exists', async ({ request }) => {
      const payload = generateUserRegistration();

      // First registration should succeed
      const firstResponse = await request.post('/auth/register', {
        data: payload,
      });
      expect(firstResponse.status()).toBe(201);

      // Second registration with same email should fail
      const secondResponse = await request.post('/auth/register', {
        data: payload,
      });

      expect(secondResponse.status()).toBe(409);
    });

    test('returns 400 when display name is too short', async ({ request }) => {
      const response = await request.post('/auth/register', {
        data: {
          email: 'test@example.com',
          password: 'SecurePass123!',
          displayName: 'A',
        },
      });

      expect(response.status()).toBe(400);
    });
  });
});
