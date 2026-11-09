import "server-only";
import { getDb } from "@/server/db";
import { siteSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Public site ayarları (site_settings tablosu, key→value_json).
 * Faz 5'te admin bu tabloyu yönetir; boşsa güvenli varsayılanlar döner.
 */

export interface PublicSettings {
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  social: { instagram: string; linkedin: string; youtube: string };
}

const DEFAULTS: PublicSettings = {
  whatsappNumber: "",
  phone: "",
  email: "",
  address: "",
  social: { instagram: "", linkedin: "", youtube: "" },
};

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const db = await getDb();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "public"));
    const v = rows[0]?.valueJson as Partial<PublicSettings> | undefined;
    if (!v) return DEFAULTS;
    return {
      ...DEFAULTS,
      ...v,
      social: { ...DEFAULTS.social, ...(v.social ?? {}) },
    };
  } catch (e) {
    // DB hazır değilken public sayfa çökmesin (geliştirme güvenliği).
    console.error("[settings] okunamadı:", e instanceof Error ? e.message : e);
    return DEFAULTS;
  }
}
