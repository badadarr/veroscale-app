import { NextApiRequest, NextApiResponse } from "next";
import { aj, ajAuth, ajEmail, ajAPI } from "./arcjet";

export type ArcjetProtectionLevel = "default" | "auth" | "email" | "api";

export async function withArcjetProtection(
  req: NextApiRequest,
  res: NextApiResponse,
  level: ArcjetProtectionLevel = "default"
) {
  let arcjetInstance;
  
  switch (level) {
    case "auth":
      arcjetInstance = ajAuth;
      break;
    case "email":
      arcjetInstance = ajEmail;
      break;
    case "api":
      arcjetInstance = ajAPI;
      break;
    default:
      arcjetInstance = aj;
  }

  const decision = await arcjetInstance.protect(req);

  if (decision.isDenied()) {
    // Handle rate limiting
    for (const result of decision.results) {
      if (result.reason.isRateLimit()) {
        return res.status(429).json({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: result.reason.resetTime,
        });
      }

      if (result.reason.isBot()) {
        return res.status(403).json({
          error: "Bot detected",
          message: "Automated requests are not allowed.",
        });
      }

      if (result.reason.isEmail()) {
        return res.status(400).json({
          error: "Invalid email",
          message: "Please provide a valid email address.",
        });
      }

      if (result.reason.isShield()) {
        return res.status(403).json({
          error: "Security violation",
          message: "Request blocked for security reasons.",
        });
      }
    }

    return res.status(403).json({
      error: "Request denied",
      message: "Your request has been blocked.",
    });
  }

  return null; // Allow request to continue
}