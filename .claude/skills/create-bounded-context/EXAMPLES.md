# Bounded Context Code Examples

Complete code templates for creating bounded context modules.

## Table of Contents

1. [Domain Layer](#1-domain-layer)
2. [Application Layer](#2-application-layer)
3. [Infrastructure Layer](#3-infrastructure-layer)
4. [Interface Layer](#4-interface-layer)
5. [Module Wiring](#5-module-wiring)
6. [Full Module Example: Billing](#6-full-module-example-billing)
7. [Extension Examples](#7-extension-examples)

---

## 1. Domain Layer

### di-tokens.ts

```typescript
export const {ENTITY}_REPOSITORY = Symbol('{ENTITY}_REPOSITORY');
```

### domain/aggregates/{entity}.aggregate.ts

```typescript
import { BaseEntity } from '@libs/domain/base-entity';
import { {Entity}CreatedEvent } from '../events/{entity}-created.event';

export interface {Entity}Props {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class {Entity} extends BaseEntity {
  private constructor(private readonly props: {Entity}Props) {
    super();
  }

  /**
   * Factory for creating a new {Entity}
   */
  static create(params: {
    slug: string;
    name: string;
  }): {Entity} {
    const now = new Date();
    const entity = new {Entity}({
      id: '', // Set by repository on persist
      slug: params.slug,
      name: params.name,
      createdAt: now,
      updatedAt: now,
    });

    entity.addDomainEvent(
      new {Entity}CreatedEvent({
        slug: params.slug,
        name: params.name,
      })
    );

    return entity;
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: {Entity}Props): {Entity} {
    return new {Entity}(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get slug(): string { return this.props.slug; }
  get name(): string { return this.props.name; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  rename(newName: string): void {
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }
}
```

### domain/events/{entity}-created.event.ts

```typescript
import { IEvent } from '@nestjs/cqrs';

export class {Entity}CreatedEvent implements IEvent {
  constructor(
    public readonly payload: {
      slug: string;
      name: string;
    }
  ) {}
}
```

### domain/value-objects/{value}.value-object.ts (optional)

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();
    if (!this.isValid(normalized)) {
      throw new Error(`Invalid email: ${email}`);
    }
    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

---

## 2. Application Layer

### application/ports/{entity}-repository.port.ts

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';

import { {Entity} } from '../../domain/aggregates/{entity}.aggregate';

/**
 * {Entity} Repository Port
 *
 * Defines the contract for {entity} persistence operations.
 * Owned by the application layer, implemented by infrastructure.
 */
export interface {Entity}RepositoryPort {
  save({entity}: {Entity}): Promise<{Entity} | void>;
  findById(id: string): Promise<{Entity} | null>;
  findAll(): Promise<{Entity}[]>;
  /** Bind repo to transaction client; pass uow to queue events for post-commit publish */
  withTransaction(tx: unknown, uow?: UnitOfWork): {Entity}RepositoryPort;
}
```

### application/use-cases/create-{entity}/create-{entity}.command.ts

```typescript
export interface Create{Entity}CommandProps {
  name: string;
  slug?: string;
}

export class Create{Entity}Command {
  public readonly name: string;
  public readonly slug?: string;

  constructor(props: Create{Entity}CommandProps) {
    this.name = props.name;
    this.slug = props.slug;
  }
}
```

### application/use-cases/create-{entity}/create-{entity}.handler.ts

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

import { {ENTITY}_REPOSITORY } from '../../../di-tokens';
import { {Entity} } from '../../../domain/aggregates/{entity}.aggregate';
import { type {Entity}RepositoryPort } from '../../ports/{entity}-repository.port';
import { Create{Entity}Command } from './create-{entity}.command';

@Injectable()
export class Create{Entity}Handler {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}RepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  private generateSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  async execute(command: Create{Entity}Command): Promise<{Entity}> {
    const result = await this.unitOfWork.withTransaction(async (tx) => {
      // Pass unitOfWork to withTransaction so events queue for post-commit publish
      const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);

      // Generate unique slug
      let slug: string;
      if (command.slug) {
        // Use provided slug, check uniqueness
        if (await repoWithTx.existsBySlug(command.slug)) {
          throw new ConflictException(
            `{Entity} with slug "${command.slug}" already exists`,
          );
        }
        slug = command.slug;
      } else {
        // Generate slug with uniqueness suffix
        const baseSlug = this.generateSlug(command.name);
        slug = baseSlug;
        while (await repoWithTx.existsBySlug(slug)) {
          slug = `${baseSlug}-${nanoid(5)}`;
        }
      }

      const entity = {Entity}.create({
        name: command.name,
        slug,
      });

      await repoWithTx.save(entity);
      return entity;
    });

    return result;
  }
}
```

### application/use-cases/get-{entity}/get-{entity}.query.ts

```typescript
export interface Get{Entity}QueryProps {
  slug: string;
}

export class Get{Entity}Query {
  public readonly slug: string;

  constructor(props: Get{Entity}QueryProps) {
    this.slug = props.slug;
  }
}
```

### application/use-cases/get-{entity}/get-{entity}.handler.ts

```typescript
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { {ENTITY}_REPOSITORY } from '../../../di-tokens';
import { {Entity}RepositoryPort } from '../../ports/{entity}-repository.port';
import { Get{Entity}Query } from './get-{entity}.query';

@Injectable()
export class Get{Entity}Handler {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}RepositoryPort
  ) {}

  async execute(query: Get{Entity}Query) {
    const entity = await this.repository.findBySlug(query.slug);

    if (!entity) {
      throw new NotFoundException(`{Entity} with slug "${query.slug}" not found`);
    }

    return entity;
  }
}
```

### application/event-handlers/{entity}-created.event-handler.ts

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { {Entity}CreatedEvent } from '../../domain/events/{entity}-created.event';

@EventsHandler({Entity}CreatedEvent)
export class {Entity}CreatedEventHandler implements IEventHandler<{Entity}CreatedEvent> {
  private readonly logger = new Logger({Entity}CreatedEventHandler.name);

  handle(event: {Entity}CreatedEvent): void {
    this.logger.log(`{Entity} created: ${event.payload.slug}`);
  }
}
```

---

## 3. Infrastructure Layer

### infrastructure/persistence/{entity}.mapper.ts

```typescript
import { {Entity} } from '../../domain/aggregates/{entity}.aggregate';
import type { {Entity} as Prisma{Entity} } from '@prisma/client';

export class {Entity}PersistenceMapper {
  static toDomain(row: Prisma{Entity}): {Entity} {
    return {Entity}.fromPersistence({
      id: row.id,
      slug: row.slug,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(entity: {Entity}): Omit<Prisma{Entity}, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      slug: entity.slug,
      name: entity.name,
    };
  }
}
```

### infrastructure/persistence/write-repositories/{entity}.write-repository.ts

```typescript
import { DbService, ENHANCED_DB } from '@libs/db/db.providers';
import { ZenStackRepositoryBase } from '@libs/db/repository-base';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { {Entity}RepositoryPort } from '../../../application/ports/{entity}-repository.port';
import { {Entity} } from '../../../domain/aggregates/{entity}.aggregate';

/** Typed delegate for {Entity} model operations */
type {Entity}Delegate = DbService['{entity}'];

/**
 * ZenStack {Entity} Repository
 *
 * Infrastructure adapter implementing the {Entity}RepositoryPort.
 * Uses ZenStack v3 ORM for database operations with domain event support.
 */
@Injectable()
export class {Entity}WriteRepository
  extends ZenStackRepositoryBase<
    DbService,
    {Entity},
    string,
    {Entity}Delegate
  >
  implements {Entity}RepositoryPort
{
  constructor(
    @Inject(ENHANCED_DB) db: DbService,
    @Optional() eventBus?: EventBus,
  ) {
    super(db, eventBus);
  }

  protected getDelegate(client: DbService): {Entity}Delegate {
    return client.{entity};
  }

  protected toDomain(row: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }): {Entity} {
    return {Entity}.fromPersistence({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  protected toPersistence(entity: {Entity}) {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findBySlug(slug: string): Promise<{Entity} | null> {
    const row = await this.delegate.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.delegate.count({ where: { slug } });
    return count > 0;
  }

  async findAll(): Promise<{Entity}[]> {
    return await this.findMany();
  }
}
```

---

## 4. Interface Layer

### interface/dtos/create-{entity}.request.dto.ts

```typescript
import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class Create{Entity}RequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;
}
```

### interface/dtos/{entity}.response.dto.ts

```typescript
export class {Entity}ResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}
```

### interface/dtos/{entity}-list.response.dto.ts

```typescript
import { {Entity}ResponseDto } from './{entity}.response.dto';

export class {Entity}ListResponseDto {
  items!: {Entity}ResponseDto[];
  total!: number;
}
```

### interface/mappers/{entity}.request.mapper.ts

```typescript
import { Create{Entity}Command } from '../../application/use-cases/create-{entity}/create-{entity}.command';
import { Create{Entity}RequestDto } from '../dtos/create-{entity}.request.dto';

export class {Entity}RequestMapper {
  static toCreateCommand(dto: Create{Entity}RequestDto): Create{Entity}Command {
    return new Create{Entity}Command({
      name: dto.name,
      slug: dto.slug,
    });
  }
}
```

### interface/mappers/{entity}.response.mapper.ts

```typescript
import { {Entity} } from '../../domain/aggregates/{entity}.aggregate';
import { {Entity}ResponseDto } from '../dtos/{entity}.response.dto';
import { {Entity}ListResponseDto } from '../dtos/{entity}-list.response.dto';

export class {Entity}ResponseMapper {
  static toDto(entity: {Entity}): {Entity}ResponseDto {
    return {
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toListDto(entities: {Entity}[]): {Entity}ListResponseDto {
    return {
      items: entities.map(e => this.toDto(e)),
      total: entities.length,
    };
  }

  static toCreateResponse(result: { slug: string }): { slug: string } {
    return { slug: result.slug };
  }
}
```

### interface/commands/create-{entity}.command.http.ts

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Create{Entity}Handler } from '../../application/use-cases/create-{entity}/create-{entity}.handler';
import { Create{Entity}RequestDto } from '../dtos/create-{entity}.request.dto';
import { {Entity}RequestMapper } from '../mappers/{entity}.request.mapper';
import { {Entity}ResponseMapper } from '../mappers/{entity}.response.mapper';

@Controller('{context-plural}')
export class Create{Entity}HttpController {
  constructor(private readonly handler: Create{Entity}Handler) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(@Body() dto: Create{Entity}RequestDto) {
    const command = {Entity}RequestMapper.toCreateCommand(dto);
    const result = await this.handler.execute(command);
    return {Entity}ResponseMapper.toCreateResponse(result);
  }
}
```

### interface/queries/get-{entity}.query.http.ts

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Get{Entity}Handler } from '../../application/use-cases/get-{entity}/get-{entity}.handler';
import { Get{Entity}Query } from '../../application/use-cases/get-{entity}/get-{entity}.query';
import { {Entity}ResponseMapper } from '../mappers/{entity}.response.mapper';
import { {Entity}ResponseDto } from '../dtos/{entity}.response.dto';

@Controller('{context-plural}')
export class Get{Entity}HttpController {
  constructor(private readonly handler: Get{Entity}Handler) {}

  @Get(':slug')
  async handle(@Param('slug') slug: string): Promise<{Entity}ResponseDto> {
    const query = new Get{Entity}Query({ slug });
    const entity = await this.handler.execute(query);
    return {Entity}ResponseMapper.toDto(entity);
  }
}
```

---

## 5. Module Wiring

### {context-name}.module.ts

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import {
  DbService,
  ENHANCED_DB,
  providers as dbProviders,
} from 'src/libs/db/db.providers';

import { {Entity}CreatedEventHandler } from './application/event-handlers/{entity}-created.event-handler';
import { {Entity}RepositoryPort } from './application/ports/{entity}-repository.port';
import { Create{Entity}Handler } from './application/use-cases/create-{entity}/create-{entity}.handler';
import { Get{Entity}Handler } from './application/use-cases/get-{entity}/get-{entity}.handler';
import { {ENTITY}_REPOSITORY } from './di-tokens';
import { {Entity}WriteRepository } from './infrastructure/persistence/write-repositories/{entity}.write-repository';
import { Create{Entity}HttpController } from './interface/commands/create-{entity}.command.http';
import { Get{Entity}HttpController } from './interface/queries/get-{entity}.query.http';

const UseCaseHandlers = [Create{Entity}Handler, Get{Entity}Handler];

const EventHandlers = [{Entity}CreatedEventHandler];

/**
 * {Context} Module
 *
 * Bounded context module for {entity} management.
 * Wires together all layers of the hexagonal architecture:
 * - Domain (aggregates, events)
 * - Application (use-case handlers, ports)
 * - Interface (HTTP controllers, DTOs, mappers)
 * - Infrastructure (repository implementations)
 */
@Module({
  imports: [CqrsModule],
  controllers: [Create{Entity}HttpController, Get{Entity}HttpController],
  providers: [
    ...dbProviders,
    ...UseCaseHandlers,
    ...EventHandlers,
    {
      provide: {ENTITY}_REPOSITORY,
      useFactory: (
        db: DbService,
        eventBus: EventBus,
      ): {Entity}RepositoryPort =>
        new {Entity}WriteRepository(db, eventBus),
      inject: [ENHANCED_DB, EventBus],
    },
  ],
  exports: [{ENTITY}_REPOSITORY],
})
export class {Context}Module {}
```

---

## 6. Full Module Example: Billing

A complete example with external service integration.

### Structure

```
modules/billing/
├── application/
│   ├── use-cases/
│   │   ├── create-subscription/
│   │   │   ├── create-subscription.command.ts
│   │   │   └── create-subscription.handler.ts
│   │   └── cancel-subscription/
│   ├── event-handlers/
│   │   └── subscription-created.event-handler.ts
│   └── ports/
│       ├── subscription-repository.port.ts
│       └── payment-gateway.port.ts
├── domain/
│   ├── aggregates/
│   │   └── subscription.aggregate.ts
│   ├── value-objects/
│   │   └── money.value-object.ts
│   └── events/
│       └── subscription-created.event.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── write-repositories/
│   │   │   └── subscription.write-repository.ts
│   │   └── subscription.mapper.ts
│   └── external-services/
│       └── stripe-payment-gateway.adapter.ts
├── interface/
│   ├── commands/
│   │   └── create-subscription.command.http.ts
│   ├── webhooks/
│   │   └── stripe-webhook.http.ts
│   ├── mappers/
│   │   ├── subscription.request.mapper.ts
│   │   └── subscription.response.mapper.ts
│   └── dtos/
├── di-tokens.ts
└── billing.module.ts
```

### application/ports/payment-gateway.port.ts

```typescript
export interface PaymentGatewayPort {
  createCustomer(email: string): Promise<string>;
  createSubscription(customerId: string, priceId: string): Promise<{
    subscriptionId: string;
    status: string;
  }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
```

### infrastructure/external-services/stripe-payment-gateway.adapter.ts

```typescript
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentGatewayPort } from '../../application/ports/payment-gateway.port';

@Injectable()
export class StripePaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createCustomer(email: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email });
    return customer.id;
  }

  async createSubscription(customerId: string, priceId: string) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      return true;
    } catch {
      return false;
    }
  }
}
```

### billing.module.ts

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SUBSCRIPTION_REPOSITORY, PAYMENT_GATEWAY } from './di-tokens';

import { CreateSubscriptionHandler } from './application/use-cases/create-subscription/create-subscription.handler';
import { SubscriptionCreatedEventHandler } from './application/event-handlers/subscription-created.event-handler';

import { CreateSubscriptionHttpController } from './interface/commands/create-subscription.command.http';
import { StripeWebhookController } from './interface/webhooks/stripe-webhook.http';

import { SubscriptionWriteRepository } from './infrastructure/persistence/write-repositories/subscription.write-repository';
import { StripePaymentGatewayAdapter } from './infrastructure/external-services/stripe-payment-gateway.adapter';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateSubscriptionHttpController,
    StripeWebhookController,
  ],
  providers: [
    CreateSubscriptionHandler,
    SubscriptionCreatedEventHandler,
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionWriteRepository,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: StripePaymentGatewayAdapter,
    },
  ],
  exports: [SUBSCRIPTION_REPOSITORY],
})
export class BillingModule {}
```

---

## 7. Extension Examples

Examples for extending an existing bounded context.

### 7.1 Adding an Update Use Case

Extending the organisations context with an update capability.

#### application/use-cases/update-{entity}/update-{entity}.command.ts

```typescript
export interface Update{Entity}CommandProps {
  slug: string;  // identifier
  name?: string;
  // other updatable fields
}

export class Update{Entity}Command {
  public readonly slug: string;
  public readonly name?: string;

  constructor(props: Update{Entity}CommandProps) {
    this.slug = props.slug;
    this.name = props.name;
  }
}
```

#### application/use-cases/update-{entity}/update-{entity}.handler.ts

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { {ENTITY}_REPOSITORY } from '../../../di-tokens';
import { type {Entity}RepositoryPort } from '../../ports/{entity}-repository.port';
import { Update{Entity}Command } from './update-{entity}.command';

@Injectable()
export class Update{Entity}Handler {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}RepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: Update{Entity}Command): Promise<void> {
    await this.unitOfWork.withTransaction(async (tx) => {
      const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);

      const entity = await repoWithTx.findBySlug(command.slug);
      if (!entity) {
        throw new NotFoundException(`{Entity} with slug "${command.slug}" not found`);
      }

      // Apply updates via aggregate methods
      if (command.name) {
        entity.rename(command.name);
      }

      await repoWithTx.save(entity);
    });
  }
}
```

#### interface/commands/update-{entity}.command.http.ts

```typescript
import { Controller, Patch, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Update{Entity}Handler } from '../../application/use-cases/update-{entity}/update-{entity}.handler';
import { Update{Entity}RequestDto } from '../dtos/update-{entity}.request.dto';
import { Update{Entity}Command } from '../../application/use-cases/update-{entity}/update-{entity}.command';

@Controller('{context-plural}')
export class Update{Entity}HttpController {
  constructor(private readonly handler: Update{Entity}Handler) {}

  @Patch(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @Param('slug') slug: string,
    @Body() dto: Update{Entity}RequestDto,
  ): Promise<void> {
    const command = new Update{Entity}Command({
      slug,
      name: dto.name,
    });
    await this.handler.execute(command);
  }
}
```

#### interface/dtos/update-{entity}.request.dto.ts

```typescript
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class Update{Entity}RequestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}
```

### 7.2 Adding a Delete Use Case

Soft delete pattern for removing entities.

#### domain/events/{entity}-deleted.event.ts

```typescript
import { IEvent } from '@nestjs/cqrs';

export class {Entity}DeletedEvent implements IEvent {
  constructor(
    public readonly payload: {
      id: string;
      slug: string;
      deletedAt: Date;
    }
  ) {}
}
```

#### application/use-cases/delete-{entity}/delete-{entity}.command.ts

```typescript
export interface Delete{Entity}CommandProps {
  slug: string;
}

export class Delete{Entity}Command {
  public readonly slug: string;

  constructor(props: Delete{Entity}CommandProps) {
    this.slug = props.slug;
  }
}
```

#### application/use-cases/delete-{entity}/delete-{entity}.handler.ts

```typescript
import { UnitOfWork } from '@libs/db/unit-of-work';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { {ENTITY}_REPOSITORY } from '../../../di-tokens';
import { type {Entity}RepositoryPort } from '../../ports/{entity}-repository.port';
import { Delete{Entity}Command } from './delete-{entity}.command';

@Injectable()
export class Delete{Entity}Handler {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}RepositoryPort,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: Delete{Entity}Command): Promise<void> {
    await this.unitOfWork.withTransaction(async (tx) => {
      const repoWithTx = this.repository.withTransaction(tx, this.unitOfWork);

      const entity = await repoWithTx.findBySlug(command.slug);
      if (!entity) {
        throw new NotFoundException(`{Entity} with slug "${command.slug}" not found`);
      }

      // For soft delete, call aggregate method
      entity.delete();

      await repoWithTx.save(entity);
    });
  }
}
```

#### interface/commands/delete-{entity}.command.http.ts

```typescript
import { Controller, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Delete{Entity}Handler } from '../../application/use-cases/delete-{entity}/delete-{entity}.handler';
import { Delete{Entity}Command } from '../../application/use-cases/delete-{entity}/delete-{entity}.command';

@Controller('{context-plural}')
export class Delete{Entity}HttpController {
  constructor(private readonly handler: Delete{Entity}Handler) {}

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@Param('slug') slug: string): Promise<void> {
    const command = new Delete{Entity}Command({ slug });
    await this.handler.execute(command);
  }
}
```

### 7.3 Adding a List Query

Paginated list with filtering.

#### application/use-cases/list-{entities}/list-{entities}.query.ts

```typescript
export interface List{Entities}QueryProps {
  page?: number;
  limit?: number;
  search?: string;
}

export class List{Entities}Query {
  public readonly page: number;
  public readonly limit: number;
  public readonly search?: string;

  constructor(props: List{Entities}QueryProps = {}) {
    this.page = props.page ?? 1;
    this.limit = Math.min(props.limit ?? 20, 100);
    this.search = props.search;
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
```

#### application/use-cases/list-{entities}/list-{entities}.handler.ts

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { {ENTITY}_REPOSITORY } from '../../../di-tokens';
import { {Entity}RepositoryPort } from '../../ports/{entity}-repository.port';
import { List{Entities}Query } from './list-{entities}.query';

export interface List{Entities}Result {
  items: {Entity}[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class List{Entities}Handler {
  constructor(
    @Inject({ENTITY}_REPOSITORY)
    private readonly repository: {Entity}RepositoryPort
  ) {}

  async execute(query: List{Entities}Query): Promise<List{Entities}Result> {
    const [items, total] = await this.repository.findPaginated({
      offset: query.offset,
      limit: query.limit,
      search: query.search,
    });

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
```

#### interface/queries/list-{entities}.query.http.ts

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { List{Entities}Handler } from '../../application/use-cases/list-{entities}/list-{entities}.handler';
import { List{Entities}Query } from '../../application/use-cases/list-{entities}/list-{entities}.query';
import { {Entity}ResponseMapper } from '../mappers/{entity}.response.mapper';

@Controller('{context-plural}')
export class List{Entities}HttpController {
  constructor(private readonly handler: List{Entities}Handler) {}

  @Get()
  async handle(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const query = new List{Entities}Query({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });

    const result = await this.handler.execute(query);

    return {
      items: result.items.map(e => {Entity}ResponseMapper.toDto(e)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
```

### 7.4 Module Update After Extension

After adding new use cases, update the module registration.

```typescript
// {context-name}.module.ts - updated with new handlers and controllers

import { Update{Entity}Handler } from './application/use-cases/update-{entity}/update-{entity}.handler';
import { Delete{Entity}Handler } from './application/use-cases/delete-{entity}/delete-{entity}.handler';
import { List{Entities}Handler } from './application/use-cases/list-{entities}/list-{entities}.handler';
import { Update{Entity}HttpController } from './interface/commands/update-{entity}.command.http';
import { Delete{Entity}HttpController } from './interface/commands/delete-{entity}.command.http';
import { List{Entities}HttpController } from './interface/queries/list-{entities}.query.http';

const UseCaseHandlers = [
  Create{Entity}Handler,
  Get{Entity}Handler,
  Update{Entity}Handler,  // NEW
  Delete{Entity}Handler,  // NEW
  List{Entities}Handler,  // NEW
];

@Module({
  imports: [CqrsModule],
  controllers: [
    Create{Entity}HttpController,
    Get{Entity}HttpController,
    Update{Entity}HttpController,  // NEW
    Delete{Entity}HttpController,  // NEW
    List{Entities}HttpController,  // NEW
  ],
  // ... rest unchanged
})
export class {Context}Module {}
```
