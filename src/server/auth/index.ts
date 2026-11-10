import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/server/db";
import { user, session, account, verification } from "@/server/db/schema";

/**
 * Auth facade (ADR 0001-4): Better Auth + Drizzle. Genel kayıt kapalı;
 * owner hesabı yalnızca bootstrap scriptiyle açılır.
 */
export async function createAuth() {
  const db = await getDb();
  return betterAuth({
    secret: process.env.AUTH_SECRET,
    // BaseURL APP_URL'den gelir; yoksa better-auth localhost:3000'e düşer ve
    // farklı port/host'tan gelen tarayıcı istekleri INVALID_ORIGIN (403) alır.
    baseURL: process.env.APP_URL,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "editor", input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8, // 8 saat
      updateAge: 60 * 30,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      cookiePrefix: "nof",
      useSecureCookies: process.env.NODE_ENV === "production" && process.env.APP_URL?.startsWith("https"),
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
    },
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;
