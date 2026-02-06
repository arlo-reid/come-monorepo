import Link from "next/link";

import { sanityFetch } from "@/lib/sanity/live";
import { queryFooterData, queryGlobalSeoSettings } from "@/lib/sanity/query";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@/lib/sanity/sanity.types";

import { Logo } from "@/components/shared/logo";

interface FooterProps {
  data: NonNullable<QueryFooterDataResult>;
  settingsData: NonNullable<QueryGlobalSeoSettingsResult>;
}

export async function FooterServer() {
  const [response, settingsResponse] = await Promise.all([
    sanityFetch({
      query: queryFooterData,
    }),
    sanityFetch({
      query: queryGlobalSeoSettings,
    }),
  ]);

  if (!response?.data || !settingsResponse?.data) return <FooterSkeleton />;
  return <Footer data={response.data} settingsData={settingsResponse.data} />;
}

export function FooterSkeleton() {
  return (
    <section className="mt-16 pb-8 bg-[#f2f2f2]">
      <div className="container mx-auto px-4 md:px-6">
        <footer className="h-[500px] lg:h-auto">
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <div className="h-[40px] w-[80px] bg-muted rounded animate-pulse" />
                </span>
                <div className="mt-6 h-16 w-full bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {[1, 2, 3].map((col) => (
                <div key={col}>
                  <div className="mb-6 h-6 w-24 bg-muted rounded animate-pulse" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-4 w-full bg-muted rounded animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="flex justify-center gap-4 lg:justify-start">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

function Footer({ data, settingsData }: FooterProps) {
  const { columns } = data;
  const { siteTitle, logo } = settingsData;
  const year = new Date().getFullYear();

  return (
    <section className="py-16 md:py-[112px] px-5 w-full mx-auto bg-[#f2f2f2]">
      <div className="container mx-auto">
        <footer className="h-[500px] lg:h-auto flex flex-col items-center">
          <Logo image={logo} alt={siteTitle} priority height={20} width={180} />
          {columns?.map((column) => {
            return (
              <div
                key={column.title}
                className="flex flex-col md:flex-row gap-8 mt-8 text-center"
              >
                {column?.links?.map((link) => (
                  <Link
                    href={link.href || ""}
                    key={link.name}
                    className="text-sm font-semibold"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            );
          })}
          <div className="mt-20 border-t pt-8 w-full">
            <div className="flex flex-col justify-between gap-4  text-center text-sm font-normal text-muted-foreground lg:flex-row lg:items-center lg:text-left mx-auto max-w-7xl px-4 md:px-6">
              <p>© {year} Thought&Function Ltd. All rights reserved.</p>
              <ul className="flex justify-center gap-4 lg:justify-start">
                <li className="underline">
                  <Link href="/terms-of-service">Terms of Service</Link>
                </li>
                <li className="underline">
                  <Link href="/privacy">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
