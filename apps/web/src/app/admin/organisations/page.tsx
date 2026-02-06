import { getServerSession } from "next-auth/next";

import { OrganisationList } from "@/components/admin/organisations/OrganisationList";
import { authOptions } from "@/lib/auth";

export default async function OrganisationPage() {
  const session = await getServerSession(authOptions);

  return <OrganisationList session={session} />;
}
