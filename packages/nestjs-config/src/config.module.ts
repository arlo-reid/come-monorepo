import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService as NestConfigService,
} from '@nestjs/config';
import { ConfigService } from './config.service';
import { EnvironmentVariables } from './environment-variables.base';
import {
  ConfigModuleOptions,
  ValidationClass,
} from './types/config-options.interface';

/**
 * Configuration module with Google Secret Manager integration
 *
 * @example
 * ```typescript
 * // Define your config class
 * class AppConfig extends EnvironmentVariables {
 *   @IsNumber() PORT: number = 8000;
 *   @IsString() DATABASE_URL?: string;
 * }
 *
 * // Register in AppModule
 * @Module({
 *   imports: [ConfigModule.forRoot(AppConfig)],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ConfigModule {
  /**
   * Register the configuration module with a validation class
   *
   * @param validationClass - Class extending EnvironmentVariables with validation decorators
   * @param options - Optional configuration options
   * @returns Dynamic module
   */
  static forRoot<T extends EnvironmentVariables>(
    validationClass: ValidationClass<T>,
    options: ConfigModuleOptions = {},
  ): DynamicModule {
    const {
      envFilePath = '.env',
      ignoreEnvFile = false,
      isGlobal = true,
      skipSecrets = process.env.SKIP_SECRETS === 'true',
      secretManager = 'google',
    } = options;

    const providers: Provider[] = [
      {
        provide: 'VALIDATION_CLASS',
        useValue: validationClass,
      },
      {
        provide: 'CONFIG_OPTIONS',
        useValue: { skipSecrets, secretManager },
      },
      // Use async factory to initialize ConfigService with secrets loaded
      {
        provide: ConfigService,
        useFactory: async (
          nestConfigService: NestConfigService,
          validationCls: ValidationClass<T>,
          opts: { skipSecrets: boolean; secretManager: string },
        ) => {
          const service = new ConfigService<T>(nestConfigService, validationCls, opts);
          await service.initialize();
          return service;
        },
        inject: [NestConfigService, 'VALIDATION_CLASS', 'CONFIG_OPTIONS'],
      },
    ];

    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          envFilePath,
          ignoreEnvFile,
          isGlobal,
          expandVariables: true,
        }),
      ],
      providers,
      exports: [ConfigService],
      global: isGlobal,
    };
  }
}
