import { useSanityImage } from "@/hooks/use-sanit-image";
import type { PagebuilderType } from "@/types";

import { SanityButtons } from "../sanity-buttons";

export type CTABlockProps = PagebuilderType<"cta">;

export function CTABlock({ subtitle, title, buttons, image }: CTABlockProps) {
  const url = useSanityImage(image);
  return (
    <section
      id="features"
      className="py-16 md:py-[112px] px-5 bg-white w-full mx-auto"
    >
      <div
        className="container mx-auto"
        style={{
          backgroundImage: image ? `url(${url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="rounded-lg text-center mx-auto w-full py-8 md:py-16 text-white">
          <h2 className="text-3xl font-semibold md:text-5xl text-balance mb-6 text-[48px] leading-[120%]">
            {title}
          </h2>
          <h3 className="mb-8 text-[18px]">{subtitle}</h3>
          <div className="flex justify-center">
            <SanityButtons buttons={buttons} />
          </div>
        </div>
      </div>
    </section>
  );
}
