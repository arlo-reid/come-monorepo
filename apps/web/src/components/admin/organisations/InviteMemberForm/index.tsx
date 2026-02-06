"use client";

// TODO: Uncomment when invitations backend is implemented
// import { useQueryClient } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InviteMemberFormProps {
  organisationId: string;
}

export function InviteMemberForm(_props: InviteMemberFormProps) {
  // TODO: Implement when invitations backend is available
  // The invitation system requires backend support for:
  // - Creating invitations
  // - Listing pending invitations
  // - Accepting/rejecting invitations
  // - Email notifications

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
        <CardDescription>
          Send an invitation to join your organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-8 text-center text-muted-foreground">
          <p>Invitation system coming soon.</p>
          <p className="text-sm mt-2">
            This feature requires backend implementation.
          </p>
        </div>
        <Button variant="outline" disabled>
          Send Invitation (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
