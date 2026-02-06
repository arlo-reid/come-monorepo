import { APIRequestContext } from '@playwright/test';

/**
 * Helper to create a resource and ensure cleanup after test
 */
export async function withCleanup<T>(
  createFn: () => Promise<T>,
  cleanupFn: (resource: T) => Promise<void>,
): Promise<T> {
  const resource = await createFn();
  // Note: In actual tests, you'd register this with test.afterEach
  // This is a pattern example
  return resource;
}

/**
 * Generate unique test identifiers to avoid collisions
 */
export function uniqueId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Condition not met within ${timeoutMs}ms`);
}
