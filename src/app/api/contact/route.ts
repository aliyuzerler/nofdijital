import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/server/db";
import { contactSubmissions } from "@/server/db/schema";

export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(4000),
  company: z.string().max(0).optional().or(z.literal("")), // honeypot: boş olmalı
});

/** Basit IP bazlı hız limiti (docs/05): dakikada 5 istek. */
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  h.n += 1;
  return h.n > 5;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (limited(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const json = await req.json().catch(() => null);
    const parsed = ContactSchema.safeParse(json);
    if (!parsed.success || parsed.data.company) {
      // Honeypot doluysa da genel hata dön; detay sızmaz.
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }
    const d = parsed.data;

    const db = await getDb();
    await db.insert(contactSubmissions).values({
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      message: d.message,
      ipHash: createHash("sha256").update(ip + (process.env.AUTH_SECRET ?? "")).digest("hex").slice(0, 64),
      userAgentSummary: (req.headers.get("user-agent") ?? "").slice(0, 200),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] hata:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
