"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Mirrors src/middleware.ts's isIctExempt — kept in sync with it so an
// already-open tab reacts the instant ICT toggles the block (Convex's live
// query pushes the update over the websocket), not just on the next
// navigation/refresh that would hit the middleware check.
const EXEMPT_PREFIXES = ["/ict", "/support", "/maintenance", "/login"];

function isExemptPath(pathname: string) {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function SiteBlockWatcher() {
  const status = useQuery(api.settings.getSiteBlockStatus);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === undefined) return;

    if (status.blocked && !isExemptPath(pathname)) {
      router.replace(`/maintenance?reason=${encodeURIComponent(status.reason ?? "")}`);
    } else if (!status.blocked && pathname === "/maintenance") {
      // Site came back up while this tab was parked on the maintenance
      // screen — send it home instead of leaving a stale 503 on screen.
      router.replace("/");
    }
  }, [status, pathname, router]);

  return null;
}
