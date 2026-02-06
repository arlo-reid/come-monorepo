import { createPaginationMeta } from 'libs/application/pagination.dto';
import type { PagedResult } from 'libs/application/repository-port.base';

import type { MembershipReadModel } from '../../../application/queries/membership-query/membership-query.service';
import type { Membership } from '../../../domain/entities/membership.entity';
import { MembershipResponseDto } from '../dtos/membership.response.dto';
import { MembershipsPagedResponseDto } from '../dtos/memberships-paged.response.dto';

/**
 * Maps Membership entities and read models to response DTOs
 */
export class MembershipResponseMapper {
  /**
   * Map a Membership entity to response DTO
   */
  static fromEntity(entity: Membership): MembershipResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      organisationId: entity.organisationId,
      role: entity.role,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Map a MembershipReadModel to response DTO
   */
  static fromReadModel(model: MembershipReadModel): MembershipResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      organisationId: model.organisationId,
      role: model.role,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }

  /**
   * Map a paged result of read models to paged response DTO
   */
  static toPagedDto(
    result: PagedResult<MembershipReadModel>,
    limit: number,
    offset: number,
  ): MembershipsPagedResponseDto {
    return {
      items: result.items.map((e) => this.fromReadModel(e)),
      pagination: createPaginationMeta(result.total, limit, offset),
    };
  }
}
