---
name: update-api-scenarios
description: Update or create Playwright API scenario tests for multi-step business flows. Use when testing complex workflows, integration between operations, or end-to-end API journeys.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# API Scenario Tests (Update & Create)

Update or create Playwright API tests that validate multi-step business flows and integration scenarios.

## When to Use This Skill

- "Add scenario tests for the user registration flow"
- "Test the complete order lifecycle"
- "Create integration tests for billing workflows"
- When testing operations that depend on each other
- When validating business rules across multiple endpoints

## Test Location

`tests/api/scenarios/{context-name}.spec.ts`

## Test Structure

```
tests/
├── api/
│   ├── scenarios/
│   │   └── {context-name}.spec.ts  # Multi-step scenario tests
│   └── fixtures/
│       └── test-data.ts            # Data generators
```

## Scenario Test Pattern

### File Template

```typescript
/**
 * {EntityName} API Scenario Tests
 *
 * Tests multi-step business flows involving {entities}.
 * These scenarios validate that operations work together correctly.
 *
 * @tags @api @scenario
 */

import { test, expect } from '@playwright/test';
import { generate{Entity} } from '../fixtures/test-data';

test.describe('{Entity} API - Scenarios @api @scenario', () => {
  test.describe('{Entity} Lifecycle', () => {
    test('complete lifecycle: create → read → update → delete → verify gone', async ({
      request,
    }) => {
      const payload = generate{Entity}();

      // Step 1: Create
      const createResponse = await request.post('/{entities}', {
        data: payload,
      });
      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();
      expect(created.name).toBe(payload.name);

      // Step 2: Read (verify exists)
      const getResponse = await request.get(`/{entities}/${created.id}`);
      expect(getResponse.status()).toBe(200);
      const retrieved = await getResponse.json();
      expect(retrieved.id).toBe(created.id);

      // Step 3: Update
      const updateResponse = await request.put(`/{entities}/${created.id}`, {
        data: { name: 'Updated Name' },
      });
      expect(updateResponse.status()).toBe(200);

      // Step 4: Delete
      const deleteResponse = await request.delete(`/{entities}/${created.id}`);
      expect(deleteResponse.status()).toBe(204);

      // Step 5: Verify gone
      const verifyResponse = await request.get(`/{entities}/${created.id}`);
      expect(verifyResponse.status()).toBe(404);
    });
  });

  test.describe('Duplicate Handling', () => {
    test('cannot create {entity} with duplicate unique field', async ({
      request,
    }) => {
      const payload = generate{Entity}();

      // Step 1: Create first
      const firstResponse = await request.post('/{entities}', {
        data: payload,
      });
      expect(firstResponse.status()).toBe(201);

      // Step 2: Try duplicate
      const duplicateResponse = await request.post('/{entities}', {
        data: payload,
      });
      expect([400, 409, 422]).toContain(duplicateResponse.status());

      // Cleanup
      const created = await firstResponse.json();
      await request.delete(`/{entities}/${created.id}`);
    });
  });

  test.describe('Bulk Operations', () => {
    test('can create multiple {entities} sequentially', async ({ request }) => {
      const entities = [
        generate{Entity}(),
        generate{Entity}(),
        generate{Entity}(),
      ];

      const created: Array<{ id: string }> = [];

      // Create all
      for (const payload of entities) {
        const response = await request.post('/{entities}', { data: payload });
        expect(response.status()).toBe(201);
        created.push(await response.json());
      }

      expect(created).toHaveLength(3);

      // Cleanup
      for (const entity of created) {
        await request.delete(`/{entities}/${entity.id}`);
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('handles {entity} with maximum length fields', async ({ request }) => {
      const longValue = 'A'.repeat(100);
      const payload = generate{Entity}({ name: longValue });

      const response = await request.post('/{entities}', { data: payload });
      expect(response.status()).toBe(201);

      const created = await response.json();
      expect(created.name).toBe(longValue);

      // Cleanup
      await request.delete(`/{entities}/${created.id}`);
    });

    test('handles {entity} with special characters', async ({ request }) => {
      const specialName = "Entity with 'quotes' & symbols!";
      const payload = generate{Entity}({ name: specialName });

      const response = await request.post('/{entities}', { data: payload });
      expect(response.status()).toBe(201);

      const created = await response.json();
      expect(created.name).toBe(specialName);

      // Cleanup
      await request.delete(`/{entities}/${created.id}`);
    });
  });

  test.describe('Cross-Entity Workflows', () => {
    test('related entities workflow', async ({ request }) => {
      // Example: Create parent, add children, verify relationships

      // Step 1: Create parent
      const parentPayload = generate{Entity}();
      const parentResponse = await request.post('/{entities}', {
        data: parentPayload,
      });
      expect(parentResponse.status()).toBe(201);
      const parent = await parentResponse.json();

      // Step 2: Create related entity (if applicable)
      // const childResponse = await request.post(`/{entities}/${parent.id}/children`, {
      //   data: generateChild(),
      // });

      // Step 3: Verify relationship
      // const verifyResponse = await request.get(`/{entities}/${parent.id}/children`);
      // expect(verifyResponse.status()).toBe(200);

      // Cleanup (in reverse order)
      await request.delete(`/{entities}/${parent.id}`);
    });
  });
});
```

## Scenario Categories

### 1. Lifecycle Scenarios
Test complete entity lifecycles: create → read → update → delete → verify

### 2. Duplicate/Conflict Scenarios
Test uniqueness constraints and conflict handling

### 3. Bulk Operation Scenarios
Test creating/updating/deleting multiple entities

### 4. Edge Case Scenarios
Test boundary conditions, special characters, max lengths

### 5. Cross-Entity Workflows
Test relationships and dependencies between entities

### 6. Business Rule Scenarios
Test domain-specific business logic and validations

## Key Principles

1. **Multi-step**: Each scenario tests a complete workflow, not isolated operations
2. **Realistic**: Scenarios reflect actual user journeys and business processes
3. **Sequential**: Steps build on each other to test integration
4. **Comprehensive Cleanup**: Clean up all created resources at the end
5. **Clear Documentation**: Each scenario describes what business flow it tests

## Test Commands

```bash
# Run all scenario tests
npm run test:api:scenarios -w tests

# Run specific context scenarios
npm run test:api -- --grep "scenario" --grep "{context}"
```

## Checklist for New Scenarios

- [ ] Create test file in `tests/api/scenarios/{context}.spec.ts`
- [ ] Include lifecycle scenario (create → read → update → delete)
- [ ] Test duplicate/conflict handling
- [ ] Test bulk operations if applicable
- [ ] Test edge cases (max lengths, special chars)
- [ ] Test cross-entity workflows if applicable
- [ ] Include comprehensive cleanup
- [ ] Add appropriate tags (`@api @scenario`)

## Difference from CRUD Tests

| CRUD Tests | Scenario Tests |
|------------|----------------|
| Single operation focus | Multi-step workflows |
| Test isolation | Test integration |
| One endpoint per test | Multiple endpoints per test |
| Unit-like granularity | Journey-like coverage |
| `tests/api/core-api/` | `tests/api/scenarios/` |

## Reference

- See `tests/api/scenarios/organisations.spec.ts` for working example
- See `tests/api/fixtures/test-data.ts` for data generator patterns
