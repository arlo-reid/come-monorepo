"use client";

import { Building2, HouseIcon } from "lucide-react";
import type { Session } from "next-auth";
import type * as React from "react";

import { BaseSidebar, type BaseSidebarProps } from "../../shared/BaseSidebar";
import type { NavItem } from "../../shared/BaseSidebar/nav-main";
import type { Maybe, SanityImageProps } from "@/types";

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: HouseIcon,
    isActive: true,
  },
  {
    title: "Organisations",
    url: "#",
    icon: Building2,
    isActive: true,
    items: [
      {
        title: "List",
        url: "/admin/organisations",
      },
      {
        title: "Create",
        url: "/admin/organisations/create",
      },
    ],
  },
];

interface AdminSidebarProps extends Omit<
  BaseSidebarProps,
  "navItems" | "title" | "subtitle" | "homeUrl"
> {
  session: Session | null;
  logoSquare?: Maybe<SanityImageProps>;
}

export function AdminSidebar({ session, logoSquare, ...props }: AdminSidebarProps) {
  return (
    <BaseSidebar
      session={session}
      navItems={adminNavItems}
      title="T&F"
      subtitle="Admin"
      homeUrl="/admin"
      logoSquare={logoSquare}
      {...props}
    />
  );
}
