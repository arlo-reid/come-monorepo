"use client";

// TODO: Uncomment when invitations backend is implemented
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// TODO: Define invitation types when backend is implemented
// interface InvitationItem {
//   id: string;
//   email: string;
//   roleOffered: string;
//   status: string;
//   createdAt: string;
// }

interface InvitationsTabProps {
  data: unknown[];
  isLoading: boolean;
  error: unknown;
}

export function InvitationsTab({
  data: _invitations,
  isLoading,
  error,
}: InvitationsTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading invitations
      </div>
    );
  }

  // TODO: Implement when invitations backend is available
  return (
    <div className="py-8 text-center text-muted-foreground">
      <p>Invitation system coming soon.</p>
      <p className="text-sm mt-2">
        This feature requires backend implementation.
      </p>
    </div>
  );
}
