import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Button as SanityButtonType } from "@/lib/sanity/sanity.types";
import { cn } from "@/lib/utils";

type SanityButtonWithKey = {
  _key: string;
  href: string | null;
  openInNewTab: boolean | null;
  text: string | null;
} & Partial<SanityButtonType>;

type SanityButtonsProps = {
  buttons?: SanityButtonWithKey[] | null;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "lg" | "default" | "icon" | null | undefined;
};

function SanityButton({
  text,
  href,
  variant = "default",
  className,
  openInNewTab,
  ...props
}: SanityButtonWithKey & ComponentProps<typeof Button>) {
  if (!href) {
    console.log("Link Broken", { text, href, variant, openInNewTab });
    return <Button>Link Broken</Button>;
  }

  return (
    <Button
      variant={variant}
      {...props}
      asChild
      className={cn(
        "rounded-[100px] button border border-[#040407] px-5 py-2 box-border h-10 min-h-10",
        className,
      )}
      size="sm"
    >
      <Link
        href={href || "#"}
        target={openInNewTab ? "_blank" : "_self"}
        aria-label={`Navigate to ${text}`}
        title={`Click to visit ${text}`}
      >
        {text}
      </Link>
    </Button>
  );
}

export function SanityButtons({
  buttons,
  className,
  buttonClassName,
  size = "default",
}: SanityButtonsProps) {
  if (!buttons?.length) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      {buttons.map((button) => (
        <SanityButton
          key={`button-${button._key}`}
          size={size}
          {...button}
          className={buttonClassName}
        />
      ))}
    </div>
  );
}
