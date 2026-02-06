import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { EnvironmentVariables } from "./environment-variables.base";
import { ISecretManager } from "./secret-manager/secret-manager.interface";
import { SecretManagerFactory } from "./secret-manager/secret-manager.factory";
import { ValidationClass } from "./types/config-options.interface";

/**
 * Generic configuration service with secret manager integration
 *
 * @template T - Configuration class extending EnvironmentVariables
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class AppService {
 *   constructor(private readonly config: ConfigService<AppConfig>) {}
 *
 *   getPort(): number {
 *     return this.config.config.PORT;
 *   }
 * }
 * ```
 */
@Injectable()
export class ConfigService<T extends EnvironmentVariables> {
  private readonly logger = new Logger(ConfigService.name);
  private secretsCache: Map<string, string> = new Map();
  private secretManager?: ISecretManager;
  private initialized = false;
  private _config!: T;

  constructor(
    private readonly nestConfigService: NestConfigService,
    @Inject("VALIDATION_CLASS")
    private readonly validationClass: ValidationClass<T>,
    @Inject("CONFIG_OPTIONS")
    private readonly options: {
      skipSecrets: boolean;
      secretManager: string;
    }
  ) {}

  /**
   * Initialize the configuration service.
   * Loads environment variables, fetches secrets, and validates configuration.
   * Called by the module factory during provider resolution.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.log("Starting configuration initialization...");

      // Step 1: Load environment variables (without validation)
      this.loadEnvVars();

      // Step 2: Check if we should skip secrets (read from loaded config)
      const skipSecrets = this.options.skipSecrets || this._config.SKIP_SECRETS;

      // Step 3: Load secrets if not skipped
      if (skipSecrets) {
        this.logger.log("SKIP_SECRETS is enabled - skipping secret loading");
      } else {
        // Initialize secret manager and load secrets
        this.secretManager = SecretManagerFactory.create(
          this.options.secretManager,
          this.nestConfigService
        );
        await this.loadSecrets();
      }

      // Step 4: Validate configuration AFTER secrets are loaded
      await this.validateConfig();

      this.initialized = true;
      this.logger.log("Configuration initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize configuration", error);
      // Fail fast - exit application if configuration can't be loaded
      throw new Error(
        `Configuration initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Load environment variables from .env and process.env (without validation)
   */
  private loadEnvVars(): void {
    // Get all environment variables
    const envVars = {
      ...process.env,
    };

    // Transform to class instance (without validation yet)
    this._config = plainToInstance(this.validationClass, envVars);
    this.logger.log("Environment variables loaded");
  }

  /**
   * Validate the configuration after all sources (env vars + secrets) are loaded
   */
  private async validateConfig(): Promise<void> {
    const errors = await validate(this._config, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => {
          const constraints = error.constraints
            ? Object.values(error.constraints).join(", ")
            : "Unknown validation error";
          return `${error.property}: ${constraints}`;
        })
        .join("; ");

      throw new Error(`Configuration validation failed: ${errorMessages}`);
    }

    this.logger.log("Configuration validated successfully");
  }

  /**
   * Load all secrets from secret manager and merge with env vars
   */
  private async loadSecrets(): Promise<void> {
    if (!this.secretManager) {
      return;
    }

    this.logger.log("Loading secrets from secret manager");

    // Fetch all secrets
    const secrets = await this.secretManager.listAndGetAllSecrets();

    if (secrets.size === 0) {
      this.logger.warn("No secrets loaded from secret manager");
      return;
    }

    // Store secrets in cache
    this.secretsCache = secrets;

    // Merge secrets into config (secrets override env vars)
    const mergedConfig = {
      ...this._config,
    };

    secrets.forEach((value, key) => {
      (mergedConfig as any)[key] = value;
    });

    // Transform merged config to class instance (validation happens later)
    this._config = plainToInstance(this.validationClass, mergedConfig);
    this.logger.log(
      `Loaded ${secrets.size} secrets and merged with environment variables`
    );
  }

  /**
   * Get the fully typed configuration object
   */
  get config(): T {
    if (!this.initialized) {
      throw new Error(
        "ConfigService not initialized. Ensure module initialization is complete."
      );
    }
    return this._config;
  }

  /**
   * Check if a secret is loaded from the secret manager
   */
  hasSecret(key: string): boolean {
    return this.secretsCache.has(key);
  }
}
