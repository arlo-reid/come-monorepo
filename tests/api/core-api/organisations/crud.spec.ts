/**
 * Organisations API CRUD Tests
 *
 * Tests individual CRUD operations for the organisations endpoint.
 * Each test is independent and cleans up after itself.
 *
 * @tags @api @crud
 */

import { test, expect } from "@playwright/test";
import { generateOrganisation } from "../../fixtures/test-data";
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
} from "../../../utils/auth-helpers";

test.describe("Organisations API - CRUD @api @crud", () => {
  test.describe("GET /organisations", () => {
    test("returns paginated list of organisations", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Setup: Create a few organisations
      const org1 = generateOrganisation();
      const org2 = generateOrganisation();

      const create1 = await authRequest.post("/organisations", { data: org1 });
      const create2 = await authRequest.post("/organisations", { data: org2 });
      expect(create1.status()).toBe(201);
      expect(create2.status()).toBe(201);

      const created1 = await create1.json();
      const created2 = await create2.json();

      // Test: Get paginated list
      const response = await authRequest.get("/organisations");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.total).toBeGreaterThanOrEqual(2);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.offset).toBe(0);
      expect(typeof body.pagination.hasMore).toBe("boolean");

      // Cleanup
      await authRequest.delete(`/organisations/${created1.slug}`);
      await authRequest.delete(`/organisations/${created2.slug}`);
    });

    test("respects limit and offset parameters", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Setup: Create organisations
      const orgs = [
        generateOrganisation(),
        generateOrganisation(),
        generateOrganisation(),
      ];

      const createdOrgs = [];
      for (const org of orgs) {
        const res = await authRequest.post("/organisations", { data: org });
        expect(res.status()).toBe(201);
        createdOrgs.push(await res.json());
      }

      // Test: Get with limit=2
      const response = await authRequest.get("/organisations?limit=2&offset=0");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items.length).toBeLessThanOrEqual(2);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.offset).toBe(0);

      // Cleanup
      for (const org of createdOrgs) {
        await authRequest.delete(`/organisations/${org.slug}`);
      }
    });
  });

  test.describe("GET /organisations/:slug", () => {
    test("returns organisation by slug", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      // Setup: Create an organisation
      const payload = generateOrganisation();
      const createResponse = await authRequest.post("/organisations", {
        data: payload,
      });
      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();

      // Test: Get by slug
      const response = await authRequest.get(`/organisations/${created.slug}`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.id).toBe(created.id);
      expect(body.name).toBe(payload.name);
      expect(body.slug).toBe(created.slug);
      expect(body.ownerId).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Cleanup
      await authRequest.delete(`/organisations/${created.slug}`);
    });

    test("returns 404 when organisation not found", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const response = await authRequest.get(
        "/organisations/non-existent-slug-12345"
      );
      expect(response.status()).toBe(404);
    });
  });

  test.describe("POST /organisations", () => {
    test("creates organisation with valid data", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const payload = generateOrganisation();

      const response = await authRequest.post("/organisations", {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toMatchObject({
        name: payload.name,
        slug: payload.slug,
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Cleanup
      await request.delete(`/organisations/${body.slug}`);
    });

    test("creates organisation with auto-generated slug when not provided", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const payload = { name: `Auto Slug Test ${Date.now()}` };

      const response = await authRequest.post("/organisations", {
        data: payload,
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.name).toBe(payload.name);
      expect(body.slug).toBeDefined();
      expect(body.slug.length).toBeGreaterThan(0);

      // Cleanup
      await request.delete(`/organisations/${body.slug}`);
    });

    test("returns 400 when name is missing", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const response = await authRequest.post("/organisations", {
        data: { slug: "test-slug" },
      });

      expect(response.status()).toBe(400);
    });

    test("returns 400 when name is too short", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const response = await authRequest.post("/organisations", {
        data: { name: "A" },
      });

      expect(response.status()).toBe(400);
    });

    test("returns 400 when slug format is invalid", async ({ request }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const response = await authRequest.post("/organisations", {
        data: {
          name: "Valid Name",
          slug: "Invalid Slug With Spaces",
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe("DELETE /organisations/:slug", () => {
    test("deletes existing organisation", async ({ request }) => {
      // Setup: Create an organisation first
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const payload = generateOrganisation();
      const createResponse = await authRequest.post("/organisations", {
        data: payload,
      });
      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();

      // Test: Delete the organisation
      const deleteResponse = await authRequest.delete(
        `/organisations/${created.slug}`
      );

      expect(deleteResponse.status()).toBe(204);
    });

    test("returns 404 when organisation does not exist", async ({
      request,
    }) => {
      const testUser = await createAuthenticatedUser(request);
      const authRequest = createAuthenticatedRequest(request, testUser.idToken);

      const response = await authRequest.delete(
        "/organisations/non-existent-slug"
      );
      expect(response.status()).toBe(404);
    });
  });
});
