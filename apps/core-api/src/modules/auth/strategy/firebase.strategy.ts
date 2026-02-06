import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

export type FirebaseAuthOptions = {
  projectId?: string;
  credentialsPath?: string;
  serviceAccountBase64?: string;
  checkRevoked?: boolean;
};

/**
 * Firebase authentication strategy.
 * Initializes Firebase Admin SDK and verifies ID tokens.
 */
@Injectable()
export class FirebaseStrategy implements OnModuleInit {
  private readonly logger = new Logger(FirebaseStrategy.name);
  private app!: admin.app.App;

  constructor(private readonly options: FirebaseAuthOptions) {}

  async onModuleInit(): Promise<void> {
    // Avoid re-initializing if already done
    if (admin.apps.length > 0) {
      this.app = admin.apps[0]!;
      this.logger.log('Using existing Firebase Admin instance');
      return;
    }

    const initOptions: admin.AppOptions = {};

    if (this.options.projectId) {
      initOptions.projectId = this.options.projectId;
    }

    // Priority: serviceAccountBase64 > credentialsPath > Application Default Credentials
    if (this.options.serviceAccountBase64) {
      const decodedCredentials: string = JSON.parse(
        Buffer.from(this.options.serviceAccountBase64, 'base64').toString(
          'utf-8',
        ),
      );
      initOptions.credential = admin.credential.cert(decodedCredentials);
      this.logger.log('Using base64-encoded service account credentials');
    } else if (this.options.credentialsPath) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(this.options.credentialsPath);
      initOptions.credential = admin.credential.cert(serviceAccount);
    } else {
      // Use Application Default Credentials
      initOptions.credential = admin.credential.applicationDefault();
    }

    this.app = admin.initializeApp(initOptions);
    this.logger.log('Firebase Admin SDK initialized');
  }

  /**
   * Verify a Firebase ID token and return the decoded claims.
   *
   * @param idToken - The Firebase ID token from the client
   * @returns Decoded token with user claims
   * @throws Error if token is invalid or expired
   */
  async verifyToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.app.auth().verifyIdToken(idToken, this.options.checkRevoked);
  }
}
