
"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

type Props = {
  logoUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const backendBase = (
  process.env.NEXT_PUBLIC_FOOTBALLSIM_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5295"
).replace(/\/+$/, "");

function resolveLogoUrl(
  value?: string | null
): string | null {
  if (!value?.trim()) return null;

  const logo = value.trim().replace(/\\/g, "/");

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  if (
    logo.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(logo)
  ) {
    return null;
  }

  try {
    return new URL(
      logo.startsWith("/") ? logo : `/${logo}`,
      `${backendBase}/`
    ).toString();
  } catch {
    return null;
  }
}

const dimensions = {
  sm: {
    wrapper: "h-10 w-10",
    image: "h-8 w-8",
  },
  md: {
    wrapper: "h-12 w-12",
    image: "h-10 w-10",
  },
  lg: {
    wrapper: "h-16 w-16",
    image: "h-14 w-14",
  },
};

export function ClubCrest({
  logoUrl,
  name,
  size = "md",
}: Props) {
  const [failedUrl, setFailedUrl] =
    useState<string | null>(null);

  const url = resolveLogoUrl(logoUrl);
  const showImage = !!url && failedUrl !== url;

  return (
    <div
      className={`flex ${dimensions[size].wrapper} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#b7f56a]/15 bg-[#b7f56a]/[0.06]`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${name} crest`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`${dimensions[size].image} object-contain`}
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <Shield
          size={size === "lg" ? 26 : 20}
          className="text-[#b7f56a]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
