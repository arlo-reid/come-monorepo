---
name: update-api-tests
description: Update or create Playwright API CRUD tests for bounded context modules. Use when adding new endpoints, entities, or operations that need CRUD-level test coverage.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# API CRUD Tests (Update & Create)

Update or create Playwright API tests that validate individual CRUD operations for bounded context endpoints.

## When to Use This Skill

- "Add API tests for the new billing endpoint"
- "Update tests for the organisations module"
- "Create CRUD tests for the users entity"
- After adding a new bounded context or endpoint
- After modifying existing endpoint behavior

## Test Location

`tests/api/core-api/{context-name}/{operation}.spec.ts`

## Test Structure

```
tests/
├── api/
│   ├── core-api/
│   │   └── {context-name}/
│   │       └── crud.spec.ts        # CRUD operation tests
│   └── fixtures/
│       └── test-data.ts            # Data generators
```

## Test Pattern

### File Template

```typescript
/**
 * {EntityName} API CRUD Tests
 *
 * Tests individual CRUD operations for the {entities} endpoint.
 * Each test is independent and cleans up after itself.
 *
 * @tags @api @crud
 */

import { test, expect } from '@playwright/test';
import { generate{Entity} } from '../../fixtures/test-data';

test.describe('{Entity} API - CRUD @api @crud', () => {
  test.describe('POST /{entities}', () => {
    test('creates {entity} with valid data', async ({ request }) => {
      const payload = generate{Entity}();

      const response = await request.post('/{entities}', {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        name: payload.name,
        // ... other expected fields
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();

      // Cleanup
      await request.delete(`/{entities}/${body.id}`);
    });

    test('returns 400 when required field is missing', async ({ request }) => {
      const response = await request.post('/{entities}', {
        data: { /* missing required fields */ },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /{entities}/:id', () => {
    test('returns {entity} by id', async ({ request }) => {
      // Setup: Create entity
      const payload = generate{Entity}();
      const createResponse = await request.post('/{entities}', { data: payload });
      const created = await createResponse.json();

      // Test: Get by ID
      const response = await request.get(`/{entities}/${created.id}`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.id).toBe(created.id);

      // Cleanup
      await request.delete(`/{entities}/${created.id}`);
    });

    test('returns 404 when {entity} not found', async ({ request }) => {
      const response = await request.get('/{entities}/non-existent-id');
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PUT /{entities}/:id', () => {
    test('updates {entity} with valid data', async ({ request }) => {
      // Setup
      const payload = generate{Entity}();
      const createResponse = await request.post('/{entities}', { data: payload });
      const created = await createResponse.json();

      // Test: Update
      const updatePayload = { name: 'Updated Name' };
      const response = await request.put(`/{entities}/${created.id}`, {
        data: updatePayload,
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.name).toBe(updatePayload.name);

      // Cleanup
      await request.delete(`/{entities}/${created.id}`);
    });
  });

  test.describe('DELETE /{entities}/:id', () => {
    test('deletes existing {entity}', async ({ request }) => {
      // Setup
      const payload = generate{Entity}();
      const createResponse = await request.post('/{entities}', { data: payload });
      const created = await createResponse.json();

      // Test: Delete
      const response = await request.delete(`/{entities}/${created.id}`);
      expect(response.status()).toBe(204);
    });
  });
});
```

## Test Data Generator Pattern

Add to `tests/api/fixtures/test-data.ts`:

```typescript
/**
 * Generate a unique {entity} payload
 */
export function generate{Entity}(overrides?: {
  name?: string;
  // ... other optional fields
}) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 7);

  return {
    name: overrides?.name ?? `Test {Entity} ${timestamp}`,
    // ... other fields with defaults
  };
}

/**
 * Generate multiple unique {entities}
 */
export function generate{Entities}(count: number) {
  return Array.from({ length: count }, () => generate{Entity}());
}
```

## Key Principles

1. **Independence**: Each test creates its own data and cleans up after itself
2. **Isolation**: Tests don't depend on other tests or shared state
3. **Coverage**: Test both success and error cases for each operation
4. **Cleanup**: Always delete created resources in tests

## Test Commands

```bash
# Run all CRUD tests
npm run test:api:crud -w tests

# Run specific context tests
npm run test:api -- --grep "{context}"
```

## Checklist for New Tests

- [ ] Create test file in `tests/api/core-api/{context}/crud.spec.ts`
- [ ] Add data generator in `tests/api/fixtures/test-data.ts`
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test validation errors (400 responses)
- [ ] Test not found cases (404 responses)
- [ ] Include cleanup in each test
- [ ] Add appropriate tags (`@api @crud`)

## Reference

- See `tests/api/core-api/organisations/crud.spec.ts` for working example
- See `tests/api/fixtures/test-data.ts` for data generator patterns
