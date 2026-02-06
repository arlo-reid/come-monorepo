import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Load secrets from Google Secret Manager and inject them into process.env.
 * This runs BEFORE NestJS bootstraps to avoid circular dependency issues.
 *
 * Respects SKIP_SECRETS=true to skip loading (useful for local development).
 */
export async function loadSecrets(): Promise<void> {
  const skipSecrets = process.env.SKIP_SECRETS === 'true';

  if (skipSecrets) {
    console.log('[loadSecrets] SKIP_SECRETS=true, skipping secret loading');
    return;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT environment variable is required for secret loading',
    );
  }

  console.log(`[loadSecrets] Loading secrets from project: ${projectId}`);

  // Initialize client - uses Application Default Credentials (ADC) on Cloud Run,
  // or explicit keyFilename for local development
  const client = credentialsPath
    ? new SecretManagerServiceClient({ keyFilename: credentialsPath })
    : new SecretManagerServiceClient();

  const parent = `projects/${projectId}`;
  const [secretsList] = await client.listSecrets({ parent });

  if (!secretsList || secretsList.length === 0) {
    console.log('[loadSecrets] No secrets found in project');
    return;
  }

  console.log(`[loadSecrets] Found ${secretsList.length} secrets, fetching...`);

  // Fetch all secrets in parallel
  await Promise.all(
    secretsList.map(async (secret) => {
      if (!secret.name) return;

      const secretName = secret.name.split('/').pop();
      if (!secretName) return;

      try {
        const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;
        const [version] = await client.accessSecretVersion({
          name: secretPath,
        });

        const value = version.payload?.data?.toString();
        if (value) {
          process.env[secretName] = value;
          console.log(`[loadSecrets] Loaded: ${secretName}`);
        }
      } catch (error) {
        console.error(`[loadSecrets] Failed to load secret: ${secretName}`);
        throw error;
      }
    }),
  );

  console.log('[loadSecrets] All secrets loaded into process.env');
}
