"use client";

import { useState } from "react";

import { InviteMemberModal } from "@/components/admin/organisations/InviteMemberModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetOrganisationMembershipsHttpControllerHandle } from "@/generated/memberships/memberships";

import { MembersTab } from "./MembersTab";

interface MembersTableProps {
  organisationSlug: string;
}

export function MembersTable({ organisationSlug }: MembersTableProps) {
  const [activeTab, setActiveTab] = useState<"members" | "invitations">(
    "members",
  );
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useGetOrganisationMembershipsHttpControllerHandle(organisationSlug, {});

  // TODO: Add invitations query when backend is implemented
  // const {
  //   data: invitationsData,
  //   isLoading: invitationsLoading,
  //   error: invitationsError,
  // } = useListInvitationsQueryControllerList(organisationSlug, {});

  const membersCount = membersData?.data?.pagination?.total || 0;
  const invitationsCount = 0; // TODO: Get from invitations query

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage organisation members and invitations
            </CardDescription>
          </div>
          <Button onClick={() => setInviteModalOpen(true)}>
            Invite Member
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "members" | "invitations")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="members">
                Members ({membersCount})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations ({invitationsCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <MembersTab
                data={membersData?.data?.items || []}
                isLoading={membersLoading}
                error={membersError}
              />
            </TabsContent>

            <TabsContent value="invitations">
              {/* TODO: Add InvitationsTab when backend is implemented */}
              <div className="py-8 text-center text-muted-foreground">
                <p>Invitation system coming soon.</p>
                <p className="text-sm mt-2">
                  This feature requires backend implementation.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <InviteMemberModal
        organisationSlug={organisationSlug}
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </>
  );
}
