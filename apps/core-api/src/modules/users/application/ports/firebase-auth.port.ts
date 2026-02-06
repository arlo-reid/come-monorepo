/**
 * Firebase user record returned from admin operations.
 */
export interface FirebaseUserRecord {
  uid: string;
  email?: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  providerData: Array<{
    providerId: string;
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  }>;
}

/**
 * Firebase Auth Port
 *
 * Defines the contract for Firebase authentication operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface FirebaseAuthPort {
  /**
   * Create a new user in Firebase Auth.
   */
  createUser(params: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<FirebaseUserRecord>;

  /**
   * Get a user by their Firebase UID.
   */
  getUser(uid: string): Promise<FirebaseUserRecord>;

  /**
   * Get a user by their email address.
   */
  getUserByEmail(email: string): Promise<FirebaseUserRecord | null>;

  /**
   * Delete a user from Firebase Auth.
   */
  deleteUser(uid: string): Promise<void>;

  /**
   * Generate a password reset link.
   */
  generatePasswordResetLink(email: string): Promise<string>;

  /**
   * Generate an email verification link.
   */
  generateEmailVerificationLink(email: string): Promise<string>;

  /**
   * Verify an ID token and return decoded claims.
   */
  verifyIdToken(
    idToken: string,
  ): Promise<{ uid: string; email?: string; emailVerified: boolean }>;

  /**
   * Set custom claims on a user's token.
   */
  setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void>;

  /**
   * Revoke all refresh tokens for a user.
   */
  revokeRefreshTokens(uid: string): Promise<void>;

  /**
   * Sign in a user with email and password via Firebase REST API.
   * Returns idToken, refreshToken, and user info.
   */
  signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<FirebaseSignInResult>;
}

/**
 * Result from Firebase sign-in operation.
 */
export interface FirebaseSignInResult {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
  displayName?: string;
  registered: boolean;
}
