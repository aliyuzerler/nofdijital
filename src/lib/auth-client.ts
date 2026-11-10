"use client";

import { createAuthClient } from "better-auth/react";

/** Better Auth istemcisi — relative baseURL (aynı origin, Caddy gateway uyumlu). */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
