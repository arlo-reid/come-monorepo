import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { sanityFetch } from "@/lib/sanity/live";
import { queryGlobalSeoSettings, queryNavbarData } from "@/lib/sanity/query";
import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@/lib/sanity/sanity.types";

import { Logo } from "@/components/shared/logo";
import { NavbarClient, NavbarSkeletonResponsive } from "./navbar-client";

export async function NavbarServer() {
  const [navbarData, settingsData, session] = await Promise.all([
    sanityFetch({ query: queryNavbarData }),
    sanityFetch({ query: queryGlobalSeoSettings }),
    getServerSession(authOptions),
  ]);
  return (
    <Navbar
      navbarData={navbarData.data}
      settingsData={settingsData.data}
      session={session}
    />
  );
}

export function Navbar({
  navbarData,
  settingsData,
  session,
}: {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
  session: Session | null;
}) {
  const { siteTitle: settingsSiteTitle, logo } = settingsData ?? {};
  return (
    <section className="navigation h-[72px] sticky top-0 bg-white z-50">
      <nav className="container mx-auto justify-between flex items-center gap-4 h-full p-4">
        {logo && (
          <Logo
            alt={settingsSiteTitle}
            priority
            image={logo}
            height={20}
            width={180}
          />
        )}

        <NavbarClient
          navbarData={navbarData}
          settingsData={settingsData}
          session={session}
        />
      </nav>
    </section>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="h-[72px] py-4">
      <div className="container mx-auto px-4 md:px-6">
        <nav className="grid grid-cols-[auto_1fr] items-center gap-4">
          <div className="h-[40px] w-[170px] rounded animate-pulse bg-muted" />
          <NavbarSkeletonResponsive />
        </nav>
      </div>
    </header>
  );
}
