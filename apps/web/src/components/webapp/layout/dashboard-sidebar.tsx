"use client";

import { HouseIcon } from "lucide-react";
import type { Session } from "next-auth";
import type * as React from "react";

import {
  BaseSidebar,
  type BaseSidebarProps,
} from "@/components/shared/BaseSidebar";
import type { NavItem } from "@/components/shared/BaseSidebar/nav-main";
import type { Maybe, SanityImageProps } from "@/types";

const dashboardNavItems: NavItem[] = [
  {
    title: "Home",
    url: "/dashboard",
    icon: HouseIcon,
    isActive: true,
  },
];

interface DashboardSidebarProps extends Omit<
  BaseSidebarProps,
  "navItems" | "title" | "subtitle" | "homeUrl"
> {
  session: Session | null;
  logoSquare?: Maybe<SanityImageProps>;
}

export function DashboardSidebar({ session, logoSquare, ...props }: DashboardSidebarProps) {
  return (
    <BaseSidebar
      session={session}
      navItems={dashboardNavItems}
      title="T&F"
      subtitle="Dashboard"
      homeUrl="/dashboard"
      logoSquare={logoSquare}
      {...props}
    />
  );
}
