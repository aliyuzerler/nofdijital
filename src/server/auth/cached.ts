import "server-only";
import { createAuth, type Auth } from "@/server/auth";

/**
 * createAuth() her istekte DB bağlantısı kurabilir → modül düzeyinde
 * Promise cache. Auth instance değişmez; DB client zaten global cache'li.
 */
const globalForAuth = globalThis as unknown as { nofAuth: Promise<Auth> | undefined };

export function getAuth(): Promise<Auth> {
  globalForAuth.nofAuth ??= createAuth();
  return globalForAuth.nofAuth;
}
