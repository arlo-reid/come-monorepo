import {
  PagedResponseDto,
  PaginationMeta,
} from 'libs/application/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

import { MembershipResponseDto } from './membership.response.dto';

/**
 * Paged response DTO for memberships list
 */
export class MembershipsPagedResponseDto extends PagedResponseDto<MembershipResponseDto> {
  @ApiProperty({ type: () => PaginationMeta })
  declare pagination: PaginationMeta;

  @ApiProperty({ type: [MembershipResponseDto] })
  declare items: MembershipResponseDto[];
}
