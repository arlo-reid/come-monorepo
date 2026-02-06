import { CreateOrganisationCommand } from '../../application/use-cases/create-organisation/create-organisation.command';
import { CreateOrganisationRequestDto } from '../dtos/create-organisation.request.dto';

/**
 * Maps request DTOs to domain commands.
 * Reusable across different HTTP controllers, GraphQL resolvers, etc.
 */
export class OrganisationRequestMapper {
  static toCreateCommand(
    dto: CreateOrganisationRequestDto,
    ownerId: string,
  ): CreateOrganisationCommand {
    return new CreateOrganisationCommand({
      name: dto.name,
      slug: dto.slug,
      ownerId,
    });
  }
}
