import { EnvironmentVariables } from '../environment-variables.base';

/**
 * Options for ConfigModule.forRoot()
 */
export interface ConfigModuleOptions {
  /**
   * Path to .env file (default: '.env')
   */
  envFilePath?: string | string[];

  /**
   * Skip loading .env file (default: false)
   */
  ignoreEnvFile?: boolean;

  /**
   * Make module global (default: true)
   */
  isGlobal?: boolean;

  /**
   * Skip loading secrets from secret manager (default: false, overridden by SKIP_SECRETS env var)
   */
  skipSecrets?: boolean;

  /**
   * Secret manager type (default: 'google')
   */
  secretManager?: 'google' | string;
}

/**
 * Type for validation class constructor
 */
export type ValidationClass<T extends EnvironmentVariables> = new () => T;
