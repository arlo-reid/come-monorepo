import { APIRequestContext } from '@playwright/test';
import { generateUserRegistration } from '../api/fixtures/test-data';

/**
 * Authentication helpers for API tests.
 *
 * These helpers facilitate creating authenticated test users
 * and obtaining Firebase tokens for authenticated API requests.
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  idToken: string;
}

/**
 * Firebase Auth REST API configuration.
 * Uses the Firebase Auth emulator or production API.
 *
 * The API key can be provided via:
 * 1. FIREBASE_API_KEY - direct API key
 * 2. FIREBASE_PUBLIC_KEY - base64-encoded Firebase config JSON
 */
function getFirebaseApiKey(): string {
  // Direct API key takes precedence
  if (process.env.FIREBASE_API_KEY) {
    return process.env.FIREBASE_API_KEY;
  }

  // Try to extract from FIREBASE_PUBLIC_KEY (base64-encoded JSON)
  if (process.env.FIREBASE_PUBLIC_KEY) {
    try {
      const decoded = Buffer.from(
        process.env.FIREBASE_PUBLIC_KEY,
        'base64',
      ).toString('utf-8');
      const config = JSON.parse(decoded);
      return config.apiKey || '';
    } catch {
      console.warn('Failed to decode FIREBASE_PUBLIC_KEY');
    }
  }

  return '';
}

const FIREBASE_API_KEY = getFirebaseApiKey();
const FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

/**
 * Get the Firebase Auth sign-in URL.
 * Uses emulator if FIREBASE_AUTH_EMULATOR_HOST is set.
 */
function getFirebaseSignInUrl(): string {
  if (FIREBASE_AUTH_EMULATOR_HOST) {
    return `http://${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  }
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
}

/**
 * Register a new user and sign in to get an ID token.
 *
 * @param request - Playwright request context
 * @param overrides - Optional user data overrides
 * @returns TestUser with credentials and ID token
 */
export async function createAuthenticatedUser(
  request: APIRequestContext,
  overrides?: { email?: string; password?: string; displayName?: string },
): Promise<TestUser> {
  const userData = generateUserRegistration(overrides);

  // Register the user via our API
  const registerResponse = await request.post('/auth/register', {
    data: userData,
  });

  if (registerResponse.status() !== 201) {
    const error = await registerResponse.text();
    throw new Error(`Failed to register user: ${error}`);
  }

  const user = await registerResponse.json();

  // Sign in via Firebase to get an ID token
  const idToken = await signInAndGetToken(userData.email, userData.password);

  return {
    id: user.id,
    email: userData.email,
    password: userData.password,
    idToken,
  };
}

/**
 * Sign in with email/password and get a Firebase ID token.
 *
 * @param email - User email
 * @param password - User password
 * @returns Firebase ID token
 */
export async function signInAndGetToken(
  email: string,
  password: string,
): Promise<string> {
  const signInUrl = getFirebaseSignInUrl();

  const response = await fetch(signInUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sign in: ${error}`);
  }

  const data = await response.json();
  return data.idToken;
}

/**
 * Create an authenticated request context.
 * Returns headers object with Authorization header set.
 *
 * @param idToken - Firebase ID token
 * @returns Headers object for authenticated requests
 */
export function authHeaders(idToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${idToken}`,
  };
}

/**
 * Helper to make an authenticated request.
 * Wraps the request with proper authorization headers.
 */
/**
 * Seed admin user and sign in to get an ID token.
 * Uses the POST /admin/seed endpoint which reads from env config.
 *
 * @param request - Playwright request context
 * @returns TestUser with admin credentials and ID token
 */
export async function seedAdminAndGetToken(
  request: APIRequestContext,
): Promise<TestUser> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set to use admin helpers',
    );
  }

  // Seed admin user (idempotent)
  const seedResponse = await request.post('/admin/seed');

  if (seedResponse.status() !== 200) {
    const error = await seedResponse.text();
    throw new Error(`Failed to seed admin: ${error}`);
  }

  const seedResult = await seedResponse.json();

  // Sign in via Firebase to get an ID token
  const idToken = await signInAndGetToken(adminEmail, adminPassword);

  return {
    id: seedResult.userId,
    email: adminEmail,
    password: adminPassword,
    idToken,
  };
}

export function createAuthenticatedRequest(
  request: APIRequestContext,
  idToken: string,
) {
  return {
    get: (url: string, options?: { headers?: Record<string, string> }) =>
      request.get(url, {
        ...options,
        headers: { ...authHeaders(idToken), ...options?.headers },
      }),
    post: (
      url: string,
      options?: { data?: unknown; headers?: Record<string, string> },
    ) =>
      request.post(url, {
        ...options,
        headers: { ...authHeaders(idToken), ...options?.headers },
      }),
    patch: (
      url: string,
      options?: { data?: unknown; headers?: Record<string, string> },
    ) =>
      request.patch(url, {
        ...options,
        headers: { ...authHeaders(idToken), ...options?.headers },
      }),
    put: (
      url: string,
      options?: { data?: unknown; headers?: Record<string, string> },
    ) =>
      request.put(url, {
        ...options,
        headers: { ...authHeaders(idToken), ...options?.headers },
      }),
    delete: (url: string, options?: { headers?: Record<string, string> }) =>
      request.delete(url, {
        ...options,
        headers: { ...authHeaders(idToken), ...options?.headers },
      }),
  };
}
