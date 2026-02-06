"use client";

import { Building2 } from "lucide-react";
import type { Session } from "next-auth";
import { useState } from "react";

import { OrganisationForm } from "@/components/admin/organisations/OrganisationForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateOrganisationModalProps {
  session?: Session | null;
  triggerClassName?: string;
}

export function CreateOrganisationModal({
  session,
  triggerClassName,
}: CreateOrganisationModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        asChild
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        <div>
          <Building2 className="mr-2 h-4 w-4" />
          Create New
        </div>
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Organisation</DialogTitle>
        </DialogHeader>
        <OrganisationForm
          session={session}
          onSuccess={() => setOpen(false)}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
