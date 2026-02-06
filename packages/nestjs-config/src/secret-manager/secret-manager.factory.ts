import { ConfigService as NestConfigService } from '@nestjs/config';
import { ISecretManager } from './secret-manager.interface';
import { GoogleSecretManagerService } from './google-secret-manager.service';

/**
 * Factory for creating secret manager instances
 *
 * Supports:
 * - google: Google Secret Manager
 *
 * Future: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.
 */
export class SecretManagerFactory {
  static create(
    type: string,
    configService: NestConfigService,
  ): ISecretManager {
    switch (type.toLowerCase()) {
      case 'google':
        return new GoogleSecretManagerService(configService);
      default:
        throw new Error(`Unsupported secret manager type: ${type}`);
    }
  }
}
