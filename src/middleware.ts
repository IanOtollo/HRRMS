import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../convex/_generated/api";

const isLoginPage = createRouteMatcher(["/login"]);
// /support/new must stay reachable logged-out — it's the only path to file
// a forgot-password ticket, which by definition happens without a session —
// but unlike /login it should NOT bounce an already-authenticated visitor
// away, since logged-in users file tickets from here too.
const isPublicPage = createRouteMatcher(["/login", "/support/new"]);
// Reachable even while the site is blocked — ICT Support's own working area,
// the public support/ticket surface, the maintenance page itself, and /login
// (without it, whoever blocked the site gets logged out — 6-minute idle
// timeout included — and can never sign back in to lift the block).
const isIctExempt = createRouteMatcher(["/ict", "/ict/(.*)", "/support", "/support/(.*)", "/maintenance", "/login"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (!isIctExempt(request)) {
    const { blocked, reason } = await fetchQuery(api.settings.getSiteBlockStatus, {}).catch(() => ({
      blocked: false,
      reason: "",
    }));
    if (blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.searchParams.set("reason", reason);
      // Real 503, not just a maintenance-looking page at 200 — matters for
      // uptime monitors and anything else checking the actual status code.
      return NextResponse.rewrite(url, { status: 503 });
    }
  }

  const authenticated = await convexAuth.isAuthenticated();

  if (!isPublicPage(request) && !authenticated) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  if (isLoginPage(request) && authenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
