import type { DashboardConfig } from "@/types";

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      href: "/docs",
      title: "Documentation",
    },
    {
      disabled: true,
      href: "/support",
      title: "Support",
    },
  ],
  sidebarNav: [
    {
      href: "/dashboard",
      icon: "home",
      title: "Dashboard",
    },
    {
      href: "/dashboard/billing",
      icon: "billing",
      title: "Billing",
    },
    {
      href: "/dashboard/settings",
      icon: "settings",
      title: "Settings",
    },
    {
      href: "/dashboard/users",
      icon: "users",
      title: "Users",
    },
    {
      href: "/dashboard/organisations",
      icon: "organisation",
      title: "Organisations",
    },
  ],
};
