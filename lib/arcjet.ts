import arcjet, {
  detectBot,
  validateEmail,
  shield,
  fixedWindow,
} from "@arcjet/next";

// Base Arcjet configuration
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({
      mode: "LIVE",
      window: "15m",
      max: 100,
    }),
    // Bot detection
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow search engines
    }),
    // Shield protection against common attacks
    shield({
      mode: "LIVE",
    }),
  ],
});

//  login attempts - 5 attempts per 15 minutes
export const ajAuth = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({
      mode: "LIVE",
      window: "15m",
      max: 5,
    }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
    shield({
      mode: "LIVE",
    }),
  ],
});

// Email validation for registration
export const ajEmail = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    validateEmail({
      mode: "LIVE",
      block: ["DISPOSABLE", "INVALID"],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 10,
    }),
  ],
});

// API rate limiting for data operations
export const ajAPI = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 200,
    }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
  ],
});
