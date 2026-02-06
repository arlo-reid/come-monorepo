import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

/**
 * Base environment variables class for NestJS applications
 *
 * Applications should extend this class to add their own environment variables
 * and secrets. Use class-validator decorators for validation.
 *
 * @example
 * ```typescript
 * export class AppConfig extends EnvironmentVariables {
 *   @IsNumber()
 *   @Type(() => Number)
 *   PORT: number = 8000;
 *
 *   @IsString()
 *   DATABASE_URL?: string;  // From Google Secret Manager
 * }
 * ```
 */
export class EnvironmentVariables {
  @IsNumber()
  @Type(() => Number)
  PORT: number = 8000;

  @IsEnum(["development", "production", "test"])
  NODE_ENV: string = "development";

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  SKIP_SECRETS?: boolean;

  @IsString()
  @IsOptional()
  GOOGLE_CLOUD_PROJECT?: string;

  @IsString()
  @IsOptional()
  GOOGLE_APPLICATION_CREDENTIALS?: string;
}
