import { Suspense } from "react";

import {
  NavbarServer,
  NavbarSkeleton,
} from "@/components/website/layout/navbar";
import {
  FooterServer,
  FooterSkeleton,
} from "@/components/sanity/blocks/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarServer />
      </Suspense>
      {children}
      <Suspense fallback={<FooterSkeleton />}>
        <FooterServer />
      </Suspense>
    </>
  );
}
