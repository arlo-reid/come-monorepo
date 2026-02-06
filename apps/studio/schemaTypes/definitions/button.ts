import { Command } from "lucide-react";
import { defineField, defineType } from "sanity";

import { capitalize, createRadioListLayout } from "../../utils/helper";

const buttonVariants = ["default", "secondary", "outline-solid", "link"];

export const button = defineType({
  name: "button",
  title: "Button",
  type: "object",
  icon: Command,
  fields: [
    defineField({
      name: "variant",
      type: "string",
      initialValue: () => "default",
      options: createRadioListLayout(buttonVariants, {
        direction: "horizontal",
      }),
      validation: (rule) => rule.required().error("Button variant is required"),
    }),
    defineField({
      name: "text",
      title: "Button Text",
      type: "string",
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .max(50)
          .error("Button text must be between 1 and 50 characters"),
    }),
    defineField({
      name: "url",
      title: "Url",
      type: "customUrl",
      validation: (rule) => rule.required().error("Button URL is required"),
    }),
  ],
  preview: {
    select: {
      title: "text",
      variant: "variant",
      externalUrl: "url.external",
      appUrl: "url.app",
      urlType: "url.type",
      internalUrl: "url.internal.slug.current",
      openInNewTab: "url.openInNewTab",
    },
    prepare: ({
      title,
      variant,
      externalUrl,
      urlType,
      internalUrl,
      appUrl,
      openInNewTab,
    }) => {
      const url =
        urlType === "external"
          ? externalUrl
          : urlType === "internal"
            ? internalUrl
            : appUrl;
      const newTabIndicator = openInNewTab ? " ↗" : "";
      const truncatedUrl =
        url?.length > 30 ? `${url.substring(0, 30)}...` : url;

      return {
        title: title || "Untitled Button",
        subtitle: `${capitalize(variant ?? "default")} • ${truncatedUrl}${newTabIndicator}`,
      };
    },
  },
});
