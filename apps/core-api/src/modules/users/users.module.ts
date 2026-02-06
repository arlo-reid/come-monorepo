import { Module } from '@nestjs/common';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { ConfigService } from '@repo/nestjs-config/service';
import { AppConfig } from 'config/app.config';
import {
  DbService,
  ENHANCED_DB,
  providers as dbProviders,
  RAW_DB,
} from 'libs/db/db.providers';

import { AccountLinkedEventHandler } from './application/event-handlers/account-linked.event-handler';
import { UserCreatedEventHandler } from './application/event-handlers/user-created.event-handler';
import { type AccountRepositoryPort } from './application/ports/account-repository.port';
import { type ProfileRepositoryPort } from './application/ports/profile-repository.port';
import { type UserRepositoryPort } from './application/ports/user-repository.port';
import { GetProfileHandler } from './application/queries/get-profile/get-profile.handler';
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';
import { UserRegistrationService } from './application/services/user-registration.service';
import { UserResolverService } from './application/services/user-resolver.service';
import { DeleteUserHandler } from './application/use-cases/delete-user/delete-user.handler';
import { LinkAccountHandler } from './application/use-cases/link-account/link-account.handler';
import { LoginHandler } from './application/use-cases/login/login.handler';
import { RegisterUserHandler } from './application/use-cases/register-user/register-user.handler';
import { SeedAdminHandler } from './application/use-cases/seed-admin/seed-admin.handler';
import { UnlinkAccountHandler } from './application/use-cases/unlink-account/unlink-account.handler';
import { UpdateProfileHandler } from './application/use-cases/update-profile/update-profile.handler';
import { UpdateRolesHandler } from './application/use-cases/update-roles/update-roles.handler';
import {
  ACCOUNT_REPOSITORY,
  FIREBASE_AUTH,
  PROFILE_REPOSITORY,
  RAW_ACCOUNT_REPOSITORY,
  RAW_PROFILE_REPOSITORY,
  RAW_USER_REPOSITORY,
  USER_REPOSITORY,
} from './di-tokens';
import {
  FIREBASE_CLIENT_CONFIG,
  FirebaseAuthAdapter,
} from './infrastructure/firebase/firebase-auth.adapter';
import { AccountWriteRepository } from './infrastructure/persistence/write-repositories/account.write-repository';
import { ProfileWriteRepository } from './infrastructure/persistence/write-repositories/profile.write-repository';
import { UserWriteRepository } from './infrastructure/persistence/write-repositories/user.write-repository';
import { DeleteUserHttpController } from './interface/commands/delete-user.command.http';
import { LinkAccountHttpController } from './interface/commands/link-account.command.http';
import { LoginHttpController } from './interface/commands/login.command.http';
import { RegisterUserHttpController } from './interface/commands/register-user.command.http';
import { SeedAdminHttpController } from './interface/commands/seed-admin.command.http';
import { UnlinkAccountHttpController } from './interface/commands/unlink-account.command.http';
import { UpdateProfileHttpController } from './interface/commands/update-profile.command.http';
import { UpdateRolesHttpController } from './interface/commands/update-roles.command.http';
import { GetMeHttpController } from './interface/queries/get-me.query.http';
import { GetProfileHttpController } from './interface/queries/get-profile.query.http';

const UseCaseHandlers = [
  RegisterUserHandler,
  LoginHandler,
  LinkAccountHandler,
  UnlinkAccountHandler,
  UpdateProfileHandler,
  DeleteUserHandler,
  SeedAdminHandler,
  UpdateRolesHandler,
];

const QueryHandlers = [GetUserByIdHandler, GetProfileHandler];

const EventHandlers = [UserCreatedEventHandler, AccountLinkedEventHandler];

/**
 * Users Module
 *
 * Bounded context module for user, account, and profile management.
 * Wires together all layers of the hexagonal architecture:
 * - Domain (aggregates, events, value objects)
 * - Application (use-case handlers, query handlers, ports)
 * - Interface (HTTP controllers, DTOs, mappers)
 * - Infrastructure (repository implementations, Firebase adapter)
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    // Commands
    RegisterUserHttpController,
    LoginHttpController,
    UpdateProfileHttpController,
    LinkAccountHttpController,
    UnlinkAccountHttpController,
    DeleteUserHttpController,
    UpdateRolesHttpController,
    SeedAdminHttpController,
    // Queries
    GetProfileHttpController,
    GetMeHttpController,
  ],
  providers: [
    ...dbProviders,
    UserRegistrationService,
    UserResolverService,
    ...UseCaseHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    {
      provide: FIREBASE_CLIENT_CONFIG,
      useFactory: (config: ConfigService<AppConfig>) => ({
        publicKeyBase64: config.config.FIREBASE_PUBLIC_KEY,
      }),
      inject: [ConfigService],
    },
    {
      provide: FIREBASE_AUTH,
      useClass: FirebaseAuthAdapter,
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): UserRepositoryPort =>
        new UserWriteRepository(db, eventBus),
      inject: [ENHANCED_DB, EventBus],
    },
    {
      provide: RAW_USER_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): UserRepositoryPort =>
        new UserWriteRepository(db, eventBus),
      inject: [RAW_DB, EventBus],
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): AccountRepositoryPort =>
        new AccountWriteRepository(db, eventBus),
      inject: [ENHANCED_DB, EventBus],
    },
    {
      provide: RAW_ACCOUNT_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): AccountRepositoryPort =>
        new AccountWriteRepository(db, eventBus),
      inject: [RAW_DB, EventBus],
    },
    {
      provide: PROFILE_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): ProfileRepositoryPort =>
        new ProfileWriteRepository(db, eventBus),
      inject: [ENHANCED_DB, EventBus],
    },
    {
      provide: RAW_PROFILE_REPOSITORY,
      useFactory: (db: DbService, eventBus: EventBus): ProfileRepositoryPort =>
        new ProfileWriteRepository(db, eventBus),
      inject: [RAW_DB, EventBus],
    },
  ],
  exports: [
    USER_REPOSITORY,
    ACCOUNT_REPOSITORY,
    PROFILE_REPOSITORY,
    UserResolverService,
  ],
})
export class UsersModule {}
