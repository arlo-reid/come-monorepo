import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { MembersTable } from "@/components/admin/organisations/MembersTable";
import { authOptions } from "@/lib/auth";

interface MembersPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  return (
    <div className="container mx-auto py-8">
      <MembersTable organisationSlug={slug} />
    </div>
  );
}
