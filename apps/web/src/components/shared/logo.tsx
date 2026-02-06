import Image from "next/image";
import Link from "next/link";

import type { Maybe, SanityImageProps } from "@/types";

import { SanityImage } from "@/components/sanity/sanity-image";

interface LogoProps {
  src?: Maybe<string>;
  image?: Maybe<SanityImageProps>;
  alt?: Maybe<string>;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Set to false to render without a link wrapper, or provide a custom href */
  href?: string | false;
}

export function Logo({
  src,
  alt = "logo",
  image,
  width = 170,
  height = 40,
  priority = true,
  href = "/",
}: LogoProps) {
  const imageContent = image ? (
    <SanityImage
      asset={image}
      alt={alt ?? "logo"}
      className={`w-[${width}px] h-[${height}px]`}
      width={width}
      height={height}
      priority={priority}
      loading="eager"
      decoding="sync"
      quality={100}
    />
  ) : src ? (
    <Image
      src={src}
      alt={alt ?? "logo"}
      className={`w-[${width}px] h-[${height}px]`}
      width={width}
      height={height}
      loading="eager"
      priority={priority}
      decoding="sync"
    />
  ) : null;

  if (href === false) {
    return imageContent;
  }

  return (
    <Link href={href} className="">
      {imageContent}
    </Link>
  );
}
