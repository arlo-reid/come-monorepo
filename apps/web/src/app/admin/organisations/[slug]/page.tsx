import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { OrganisationForm } from "@/components/admin/organisations/OrganisationForm";
import { authOptions } from "@/lib/auth";

interface OrganisationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OrganisationDetailPage({
  params,
}: OrganisationDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  // Handle "create" as a special case - don't pass slug for create mode
  const isCreateMode = slug === "create";

  return (
    <OrganisationForm
      slug={isCreateMode ? undefined : slug}
      session={session}
    />
  );
}
