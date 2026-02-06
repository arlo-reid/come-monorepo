import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@repo/nestjs-config/module';
import { ConfigService } from '@repo/nestjs-config/service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './config/app.config';
import { AuthModule, FirebaseAuthMiddleware } from './modules/auth/auth.module';
import { USER_RESOLVER } from './modules/auth/types/auth-options.interface';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { UserResolverService } from './modules/users/application/services/user-resolver.service';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(AppConfig),
    AuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        return {
          firebase: {
            projectId: config.config.FIREBASE_PROJECT_ID,
            serviceAccountBase64: config.config.FIREBASE_SA_KEY,
          },
        };
      },
    }),
    // Feature modules (bounded contexts)
    UsersModule,
    OrganisationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Provide the user resolver for auto-provisioning
    // The middleware uses this to create users on first API request
    {
      provide: USER_RESOLVER,
      useExisting: UserResolverService,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Firebase auth middleware globally to populate req.user
    // BEFORE request-scoped providers (like EnhancedDB) are instantiated
    // When a valid token lacks userId claims, the middleware uses
    // UserResolverService to auto-provision the user
    consumer.apply(FirebaseAuthMiddleware).forRoutes('*');
  }
}
