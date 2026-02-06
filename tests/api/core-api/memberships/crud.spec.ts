/**
 * Memberships API CRUD Tests
 *
 * Tests individual CRUD operations for the memberships endpoint.
 * Each test is independent and cleans up after itself.
 *
 * Endpoints:
 * - POST /organisations/:orgId/memberships - Create membership
 * - GET /organisations/:orgId/memberships - List org memberships
 * - GET /organisations/:orgId/memberships/:id - Get membership by ID
 * - PATCH /organisations/:orgId/memberships/:id - Update membership role
 * - DELETE /organisations/:orgId/memberships/:id - Delete membership
 * - GET /users/me/memberships - List current user's memberships
 *
 * @tags @api @crud
 */

import { test, expect } from "@playwright/test";
import {
  generateOrganisation,
  OrganisationRole,
} from "../../fixtures/test-data";
import {
  createAuthenticatedUser,
  createAuthenticatedRequest,
} from "../../../utils/auth-helpers";

test.describe("Memberships API - CRUD @api @crud", () => {
  test.describe("POST /organisations/:orgId/memberships", () => {
    test("creates membership for a user in an organisation", async ({
      request,
    }) => {
      // Setup: Create two users - owner and member to add
      const owner = await createAuthenticatedUser(request);
      const memberToAdd = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create an organisation (owner becomes ORG_ADMIN automatically)
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Test: Add member to organisation
      const response = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: {
            userId: memberToAdd.id,
            role: OrganisationRole.ORG_MEMBER,
          },
        }
      );

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.id).toBeDefined();
      expect(body.userId).toBe(memberToAdd.id);
      expect(body.organisationId).toBe(org.id);
      expect(body.role).toBe(OrganisationRole.ORG_MEMBER);
      expect(body.createdAt).toBeDefined();

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("creates membership with ORG_ADMIN role", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const memberToAdd = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Test: Add member as ORG_ADMIN
      const response = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: {
            userId: memberToAdd.id,
            role: OrganisationRole.ORG_ADMIN,
          },
        }
      );

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.role).toBe(OrganisationRole.ORG_ADMIN);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 400 when userId is missing", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Test: Missing userId
      const response = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { role: OrganisationRole.ORG_MEMBER },
        }
      );

      expect(response.status()).toBe(400);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 403 when non-admin tries to add member", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const anotherUser = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member as ORG_MEMBER (not admin)
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
      });

      // Test: ORG_MEMBER tries to add another user
      const response = await memberRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: {
            userId: anotherUser.id,
            role: OrganisationRole.ORG_MEMBER,
          },
        }
      );

      expect(response.status()).toBe(403);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("GET /organisations/:orgId/memberships", () => {
    test("returns paginated list of organisation memberships", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member1 = await createAuthenticatedUser(request);
      const member2 = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation (owner auto-becomes member)
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add members
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member1.id, role: OrganisationRole.ORG_MEMBER },
      });
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member2.id, role: OrganisationRole.ORG_MEMBER },
      });

      // Test: Get list
      const response = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      // Owner + 2 members = 3 total
      expect(body.items.length).toBeGreaterThanOrEqual(3);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.total).toBeGreaterThanOrEqual(3);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("respects limit and offset parameters", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add multiple members
      for (let i = 0; i < 3; i++) {
        const member = await createAuthenticatedUser(request);
        await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        });
      }

      // Test: Get with limit=2
      const response = await ownerRequest.get(
        `/organisations/${org.slug}/memberships?limit=2&offset=0`
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items.length).toBe(2);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.offset).toBe(0);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("GET /organisations/:orgId/memberships/:id", () => {
    test("returns membership by id", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member
      const createMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(createMemberResponse.status()).toBe(201);
      const membership = await createMemberResponse.json();

      // Test: Get by ID
      const response = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.id).toBe(membership.id);
      expect(body.userId).toBe(member.id);
      expect(body.organisationId).toBe(org.id);
      expect(body.role).toBe(OrganisationRole.ORG_MEMBER);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 404 when membership not found", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Test: Non-existent membership ID
      const response = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/non-existent-id`
      );
      expect(response.status()).toBe(404);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("user can read their own membership", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member
      const createMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(createMemberResponse.status()).toBe(201);
      const membership = await createMemberResponse.json();

      // Test: Member can read their own membership
      const response = await memberRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.id).toBe(membership.id);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("PATCH /organisations/:orgId/memberships/:id", () => {
    test("updates membership role to ORG_ADMIN", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member as ORG_MEMBER
      const createMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(createMemberResponse.status()).toBe(201);
      const membership = await createMemberResponse.json();

      // Test: Update role to ORG_ADMIN
      const response = await ownerRequest.patch(
        `/organisations/${org.slug}/memberships/${membership.id}`,
        {
          data: { role: OrganisationRole.ORG_ADMIN },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.role).toBe(OrganisationRole.ORG_ADMIN);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 400 when role is invalid", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member
      const createMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(createMemberResponse.status()).toBe(201);
      const membership = await createMemberResponse.json();

      // Test: Invalid role
      const response = await ownerRequest.patch(
        `/organisations/${org.slug}/memberships/${membership.id}`,
        {
          data: { role: "INVALID_ROLE" },
        }
      );

      expect(response.status()).toBe(400);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 404 when non-admin tries to update role", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member1 = await createAuthenticatedUser(request);
      const member2 = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const member1Request = createAuthenticatedRequest(
        request,
        member1.idToken
      );

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add members
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member1.id, role: OrganisationRole.ORG_MEMBER },
      });
      const member2Response = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member2.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      const member2Membership = await member2Response.json();

      // Test: Non-admin tries to update another member's role
      const response = await member1Request.patch(
        `/organisations/${org.slug}/memberships/${member2Membership.id}`,
        {
          data: { role: OrganisationRole.ORG_ADMIN },
        }
      );

      expect(response.status()).toBe(404);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("DELETE /organisations/:orgId/memberships/:id", () => {
    test("deletes existing membership", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add member
      const createMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(createMemberResponse.status()).toBe(201);
      const membership = await createMemberResponse.json();

      // Test: Delete membership
      const response = await ownerRequest.delete(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );

      expect(response.status()).toBe(204);
    });

    test("returns 404 when membership not found", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Test: Delete non-existent membership
      const response = await ownerRequest.delete(
        `/organisations/${org.slug}/memberships/non-existent-id`
      );

      expect(response.status()).toBe(404);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("returns 404 when non-admin tries to delete membership", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member1 = await createAuthenticatedUser(request);
      const member2 = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const member1Request = createAuthenticatedRequest(
        request,
        member1.idToken
      );

      // Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Add members
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member1.id, role: OrganisationRole.ORG_MEMBER },
      });
      const member2Response = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member2.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      const member2Membership = await member2Response.json();

      // Test: Non-admin tries to delete another member
      const response = await member1Request.delete(
        `/organisations/${org.slug}/memberships/${member2Membership.id}`
      );

      expect(response.status()).toBe(404);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("GET /users/me/memberships", () => {
    test("returns current user's memberships", async ({ request }) => {
      const user = await createAuthenticatedUser(request);
      const owner = await createAuthenticatedUser(request);
      const userRequest = createAuthenticatedRequest(request, user.idToken);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Create organisations and add user as member
      const org1 = await ownerRequest
        .post("/organisations", {
          data: generateOrganisation(),
        })
        .then((r) => r.json());
      const org2 = await ownerRequest
        .post("/organisations", {
          data: generateOrganisation(),
        })
        .then((r) => r.json());

      await ownerRequest.post(`/organisations/${org1.slug}/memberships`, {
        data: { userId: user.id, role: OrganisationRole.ORG_MEMBER },
      });
      await ownerRequest.post(`/organisations/${org2.slug}/memberships`, {
        data: { userId: user.id, role: OrganisationRole.ORG_ADMIN },
      });

      // Test: Get user's memberships
      const response = await userRequest.get("/users/me/memberships");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length).toBe(2);

      // Verify all memberships belong to current user
      for (const membership of body.items) {
        expect(membership.userId).toBe(user.id);
      }

      // Cleanup
      await ownerRequest.delete(`/organisations/${org1.slug}`);
      await ownerRequest.delete(`/organisations/${org2.slug}`);
    });

    test("returns empty list when user has no memberships", async ({
      request,
    }) => {
      const user = await createAuthenticatedUser(request);
      const userRequest = createAuthenticatedRequest(request, user.idToken);

      // Test: Get memberships (should be empty for new user)
      const response = await userRequest.get("/users/me/memberships");
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length).toBe(0);
    });
  });
});
