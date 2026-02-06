import { useSanityImage } from "@/hooks/use-sanit-image";
import { PagebuilderType } from "@/types";

import { SanityButtons } from "../sanity-buttons";

type HeroBlockProps = PagebuilderType<"hero">;

export function HeroBlock({ title, subtitle, buttons, image }: HeroBlockProps) {
  const url = useSanityImage(image);

  return (
    <section id="hero" className="h-[calc(100vh-72px)]">
      <div
        style={{
          backgroundImage: `url("${url}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h1 className="text-white leading-[120%] text-[56px] font-bold m-0 text-center">
          {title} <br />
          {subtitle}
        </h1>
        <SanityButtons buttons={buttons} className="mt-8" />
      </div>
    </section>
  );
}
