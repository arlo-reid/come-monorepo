"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname.includes("/members")) return "members";
    return "details";
  };

  const activeTab = getActiveTab();

  return (
    <div className="w-full">
      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="details" asChild>
            <Link href={`/admin/organisations/${slug}`}>Details</Link>
          </TabsTrigger>

          <TabsTrigger value="members" asChild>
            <Link href={`/admin/organisations/${slug}/members`}>Members</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4">{children}</div>
    </div>
  );
}
