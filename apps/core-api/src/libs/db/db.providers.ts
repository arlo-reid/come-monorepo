import { Provider, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { ZenStackClient } from '@zenstackhq/orm';
import { PostgresDialect } from '@zenstackhq/orm/dialects/postgres';
import { PolicyPlugin } from '@zenstackhq/plugin-policy';
import { Pool } from 'pg';
import { schema, SchemaType } from 'generated/zenstack/schema';

import { UnitOfWork } from './unit-of-work';

export const ENHANCED_DB = Symbol('ENHANCED_DB');
export const RAW_DB = Symbol('RAW_DB');
export const RAW_UNIT_OF_WORK = Symbol('RAW_UNIT_OF_WORK');

export class DbService extends ZenStackClient<SchemaType> {}

export const DBProvider: Provider = {
  provide: RAW_DB,
  useFactory: () => {
    // Secrets are loaded in main.ts before NestJS bootstraps
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    return new DbService(schema, {
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString }),
      }),
    });
  },
};

interface AuthenticatedRequest extends Request {
  user?: { id: string; roles?: string[] };
}

export const EnhancedDBProvider: Provider = {
  provide: ENHANCED_DB,
  // make sure it's request-scoped to capture per-request user context
  scope: Scope.REQUEST,

  useFactory: (req: AuthenticatedRequest, db: DbService) => {
    // extract the current user from the request, implementation depends on
    // your authentication solution
    const user = req.user ?? undefined;

    // install the PolicyPlugin and set the current user context
    return db.$use(new PolicyPlugin()).$setAuth(user);
  },

  inject: [REQUEST, RAW_DB],
};

// ---- UnitOfWork (publishes via Nest CQRS EventBus)
// Uses the request-scoped enhanced Prisma so ZenStack policies are active.
export const UnitOfWorkProvider: Provider = {
  provide: UnitOfWork,
  scope: Scope.REQUEST,
  inject: [ENHANCED_DB, EventBus],
  useFactory: (db: DbService, eventBus: EventBus) =>
    new UnitOfWork(db, eventBus),
};

// ---- UnitOfWork that uses raw Prisma (bypasses ZenStack policies)
export const RawUnitOfWorkProvider: Provider = {
  provide: RAW_UNIT_OF_WORK,
  scope: Scope.REQUEST,
  inject: [RAW_DB, EventBus],
  useFactory: (db: DbService, eventBus: EventBus) =>
    new UnitOfWork(db, eventBus),
};

// ---- (Optional) Helper factory to get a repo bound to the current UoW client inside a txn.
// You typically new-up repos inside `uow.withTransaction((tx) => new Repo(tx, { uow }))`,
// so a global Repo provider isn't strictly necessary. If you prefer DI, keep this pattern.
export const providers = [
  DBProvider,
  EnhancedDBProvider,
  UnitOfWorkProvider,
  RawUnitOfWorkProvider,
];
