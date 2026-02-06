import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth as ClientAuth,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import * as admin from 'firebase-admin';

import {
  FirebaseAuthPort,
  FirebaseSignInResult,
  FirebaseUserRecord,
} from '../../application/ports/firebase-auth.port';

export const FIREBASE_API_KEY = Symbol('FIREBASE_API_KEY');
export const FIREBASE_PROJECT_ID = Symbol('FIREBASE_PROJECT_ID');

export interface FirebaseClientConfig {
  /** Base64-encoded Firebase client config JSON */
  publicKeyBase64: string;
}

export const FIREBASE_CLIENT_CONFIG = Symbol('FIREBASE_CLIENT_CONFIG');

/**
 * Firebase Auth Adapter
 *
 * Infrastructure implementation of the FirebaseAuthPort.
 * Uses Firebase Admin SDK for server-side operations and
 * Firebase Client SDK for user authentication (sign-in).
 *
 * Note: Assumes Firebase Admin SDK has already been initialized
 * (typically via FirebaseStrategy in the AuthModule).
 */
@Injectable()
export class FirebaseAuthAdapter implements FirebaseAuthPort, OnModuleInit {
  private readonly logger = new Logger(FirebaseAuthAdapter.name);
  private clientApp!: FirebaseApp;
  private clientAuth!: ClientAuth;

  constructor(
    @Inject(FIREBASE_CLIENT_CONFIG)
    private readonly clientConfig: FirebaseClientConfig,
  ) {}

  onModuleInit(): void {
    // Initialize Firebase Client SDK (separate from Admin SDK)
    if (getApps().length > 0) {
      this.clientApp = getApp();
    } else {
      // Decode base64-encoded Firebase client config
      const configStr = Buffer.from(
        this.clientConfig.publicKeyBase64,
        'base64',
      ).toString('utf-8');
      const firebaseConfig = JSON.parse(configStr) as Record<string, string>;

      this.clientApp = initializeApp(firebaseConfig);
    }
    this.clientAuth = getAuth(this.clientApp);
    this.logger.log('Firebase Client SDK initialized for authentication');
  }

  private get auth(): admin.auth.Auth {
    if (admin.apps.length === 0) {
      throw new Error(
        'Firebase Admin SDK not initialized. Ensure AuthModule is properly configured.',
      );
    }
    return admin.app().auth();
  }

  async createUser(params: {
    email: string;
    password: string;
    displayName?: string;
  }): Promise<FirebaseUserRecord> {
    this.logger.debug(`Creating Firebase user for email: ${params.email}`);

    const userRecord = await this.auth.createUser({
      email: params.email,
      password: params.password,
      displayName: params.displayName,
    });

    return this.mapToFirebaseUserRecord(userRecord);
  }

  async getUser(uid: string): Promise<FirebaseUserRecord> {
    const userRecord = await this.auth.getUser(uid);
    return this.mapToFirebaseUserRecord(userRecord);
  }

  async getUserByEmail(email: string): Promise<FirebaseUserRecord | null> {
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return this.mapToFirebaseUserRecord(userRecord);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'auth/user-not-found'
      ) {
        return null;
      }
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    this.logger.debug(`Deleting Firebase user: ${uid}`);
    await this.auth.deleteUser(uid);
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    return this.auth.generatePasswordResetLink(email);
  }

  async generateEmailVerificationLink(email: string): Promise<string> {
    return this.auth.generateEmailVerificationLink(email);
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<{ uid: string; email?: string; emailVerified: boolean }> {
    const decodedToken = await this.auth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified ?? false,
    };
  }

  async setCustomClaims(
    uid: string,
    claims: Record<string, unknown>,
  ): Promise<void> {
    this.logger.debug(`Setting custom claims for user: ${uid}`);
    await this.auth.setCustomUserClaims(uid, claims);
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    this.logger.debug(`Revoking refresh tokens for user: ${uid}`);
    await this.auth.revokeRefreshTokens(uid);
  }

  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<FirebaseSignInResult> {
    this.logger.debug(`Signing in user: ${params.email}`);

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.clientAuth,
        params.email,
        params.password,
      );

      const idToken = await userCredential.user.getIdToken();

      return {
        idToken,
        refreshToken: userCredential.user.refreshToken,
        expiresIn: '3600', // Firebase tokens expire in 1 hour
        localId: userCredential.user.uid,
        email: userCredential.user.email ?? params.email,
        displayName: userCredential.user.displayName ?? undefined,
        registered: true,
      };
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      this.logger.warn(
        `Firebase sign-in failed: ${firebaseError.code ?? 'unknown'}`,
      );
      throw new UnauthorizedException(
        this.mapFirebaseError(firebaseError.code ?? 'unknown'),
      );
    }
  }

  /**
   * Map Firebase error codes to user-friendly messages.
   */
  private mapFirebaseError(code: string): string {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/invalid-email': 'Invalid email format',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests':
        'Too many failed attempts. Please try again later',
    };
    return errorMap[code] ?? 'Authentication failed';
  }

  /**
   * Map Firebase Admin UserRecord to our domain-friendly interface.
   */
  private mapToFirebaseUserRecord(
    record: admin.auth.UserRecord,
  ): FirebaseUserRecord {
    return {
      uid: record.uid,
      email: record.email,
      emailVerified: record.emailVerified,
      displayName: record.displayName,
      photoURL: record.photoURL,
      disabled: record.disabled,
      providerData: record.providerData.map((provider) => ({
        providerId: provider.providerId,
        uid: provider.uid,
        email: provider.email,
        displayName: provider.displayName,
        photoURL: provider.photoURL,
      })),
    };
  }
}
