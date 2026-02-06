import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ISecretManager } from './secret-manager.interface';

/**
 * Google Secret Manager implementation
 *
 * Requires:
 * - GOOGLE_CLOUD_PROJECT env var
 * - GOOGLE_APPLICATION_CREDENTIALS env var (optional - uses ADC on Cloud Run)
 */
export class GoogleSecretManagerService implements ISecretManager {
  private readonly logger = new Logger(GoogleSecretManagerService.name);
  private readonly client: SecretManagerServiceClient;
  private readonly projectId: string;

  constructor(private readonly configService: NestConfigService) {
    const credentialsPath = configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const projectId = configService.get<string>('GOOGLE_CLOUD_PROJECT');

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    this.projectId = projectId;

    // Initialize Secret Manager client - uses Application Default Credentials (ADC)
    // on Cloud Run, or explicit keyFilename for local development
    this.client = credentialsPath
      ? new SecretManagerServiceClient({ keyFilename: credentialsPath })
      : new SecretManagerServiceClient();

    this.logger.log(
      `Initialized Google Secret Manager for project: ${projectId} (using ${credentialsPath ? 'key file' : 'ADC'})`,
    );
  }

  async getSecret(name: string): Promise<string> {
    try {
      const secretPath = `projects/${this.projectId}/secrets/${name}/versions/latest`;

      this.logger.debug(`Accessing secret: ${secretPath}`);

      const [version] = await this.client.accessSecretVersion({
        name: secretPath,
      });

      const payload = version.payload?.data?.toString();

      if (!payload) {
        throw new Error(`Secret "${name}" has no payload`);
      }

      return payload;
    } catch (error) {
      this.logger.error(`Failed to fetch secret "${name}"`, error);
      throw new Error(
        `Failed to fetch secret "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async listAndGetAllSecrets(): Promise<Map<string, string>> {
    try {
      const secrets = new Map<string, string>();
      const parent = `projects/${this.projectId}`;

      this.logger.log(`Listing all secrets in project: ${this.projectId}`);

      // List all secrets in the project
      const [secretsList] = await this.client.listSecrets({
        parent,
      });

      if (!secretsList || secretsList.length === 0) {
        this.logger.warn('No secrets found in project');
        return secrets;
      }

      this.logger.log(`Found ${secretsList.length} secrets, fetching values...`);

      // Fetch all secrets in parallel
      await Promise.all(
        secretsList.map(async (secret) => {
          if (!secret.name) {
            return;
          }

          // Extract secret name from full path
          // Format: projects/{project}/secrets/{name}
          const secretName = secret.name.split('/').pop();

          if (!secretName) {
            return;
          }

          try {
            const value = await this.getSecret(secretName);
            secrets.set(secretName, value);
            this.logger.log(`Loaded secret: ${secretName}`);
          } catch (error) {
            // Re-throw to fail fast
            throw error;
          }
        }),
      );

      this.logger.log(
        `Successfully loaded ${secrets.size} secrets from Secret Manager`,
      );

      return secrets;
    } catch (error) {
      this.logger.error('Failed to list and fetch secrets', error);
      throw new Error(
        `Failed to list and fetch secrets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
