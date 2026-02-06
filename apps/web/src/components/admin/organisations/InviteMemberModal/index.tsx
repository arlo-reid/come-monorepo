"use client";

// TODO: Uncomment when invitations backend is implemented
// import { useQueryClient } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteMemberModalProps {
  organisationSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberModal({
  organisationSlug: _organisationSlug,
  open,
  onOpenChange,
}: InviteMemberModalProps) {
  // TODO: Implement when invitations backend is available
  // The invitation system requires backend support for:
  // - Creating invitations
  // - Listing pending invitations
  // - Accepting/rejecting invitations
  // - Email notifications

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organisation
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center text-muted-foreground">
          <p>Invitation system coming soon.</p>
          <p className="text-sm mt-2">
            This feature requires backend implementation.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled>Send Invitation (Coming Soon)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
