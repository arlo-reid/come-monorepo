"use client";

import type { PagebuilderType } from "@/types";

import { RichText } from "./richtext";

type RichTextBlockProps = PagebuilderType<"richTextBlock">;

export function RichTextBlock({ title, subTitle, body }: RichTextBlockProps) {
  return (
    <section className="px-4 my-6 md:my-16">
      <div className="relative container mx-auto px-4 md:px-8 py-8 ">
        <div className="relative z-10 mx-auto">
          <h2 className=" text-center mb-4 text-xl font-semibold text-gray-900 dark:text-neutral-300 sm:text-3xl md:text-5xl text-balance">
            {title}
          </h2>
          {subTitle && (
            <RichText
              richText={subTitle}
              className="mb-6 text-sm text-gray-600 sm:mb-8 text-balance sm:text-base dark:text-neutral-300"
            />
          )}
          {body && (
            <RichText
              richText={body}
              className="mt-3 text-sm text-gray-800 opacity-80 sm:mt-4 dark:text-neutral-300"
            />
          )}
        </div>
      </div>
    </section>
  );
}
