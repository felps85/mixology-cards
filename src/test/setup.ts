import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => {
  return {
    default: function NextImage({
      alt,
      ...props
    }: React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      sizes?: string;
    }) {
      const safeProps = { ...props } as Record<string, unknown>;
      delete safeProps.fill;
      delete safeProps.priority;
      delete safeProps.sizes;
      return React.createElement("img", { alt: alt ?? "", ...safeProps });
    }
  };
});

vi.mock("next/link", () => {
  return {
    default: function NextLink({
      href,
      children,
      ...props
    }: {
      href: string | { pathname?: string; query?: Record<string, unknown> };
      children: React.ReactNode;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
      const resolvedHref =
        typeof href === "string" ? href : href.pathname ?? "/";
      return React.createElement("a", { href: resolvedHref, ...props }, children);
    }
  };
});
