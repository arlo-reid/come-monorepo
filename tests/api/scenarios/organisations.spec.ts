/**
 * Organisations API Scenario Tests
 *
 * Tests multi-step business flows involving organisations.
 * These scenarios validate that operations work together correctly.
 *
 * @tags @scenario
 */

import { test, expect } from "@playwright/test";
import { generateOrganisation } from "../fixtures/test-data";
import {
  createAuthenticatedRequest,
  createAuthenticatedUser,
} from "../../utils/auth-helpers";

test.describe("Organisations API - Scenarios @scenario", () => {
  test.describe("Organisation Lifecycle", () => {
    test("complete lifecycle: create → verify → delete → verify gone", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);
      const payload = generateOrganisation();

      // Step 1: Create organisation
      const createResponse = await authRequest.post("/organisations", {
        data: payload,
      });
      expect(createResponse.status()).toBe(201);

      const created = await createResponse.json();
      expect(created.name).toBe(payload.name);
      expect(created.slug).toBe(payload.slug);

      // Step 2: (Future) Verify organisation exists via GET
      // const getResponse = await authRequest.get(`/organisations/${created.slug}`);
      // expect(getResponse.status()).toBe(200);

      // Step 3: Delete organisation
      const deleteResponse = await authRequest.delete(
        `/organisations/${created.slug}`
      );
      expect(deleteResponse.status()).toBe(204);

      // Step 4: (Future) Verify organisation is gone
      // const verifyResponse = await authRequest.get(`/organisations/${created.slug}`);
      // expect(verifyResponse.status()).toBe(404);
    });
  });

  test.describe("Duplicate Handling", () => {
    test("cannot create organisation with duplicate slug", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);
      const payload = generateOrganisation();

      // Step 1: Create first organisation
      const firstResponse = await authRequest.post("/organisations", {
        data: payload,
      });
      expect(firstResponse.status()).toBe(201);

      // Step 2: Try to create another with same slug
      const duplicatePayload = {
        name: "Different Name",
        slug: payload.slug, // Same slug
      };

      const duplicateResponse = await authRequest.post("/organisations", {
        data: duplicatePayload,
      });

      // Expect conflict or similar error
      // The exact status depends on implementation (409, 400, 422)
      expect([400, 409, 422]).toContain(duplicateResponse.status());

      // Cleanup
      await authRequest.delete(`/organisations/${payload.slug}`);
    });
  });

  test.describe("Bulk Operations", () => {
    test("can create multiple organisations sequentially", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const organisations = [
        generateOrganisation(),
        generateOrganisation(),
        generateOrganisation(),
      ];

      const created: Array<{ slug: string }> = [];

      // Create all organisations
      for (const payload of organisations) {
        const response = await authRequest.post("/organisations", {
          data: payload,
        });
        expect(response.status()).toBe(201);
        created.push(await response.json());
      }

      expect(created).toHaveLength(3);

      // Cleanup: Delete all created organisations
      for (const org of created) {
        await authRequest.delete(`/organisations/${org.slug}`);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("handles organisation with maximum length name", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);
      const longName = "A".repeat(100); // Max length
      const payload = generateOrganisation({ name: longName });

      const response = await authRequest.post("/organisations", {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const created = await response.json();
      expect(created.name).toBe(longName);

      // Cleanup
      await authRequest.delete(`/organisations/${created.slug}`);
    });

    test("handles organisation with special characters in name", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);
      const specialName = "Org with 'quotes' & symbols!";
      const payload = generateOrganisation({ name: specialName });

      const response = await authRequest.post("/organisations", {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const created = await response.json();
      expect(created.name).toBe(specialName);

      // Cleanup
      await authRequest.delete(`/organisations/${created.slug}`);
    });
  });
});
