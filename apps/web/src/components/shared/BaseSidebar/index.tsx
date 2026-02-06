"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import type * as React from "react";

import {
  NavMain,
  type NavItem,
} from "@/components/shared/BaseSidebar/nav-main";
import { NavUser } from "@/components/admin/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import type { Maybe, SanityImageProps } from "@/types";

export interface BaseSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session | null;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  homeUrl: string;
  logoSquare?: Maybe<SanityImageProps>;
}

export function BaseSidebar({
  session,
  navItems,
  title,
  subtitle,
  homeUrl,
  logoSquare,
  ...props
}: BaseSidebarProps) {
  const user = session?.user
    ? {
        name: session.user.email?.split("@")[0] ?? "User",
        email: session.user.email ?? "",
        avatar: "/avatars/default.jpg",
      }
    : {
        name: "Guest",
        email: "",
        avatar: "/avatars/default.jpg",
      };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeUrl}>
                {logoSquare && (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                    <Logo
                      alt={title}
                      image={logoSquare}
                      height={32}
                      width={32}
                      href={false}
                    />
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{title}</span>
                  <span className="truncate text-xs">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
