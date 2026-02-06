import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Request DTO for creating a new organisation
 */
export class CreateOrganisationRequestDto {
  @ApiProperty({
    description: 'The name of the organisation',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Organisation name must be at least 2 characters' })
  @MaxLength(100, {
    message: 'Organisation name must not exceed 100 characters',
  })
  name!: string;

  @ApiPropertyOptional({
    description:
      'URL-friendly identifier. Auto-generated from name if not provided.',
    example: 'acme-corporation',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Slug must be at least 2 characters' })
  @MaxLength(100, { message: 'Slug must not exceed 100 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;
}
