import { EnvironmentVariables } from '@repo/nestjs-config/base';
import { IsOptional, IsString } from 'class-validator';

/**
 * Application-specific configuration
 *
 * Extends EnvironmentVariables with app-specific settings.
 * Secrets from Google Secret Manager (like DATABASE_URL, JWT_SECRET, API_KEY)
 * will be automatically loaded and merged when SKIP_SECRETS is not true.
 */
export class AppConfig extends EnvironmentVariables {
  /**
   * Database URL (loaded from Secret Manager when SKIP_SECRETS is false)
   */
  @IsString()
  DATABASE_URL?: string;

  /**
   * Firebase project ID
   */
  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID?: string;

  /**
   * Base64-encoded Firebase service account key
   * (loaded from Secret Manager when SKIP_SECRETS is false)
   */
  @IsString()
  @IsOptional()
  FIREBASE_SA_KEY?: string;

  /**
   * Base64-encoded Firebase client SDK config JSON
   * (contains apiKey, authDomain, projectId, etc.)
   */
  @IsString()
  @IsOptional()
  FIREBASE_PUBLIC_KEY?: string;

  /**
   * Admin user email for seeding
   * Used by seed-admin use case to create initial admin user
   */
  @IsString()
  @IsOptional()
  ADMIN_EMAIL?: string;

  /**
   * Admin user password for seeding
   * Used by seed-admin use case to create initial admin user
   */
  @IsString()
  @IsOptional()
  ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  MAILERSEND_API_KEY?: string;
}
