import { toNextJsHandler } from "better-auth/next-js";
import { createAuth, type Auth } from "@/server/auth";

/**
 * Better Auth route handler (GET/POST/PATCH/PUT/DELETE → /api/auth/*).
 * createAuth async olduğu için modül düzeyinde Promise + handler cache.
 */
const globalForAuthRoute = globalThis as unknown as {
  nofAuthHandlers: Promise<{
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
    PATCH: (req: Request) => Promise<Response>;
    PUT: (req: Request) => Promise<Response>;
    DELETE: (req: Request) => Promise<Response>;
  }> | undefined;
};

function getHandlers() {
  globalForAuthRoute.nofAuthHandlers ??= createAuth().then((auth: Auth) => toNextJsHandler(auth));
  return globalForAuthRoute.nofAuthHandlers;
}

export async function GET(req: Request) {
  return (await getHandlers()).GET(req);
}

export async function POST(req: Request) {
  return (await getHandlers()).POST(req);
}

export async function PATCH(req: Request) {
  return (await getHandlers()).PATCH(req);
}

export async function PUT(req: Request) {
  return (await getHandlers()).PUT(req);
}

export async function DELETE(req: Request) {
  return (await getHandlers()).DELETE(req);
}
