"use client";

import { useEffect, useState } from "react";
import { SERVICE_OPTIONS } from "@/content/reference-data";
import { toast } from "./toast";

/** İletişim formu — referans davranış + Zod destekli /api/contact (Faz 6). */
export function ContactForm({ preselect }: { preselect?: string }) {
  const [sending, setSending] = useState(false);

  /* Hizmet kartından yönlendirme: seçimi uygula ve forma kaydır */
  useEffect(() => {
    const onService = (e: Event) => {
      const title = (e as CustomEvent<string>).detail;
      const sel = document.getElementById("f4") as HTMLSelectElement | null;
      if (sel) sel.value = title;
      const el = document.getElementById("iletisim");
      if (el) {
        const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: RM ? "auto" : "smooth" });
      }
    };
    window.addEventListener("nof-service", onService);
    return () => window.removeEventListener("nof-service", onService);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const f = e.currentTarget;
    const fd = new FormData(f);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    if (!name || !/\S+@\S+\.\S+/.test(email) || !message) {
      toast("Lütfen ad, geçerli e-posta ve mesaj alanlarını doldurun.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      if (!res.ok) {
        toast(res.status === 429 ? "Çok fazla deneme yaptınız; birazdan tekrar deneyin." : "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      toast("Teşekkürler! Mesajınız alındı.");
      f.reset();
    } catch {
      toast("Bağlantı hatası — lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="ctf" data-r noValidate onSubmit={onSubmit}>
      <div className="r2">
        <div className="fg">
          <label htmlFor="f1">Ad Soyad</label>
          <input id="f1" name="name" required autoComplete="name" defaultValue="" />
        </div>
        <div className="fg">
          <label htmlFor="f2">E-posta</label>
          <input id="f2" name="email" type="email" required autoComplete="email" />
        </div>
      </div>
      <div className="r2">
        <div className="fg">
          <label htmlFor="f3">Telefon</label>
          <input id="f3" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="fg">
          <label htmlFor="f4">İlgilenilen hizmet</label>
          <select id="f4" name="service" defaultValue={preselect ?? ""}>
            <option value="">Seçiniz</option>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="fg">
        <label htmlFor="f5">Mesaj</label>
        <textarea id="f5" name="message" required />
      </div>
      {/* honeypot (docs/05) */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" />
      <button className="btn" type="submit" disabled={sending}>
        {sending ? "Gönderiliyor…" : "Mesajı Gönder"}{" "}
        <svg className="i">
          <use href="#i-send" />
        </svg>
      </button>
    </form>
  );
}
