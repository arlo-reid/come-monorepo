/**
 * Interface for secret manager implementations
 *
 * Allows pluggable secret management backends (Google, AWS, Azure, etc.)
 */
export interface ISecretManager {
  /**
   * Get a single secret by name
   * @param name - Secret name
   * @returns Secret value
   */
  getSecret(name: string): Promise<string>;

  /**
   * List and fetch all secrets from the secret manager
   * @returns Map of secret names to values
   */
  listAndGetAllSecrets(): Promise<Map<string, string>>;
}
