import { Organisation } from '../../domain/aggregates/organisation.aggregate';
import { OrganisationResponseDto } from '../dtos/organisation.response.dto';

/**
 * Maps domain entities to response DTOs.
 * Reusable across different HTTP controllers, GraphQL resolvers, etc.
 */
export class OrganisationResponseMapper {
  static toDto(entity: Organisation): OrganisationResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      ownerId: entity.ownerId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static toListDto(entities: Organisation[]): OrganisationResponseDto[] {
    return entities.map((e) => this.toDto(e));
  }
}
