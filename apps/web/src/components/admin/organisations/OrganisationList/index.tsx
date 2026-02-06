"use client";

import { Building2, Loader2} from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";
import { toast } from "sonner";

import type { OrganisationResponseDto } from "@/generated/model";
import { useGetOrganisationsPagedHttpControllerHandle } from "@/generated/organisations/organisations";

import { CreateOrganisationModal } from "@/components/admin/organisations/CreateOrganisationModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OrganisationListProps {
  session?: Session | null;
}

export function OrganisationList({ session }: OrganisationListProps) {
  const {
    data: organisationsData,
    isLoading,
    isError,
  } = useGetOrganisationsPagedHttpControllerHandle(
    {},
    {
      query: {
        retry: false,
      },
    },
  );

  // Handle error state
  if (isError) {
    toast.error("Failed to load organisations");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const organisations: OrganisationResponseDto[] =
    organisationsData?.data?.items ?? [];

  if (organisations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organisations</CardTitle>
          <CardDescription>
            You haven&apos;t created any organisations yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganisationModal session={session} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organisations</h2>
        <CreateOrganisationModal session={session} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organisations.map((org) => (
          <Link
            key={org.slug}
            href={`/admin/organisations/${org.slug}`}
            className="transition-transform hover:scale-101"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {org.name}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
