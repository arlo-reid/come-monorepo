import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { DynamicBreadcrumb } from "@/components/shared/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authOptions } from "@/lib/auth";
import { sanityFetch } from "@/lib/sanity/live";
import { queryGlobalSeoSettings } from "@/lib/sanity/query";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, settingsData] = await Promise.all([
    getServerSession(authOptions),
    sanityFetch({ query: queryGlobalSeoSettings }),
  ]);

  if (!session) {
    redirect("/login");
  }

  const { logoSquare } = settingsData.data ?? {};

  return (
    <SidebarProvider>
      <AdminSidebar session={session} logoSquare={logoSquare} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
