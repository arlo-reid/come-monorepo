import { getImageDimensions } from "@sanity/asset-utils";

import { urlFor } from "@/lib/sanity/client";
import { SanityImageProps } from "@/types";

export function useSanityImage(
  image: SanityImageProps | null,
  width?: number,
  height?: number,
  quality = 75,
): string | undefined {
  let url: string | undefined;
  if (image?.asset) {
    const dimensions = getImageDimensions(image.asset);
    url = urlFor({ ...image, _id: image?.asset?._ref })
      .size(
        width ?? Number(dimensions.width),
        height ?? Number(dimensions.height),
      )
      .dpr(2)
      .auto("format")
      .quality(Number(quality))
      .url();
  }

  return url;
}
