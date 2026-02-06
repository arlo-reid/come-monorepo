/**
 * Memberships API Scenario Tests
 *
 * Tests multi-step business flows involving organisation memberships.
 * These scenarios validate that membership operations work correctly
 * together and enforce business rules.
 *
 * Scenarios from TPL-6:
 * 1. Organisation creation auto-membership (owner gets ORG_ADMIN)
 * 2. Add member to organisation flow
 * 3. Role update flow
 * 4. Authorization - non-admin cannot add members
 * 5. Owner cannot be removed
 * 6. User can leave organisation
 * 7. Duplicate membership prevention
 *
 * @tags @scenario
 */

import { test, expect } from "@playwright/test";
import { generateOrganisation, OrganisationRole } from "../fixtures/test-data";
import {
  createAuthenticatedRequest,
  createAuthenticatedUser,
} from "../../utils/auth-helpers";

test.describe("Memberships API - Scenarios @scenario", () => {
  test.describe("Scenario 1: Organisation Creation Auto-Membership", () => {
    test("owner automatically becomes ORG_ADMIN when creating organisation", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Verify owner has ORG_ADMIN membership via user's memberships
      const myMembershipsResponse = await ownerRequest.get(
        "/users/me/memberships"
      );
      expect(myMembershipsResponse.status()).toBe(200);

      const myMemberships = await myMembershipsResponse.json();
      const ownerMembership = myMemberships.items.find(
        (m: { organisationId: string }) => m.organisationId === org.id
      );

      expect(ownerMembership).toBeDefined();
      expect(ownerMembership.userId).toBe(owner.id);
      expect(ownerMembership.role).toBe(OrganisationRole.ORG_ADMIN);

      // Step 3: Verify membership appears in organisation's membership list
      const orgMembershipsResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      expect(orgMembershipsResponse.status()).toBe(200);

      const orgMemberships = await orgMembershipsResponse.json();
      expect(orgMemberships.items.length).toBeGreaterThanOrEqual(1);

      const ownerMembershipInOrg = orgMemberships.items.find(
        (m: { userId: string }) => m.userId === owner.id
      );
      expect(ownerMembershipInOrg).toBeDefined();
      expect(ownerMembershipInOrg.role).toBe(OrganisationRole.ORG_ADMIN);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 2: Add Member to Organisation Flow", () => {
    test("complete flow: create org → add member → verify member access", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Verify member has no access initially
      const initialMemberMemberships = await memberRequest.get(
        "/users/me/memberships"
      );
      expect(initialMemberMemberships.status()).toBe(200);
      const initialMemberships = await initialMemberMemberships.json();
      const hasOrg = initialMemberships.items.some(
        (m: { organisationId: string }) => m.organisationId === org.id
      );
      expect(hasOrg).toBe(false);

      // Step 3: Owner adds member to organisation
      const addMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: {
            userId: member.id,
            role: OrganisationRole.ORG_MEMBER,
          },
        }
      );
      expect(addMemberResponse.status()).toBe(201);
      const membership = await addMemberResponse.json();

      // Step 4: Verify member now has access
      const afterMemberMemberships = await memberRequest.get(
        "/users/me/memberships"
      );
      expect(afterMemberMemberships.status()).toBe(200);
      const afterMemberships = await afterMemberMemberships.json();
      const memberMembership = afterMemberships.items.find(
        (m: { organisationId: string }) => m.organisationId === org.id
      );
      expect(memberMembership).toBeDefined();
      expect(memberMembership.id).toBe(membership.id);
      expect(memberMembership.role).toBe(OrganisationRole.ORG_MEMBER);

      // Step 5: Verify member can read their own membership
      const getMembershipResponse = await memberRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(getMembershipResponse.status()).toBe(200);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 3: Role Update Flow", () => {
    test("promote member to admin → demote back to member", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Step 1: Create organisation and add member
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      const addMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(addMemberResponse.status()).toBe(201);
      const membership = await addMemberResponse.json();

      // Step 2: Verify initial role is ORG_MEMBER
      expect(membership.role).toBe(OrganisationRole.ORG_MEMBER);

      // Step 3: Promote to ORG_ADMIN
      const promoteResponse = await ownerRequest.patch(
        `/organisations/${org.slug}/memberships/${membership.id}`,
        {
          data: { role: OrganisationRole.ORG_ADMIN },
        }
      );
      expect(promoteResponse.status()).toBe(200);
      const promoted = await promoteResponse.json();
      expect(promoted.role).toBe(OrganisationRole.ORG_ADMIN);

      // Step 4: Verify via GET
      const getAfterPromoteResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(getAfterPromoteResponse.status()).toBe(200);
      const afterPromote = await getAfterPromoteResponse.json();
      expect(afterPromote.role).toBe(OrganisationRole.ORG_ADMIN);

      // Step 5: Demote back to ORG_MEMBER
      const demoteResponse = await ownerRequest.patch(
        `/organisations/${org.slug}/memberships/${membership.id}`,
        {
          data: { role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(demoteResponse.status()).toBe(200);
      const demoted = await demoteResponse.json();
      expect(demoted.role).toBe(OrganisationRole.ORG_MEMBER);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 4: Authorization - Non-Admin Cannot Add Members", () => {
    test("ORG_MEMBER cannot add other members to organisation", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const outsider = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add member as ORG_MEMBER
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
      });

      // Step 3: Member (non-admin) tries to add another user
      const addAttemptResponse = await memberRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: outsider.id, role: OrganisationRole.ORG_MEMBER },
        }
      );

      // Step 4: Should be forbidden
      expect(addAttemptResponse.status()).toBe(403);

      // Step 5: Verify outsider was NOT added
      const orgMembershipsResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      const orgMemberships = await orgMembershipsResponse.json();
      const outsiderMembership = orgMemberships.items.find(
        (m: { userId: string }) => m.userId === outsider.id
      );
      expect(outsiderMembership).toBeUndefined();

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("ORG_ADMIN can add members (not just owner)", async ({ request }) => {
      const owner = await createAuthenticatedUser(request);
      const admin = await createAuthenticatedUser(request);
      const newMember = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add admin as ORG_ADMIN
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: admin.id, role: OrganisationRole.ORG_ADMIN },
      });

      // Step 3: Admin adds a new member
      const addMemberResponse = await adminRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: newMember.id, role: OrganisationRole.ORG_MEMBER },
        }
      );

      // Step 4: Should succeed
      expect(addMemberResponse.status()).toBe(201);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 5: Owner Cannot Be Removed", () => {
    test("cannot delete owner's membership from organisation", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const admin = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const adminRequest = createAuthenticatedRequest(request, admin.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add another admin
      await ownerRequest.post(`/organisations/${org.slug}/memberships`, {
        data: { userId: admin.id, role: OrganisationRole.ORG_ADMIN },
      });

      // Step 3: Get owner's membership
      const orgMembershipsResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      const orgMemberships = await orgMembershipsResponse.json();
      const ownerMembership = orgMemberships.items.find(
        (m: { userId: string }) => m.userId === owner.id
      );
      expect(ownerMembership).toBeDefined();

      // Step 4: Another admin tries to remove owner
      const deleteAttemptResponse = await adminRequest.delete(
        `/organisations/${org.slug}/memberships/${ownerMembership.id}`
      );

      // Step 5: Should be forbidden or bad request
      expect([400, 403]).toContain(deleteAttemptResponse.status());

      // Step 6: Verify owner's membership still exists
      const verifyResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/${ownerMembership.id}`
      );
      expect(verifyResponse.status()).toBe(200);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });

    test("owner cannot remove themselves from organisation", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Get owner's membership
      const orgMembershipsResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      const orgMemberships = await orgMembershipsResponse.json();
      const ownerMembership = orgMemberships.items.find(
        (m: { userId: string }) => m.userId === owner.id
      );

      // Step 3: Owner tries to remove themselves
      const deleteAttemptResponse = await ownerRequest.delete(
        `/organisations/${org.slug}/memberships/${ownerMembership.id}`
      );

      // Step 4: Should be forbidden or bad request
      expect([400, 403]).toContain(deleteAttemptResponse.status());

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 6: User Can Leave Organisation", () => {
    test("member can delete their own membership (leave org)", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);

      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add member
      const addMemberResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(addMemberResponse.status()).toBe(201);
      const membership = await addMemberResponse.json();

      // Step 3: Verify member is in org
      let myMemberships = await memberRequest.get("/users/me/memberships");
      let memberships = await myMemberships.json();
      expect(
        memberships.items.some(
          (m: { organisationId: string }) => m.organisationId === org.id
        )
      ).toBe(true);

      // Step 4: Member leaves (deletes their own membership)
      const leaveResponse = await memberRequest.delete(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(leaveResponse.status()).toBe(204);

      // Step 5: Verify member is no longer in org
      myMemberships = await memberRequest.get("/users/me/memberships");
      memberships = await myMemberships.json();
      expect(
        memberships.items.some(
          (m: { organisationId: string }) => m.organisationId === org.id
        )
      ).toBe(false);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Scenario 7: Duplicate Membership Prevention", () => {
    test("cannot create duplicate membership for same user in same org", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add member
      const firstAddResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(firstAddResponse.status()).toBe(201);

      // Step 3: Try to add same member again
      const duplicateAddResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_ADMIN },
        }
      );

      // Step 4: Should fail with conflict or similar error
      expect([400, 409, 422]).toContain(duplicateAddResponse.status());

      // Step 5: Verify only one membership exists
      const orgMembershipsResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships`
      );
      const orgMemberships = await orgMembershipsResponse.json();
      const memberMemberships = orgMemberships.items.filter(
        (m: { userId: string }) => m.userId === member.id
      );
      expect(memberMemberships.length).toBe(1);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Membership Lifecycle", () => {
    test("complete lifecycle: add member → update role → delete → verify gone", async ({
      request,
    }) => {
      const owner = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);
      const ownerRequest = createAuthenticatedRequest(request, owner.idToken);

      // Step 1: Create organisation
      const orgPayload = generateOrganisation();
      const createOrgResponse = await ownerRequest.post("/organisations", {
        data: orgPayload,
      });
      expect(createOrgResponse.status()).toBe(201);
      const org = await createOrgResponse.json();

      // Step 2: Add member
      const addResponse = await ownerRequest.post(
        `/organisations/${org.slug}/memberships`,
        {
          data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
        }
      );
      expect(addResponse.status()).toBe(201);
      const membership = await addResponse.json();

      // Step 3: Read membership
      const getResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(getResponse.status()).toBe(200);

      // Step 4: Update role
      const updateResponse = await ownerRequest.patch(
        `/organisations/${org.slug}/memberships/${membership.id}`,
        {
          data: { role: OrganisationRole.ORG_ADMIN },
        }
      );
      expect(updateResponse.status()).toBe(200);

      // Step 5: Delete membership
      const deleteResponse = await ownerRequest.delete(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(deleteResponse.status()).toBe(204);

      // Step 6: Verify gone
      const verifyResponse = await ownerRequest.get(
        `/organisations/${org.slug}/memberships/${membership.id}`
      );
      expect(verifyResponse.status()).toBe(404);

      // Cleanup
      await ownerRequest.delete(`/organisations/${org.slug}`);
    });
  });

  test.describe("Multi-Organisation Membership", () => {
    test("user can be member of multiple organisations with different roles", async ({
      request,
    }) => {
      const owner1 = await createAuthenticatedUser(request);
      const owner2 = await createAuthenticatedUser(request);
      const member = await createAuthenticatedUser(request);

      const owner1Request = createAuthenticatedRequest(request, owner1.idToken);
      const owner2Request = createAuthenticatedRequest(request, owner2.idToken);
      const memberRequest = createAuthenticatedRequest(request, member.idToken);

      // Step 1: Create two organisations
      const org1Response = await owner1Request.post("/organisations", {
        data: generateOrganisation(),
      });
      expect(org1Response.status()).toBe(201);
      const org1 = await org1Response.json();

      const org2Response = await owner2Request.post("/organisations", {
        data: generateOrganisation(),
      });
      expect(org2Response.status()).toBe(201);
      const org2 = await org2Response.json();

      // Step 2: Add member to both orgs with different roles
      await owner1Request.post(`/organisations/${org1.slug}/memberships`, {
        data: { userId: member.id, role: OrganisationRole.ORG_MEMBER },
      });
      await owner2Request.post(`/organisations/${org2.slug}/memberships`, {
        data: { userId: member.id, role: OrganisationRole.ORG_ADMIN },
      });

      // Step 3: Verify member has both memberships
      const myMembershipsResponse = await memberRequest.get(
        "/users/me/memberships"
      );
      expect(myMembershipsResponse.status()).toBe(200);
      const myMemberships = await myMembershipsResponse.json();

      const org1Membership = myMemberships.items.find(
        (m: { organisationId: string }) => m.organisationId === org1.id
      );
      const org2Membership = myMemberships.items.find(
        (m: { organisationId: string }) => m.organisationId === org2.id
      );

      expect(org1Membership).toBeDefined();
      expect(org1Membership.role).toBe(OrganisationRole.ORG_MEMBER);

      expect(org2Membership).toBeDefined();
      expect(org2Membership.role).toBe(OrganisationRole.ORG_ADMIN);

      // Cleanup
      await owner1Request.delete(`/organisations/${org1.slug}`);
      await owner2Request.delete(`/organisations/${org2.slug}`);
    });
  });
});
