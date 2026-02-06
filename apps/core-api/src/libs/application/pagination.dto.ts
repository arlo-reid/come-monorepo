import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Base request DTO for paginated queries.
 *
 * Uses limit/offset pagination which is simple and works well for most use cases.
 * For cursor-based pagination on large datasets, extend this or create a separate DTO.
 */
export class PagedRequestDto {
  @ApiPropertyOptional({
    description: 'Number of items to return per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip (for offset-based pagination)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

/**
 * Pagination metadata included in paged responses.
 */
export class PaginationMeta {
  @ApiProperty({
    description: 'Total number of items across all pages',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Number of items returned in this page',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: 'Number of items skipped',
    example: 0,
  })
  offset!: number;

  @ApiProperty({
    description: 'Whether there are more items after this page',
    example: true,
  })
  hasMore!: boolean;
}

/**
 * Generic paged response structure.
 * Extend this class for specific entity types.
 *
 * @example
 * class OrganisationsPagedResponseDto extends PagedResponseDto<OrganisationResponseDto> {
 *   @ApiProperty({ type: [OrganisationResponseDto] })
 *   items!: OrganisationResponseDto[];
 * }
 */
export class PagedResponseDto<T> {
  @ApiProperty({ type: () => PaginationMeta })
  pagination!: PaginationMeta;

  // Note: Subclasses must redeclare items with @ApiProperty for Swagger
  items!: T[];
}

/**
 * Helper to create pagination metadata from query results.
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number,
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}
