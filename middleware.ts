import { NextRequest, NextResponse } from "next/server";
import arcjet, { createMiddleware, fixedWindow, detectBot, shield } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Global rate limiting
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 1000, // Higher limit for general browsing
    }),
    // Bot detection for all routes
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    // Shield protection
    shield({
      mode: "LIVE",
    }),
  ],
});

// Create Arcjet middleware
const withArcjet = createMiddleware(aj);

export default withArcjet;

export const config = {
  // Match all request paths except static files and images
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled individually)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};