import { Module } from '@nestjs/common';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import {
  DbService,
  ENHANCED_DB,
  providers as dbProviders,
  RAW_DB,
} from 'libs/db/db.providers';

import { OrganisationCreatedEventHandler } from './application/event-handlers/organisation-created.event-handler';
import { OrganisationDeletedEventHandler } from './application/event-handlers/organisation-deleted.event-handler';
import { OrganisationRepositoryPort } from './application/ports/organisation-repository.port';
import { GetOrganisationBySlugHandler } from './application/queries/get-organisation-by-slug/get-organisation-by-slug.handler';
import { GetOrganisationsPagedHandler } from './application/queries/get-organisations-paged/get-organisations-paged.handler';
import { MembershipQueryService } from './application/queries/membership-query/membership-query.service';
import { AddMemberHandler } from './application/use-cases/add-member/add-member.handler';
import { CreateOrganisationHandler } from './application/use-cases/create-organisation/create-organisation.handler';
import { DeleteOrganisationHandler } from './application/use-cases/delete-organisation/delete-organisation.handler';
import { RemoveMemberHandler } from './application/use-cases/remove-member/remove-member.handler';
import { UpdateMemberRoleHandler } from './application/use-cases/update-member-role/update-member-role.handler';
import {
  ORGANISATION_REPOSITORY,
  RAW_ORGANISATION_REPOSITORY,
} from './di-tokens';
import { OrganisationWriteRepository } from './infrastructure/persistence/write-repositories/organisation.write-repository';
import { CreateOrganisationHttpController } from './interface/commands/create-organisation.command.http';
import { DeleteOrganisationHttpController } from './interface/commands/delete-organisation.command.http';
import { AddMemberHttpController } from './interface/memberships/commands/add-member.command.http';
import { RemoveMemberHttpController } from './interface/memberships/commands/remove-member.command.http';
import { UpdateMemberRoleHttpController } from './interface/memberships/commands/update-member-role.command.http';
import { GetMembershipHttpController } from './interface/memberships/queries/get-membership.query.http';
import { GetOrganisationMembershipsHttpController } from './interface/memberships/queries/get-organisation-memberships.query.http';
import { GetUserMembershipsHttpController } from './interface/memberships/queries/get-user-memberships.query.http';
import { GetOrganisationBySlugHttpController } from './interface/queries/get-organisation-by-slug.query.http';
import { GetOrganisationsPagedHttpController } from './interface/queries/get-organisations-paged.query.http';

const UseCaseHandlers = [
  CreateOrganisationHandler,
  DeleteOrganisationHandler,
  // Membership use cases
  AddMemberHandler,
  RemoveMemberHandler,
  UpdateMemberRoleHandler,
];

const QueryHandlers = [
  GetOrganisationBySlugHandler,
  GetOrganisationsPagedHandler,
];

const QueryServices = [MembershipQueryService];

const EventHandlers = [
  OrganisationCreatedEventHandler,
  OrganisationDeletedEventHandler,
];

/**
 * Organisations Module
 *
 * Bounded context module for organisation management.
 * Wires together all layers of the hexagonal architecture:
 * - Domain (aggregates, entities, events)
 * - Application (use-case handlers, query services, ports)
 * - Interface (HTTP controllers, DTOs, mappers)
 * - Infrastructure (repository implementations)
 *
 * Memberships are managed as entities within the Organisation aggregate.
 * The Organisation is responsible for adding, removing, and updating members.
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    // Organisation controllers
    CreateOrganisationHttpController,
    DeleteOrganisationHttpController,
    GetOrganisationBySlugHttpController,
    GetOrganisationsPagedHttpController,
    // Membership controllers
    AddMemberHttpController,
    RemoveMemberHttpController,
    UpdateMemberRoleHttpController,
    GetMembershipHttpController,
    GetOrganisationMembershipsHttpController,
    GetUserMembershipsHttpController,
  ],
  providers: [
    ...dbProviders,
    ...UseCaseHandlers,
    ...QueryHandlers,
    ...QueryServices,
    ...EventHandlers,
    {
      provide: ORGANISATION_REPOSITORY,
      useFactory: (
        db: DbService,
        eventBus: EventBus,
      ): OrganisationRepositoryPort =>
        new OrganisationWriteRepository(db, eventBus),
      inject: [ENHANCED_DB, EventBus],
    },
    {
      provide: RAW_ORGANISATION_REPOSITORY,
      useFactory: (
        db: DbService,
        eventBus: EventBus,
      ): OrganisationRepositoryPort =>
        new OrganisationWriteRepository(db, eventBus),
      inject: [RAW_DB, EventBus],
    },
  ],
  exports: [ORGANISATION_REPOSITORY],
})
export class OrganisationsModule {}
