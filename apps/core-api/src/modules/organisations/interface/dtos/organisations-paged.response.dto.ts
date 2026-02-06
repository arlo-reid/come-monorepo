import {
  PagedResponseDto,
  PaginationMeta,
} from 'libs/application/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

import { OrganisationResponseDto } from './organisation.response.dto';

/**
 * Paged response DTO for organisations list
 */
export class OrganisationsPagedResponseDto extends PagedResponseDto<OrganisationResponseDto> {
  @ApiProperty({ type: () => PaginationMeta })
  declare pagination: PaginationMeta;

  @ApiProperty({ type: [OrganisationResponseDto] })
  declare items: OrganisationResponseDto[];
}
