import {
  DynamicModule,
  FactoryProvider,
  Module,
  Provider,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthGuard } from './guards/auth.guard';
import { FirebaseAuthMiddleware } from './middleware/firebase-auth.middleware';
import {
  FirebaseAuthOptions,
  FirebaseStrategy,
} from './strategy/firebase.strategy';
import {
  USER_RESOLVER,
  UserResolverClass,
} from './types/auth-options.interface';

export { FirebaseAuthMiddleware } from './middleware/firebase-auth.middleware';
export type { FirebaseAuthOptions } from './strategy/firebase.strategy';

export enum AuthStrategy {
  FIREBASE = 'firebase',
}

export interface AuthModuleOptions {
  firebase?: FirebaseAuthOptions;
  userResolver?: UserResolverClass;
}

export interface AuthModuleAsyncOptions {
  imports?: DynamicModule['imports'];
  useFactory: (
    ...args: any[]
  ) => Promise<AuthModuleOptions> | AuthModuleOptions;
  inject?: FactoryProvider['inject'];
}

const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

/**
 * Auth Module
 *
 * Provides authentication infrastructure for incoming HTTP requests:
 * - AuthGuard: Validates Bearer tokens on protected routes
 * - FirebaseStrategy: Initializes Firebase Admin SDK and verifies tokens
 * - Decorators: @Public(), @CurrentUser()
 *
 * Note: Firebase admin operations (createUser, deleteUser, etc.) are NOT
 * provided here. Those belong to domain-specific infrastructure adapters
 * (e.g., users/infrastructure/firebase/firebase-auth.adapter.ts).
 *
 * @example
 * ```typescript
 * // In AppModule
 * AuthModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService<AppConfig>) => ({
 *     firebase: {
 *       projectId: config.get('FIREBASE_PROJECT_ID'),
 *       serviceAccountBase64: config.get('FIREBASE_SA_KEY'),
 *     },
 *     userResolver: UserResolverService, // optional
 *   }),
 * })
 * ```
 */
@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: AUTH_OPTIONS,
        useValue: options,
      },
      {
        provide: FirebaseStrategy,
        useFactory: () => new FirebaseStrategy(options.firebase ?? {}),
      },
      {
        provide: APP_GUARD,
        useClass: AuthGuard,
      },
    ];

    if (options.userResolver) {
      providers.push({
        provide: USER_RESOLVER,
        useClass: options.userResolver,
      });
    }

    return {
      module: AuthModule,
      global: true,
      providers: [...providers, FirebaseAuthMiddleware],
      exports: [FirebaseStrategy, FirebaseAuthMiddleware],
    };
  }

  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: AUTH_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      },
      {
        provide: FirebaseStrategy,
        useFactory: (authOptions: AuthModuleOptions) =>
          new FirebaseStrategy(authOptions.firebase ?? {}),
        inject: [AUTH_OPTIONS],
      },
      {
        provide: APP_GUARD,
        useClass: AuthGuard,
      },
      // Note: USER_RESOLVER is provided by the consuming module (e.g., AppModule)
      // via useExisting to enable auto-provisioning in the middleware
    ];

    return {
      module: AuthModule,
      global: true,
      imports: options.imports ?? [],
      providers: [...providers, FirebaseAuthMiddleware],
      exports: [FirebaseStrategy, FirebaseAuthMiddleware],
    };
  }
}
