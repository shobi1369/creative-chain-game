"use client";

import { createBrowserClient } from "@supabase/ssr";

export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === "undefined") return "";
          const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
          return match ? decodeURIComponent(match[2]) : "";
        },
      },
    }
  );
