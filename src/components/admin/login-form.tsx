"use client";

import { useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth-client";

/**
 * Admin giriş ekranı — site tasarım diliyle (koyu zemin #15131b, marka moru
 * #9335FF, Bricolage başlık, DM Sans gövde, beyaz logo chip'i).
 *
 * İki mod:
 *  - "login"     : normal giriş (şifreli admin hesabı varsa)
 *  - "bootstrap" : ilk kurulum — hiç şifreli admin yokken owner hesabı oluşturur
 *                  (/api/admin/bootstrap; rate limit 3 istek/saat, tek seferlik).
 *
 * Stiller admin.css'teki .alx-* bloğundadır; public site CSS'ine ve diğer admin
 * sayfalarına dokunmaz (izole prefix kuralı).
 */

type Mode = "login" | "bootstrap";

export function AdminLoginView({ mode }: { mode: Mode }) {
  const [view, setView] = useState<Mode>(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await signIn.email({ email: email.trim(), password });
      if (res?.error) {
        setError("E-posta veya şifre hatalı.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function submitBootstrap(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        // Kurulum daha önce tamamlanmışsa normal giriş formuna dön.
        if (res.status === 409) {
          setView("login");
          setInfo("Kurulum daha önce tamamlanmış görünüyor. Lütfen giriş yapın.");
        } else {
          setError(data?.error ?? "Kurulum tamamlanamadı. Lütfen tekrar deneyin.");
        }
        return;
      }
      // Hesap oluşturuldu → otomatik giriş
      const li = await signIn.email({ email: email.trim(), password });
      if (li?.error) {
        setView("login");
        setInfo("Hesabınız oluşturuldu. Lütfen e-posta ve şifrenizle giriş yapın.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Kurulum tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const isSetup = view === "bootstrap";

  return (
    <div className="alx-root">
      <div className="alx-glow" aria-hidden />
      <div className="alx-zone">
        <div className="alx-brand">
          <span className="alx-logo">
            <img src="/assets/logo.png" alt="NOF DİJİTAL" />
          </span>
          <span className="alx-eyb">Yönetim Paneli</span>
          <h1 className="alx-title">
            {isSetup ? (
              <>
                İlk kurulum: <em>owner hesabı</em>
              </>
            ) : (
              <>
                Yönetim paneline <em>giriş</em>
              </>
            )}
          </h1>
          <p className="alx-sub">
            {isSetup
              ? "Sadece ilk kez görünür: kendi e-posta ve şifrenizle yetkili hesabınızı oluşturun."
              : "Devam etmek için hesabınıza giriş yapın."}
          </p>
        </div>

        <form
          className="alx-card"
          onSubmit={isSetup ? submitBootstrap : submitLogin}
          aria-label={isSetup ? "İlk kurulum formu" : "Giriş formu"}
        >
          {isSetup ? (
            <div className="alx-field">
              <label className="alx-label" htmlFor="alx-name">
                İsim
              </label>
              <input
                id="alx-name"
                className="alx-input"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
              />
            </div>
          ) : null}

          <div className="alx-field">
            <label className="alx-label" htmlFor="alx-email">
              E-posta
            </label>
            <input
              id="alx-email"
              className="alx-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@nofdigital.com"
            />
          </div>

          <div className="alx-field">
            <label className="alx-label" htmlFor="alx-password">
              Şifre
            </label>
            <input
              id="alx-password"
              className="alx-input"
              type="password"
              autoComplete={isSetup ? "new-password" : "current-password"}
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 10 karakter"
            />
            {isSetup ? <small className="alx-hint">En az 10 karakter olmalı. Bunu yalnız siz bilmelisiniz.</small> : null}
          </div>

          {error ? (
            <p role="alert" className="alx-err">
              {error}
            </p>
          ) : null}
          {info && !error ? (
            <p role="status" className="alx-ok">
              {info}
            </p>
          ) : null}

          <button className="alx-btn" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="alx-spin" size={17} aria-hidden />
            ) : isSetup ? (
              <ShieldCheck size={17} aria-hidden />
            ) : (
              <LogIn size={17} aria-hidden />
            )}
            {isSetup ? "Hesabı Oluştur ve Giriş Yap" : "Giriş Yap"}
          </button>

          <p className="alx-note">
            {isSetup
              ? "Bu ekran, sistemde şifreli yönetici hesabı bulunmadığı için açıldı; kurulumdan sonra normal giriş ekranına döner."
              : "Bu panel NOF DİJİTAL içerik yönetim sistemiyle çalışır."}
          </p>
        </form>

        <p className="alx-foot">© {new Date().getFullYear()} NOF DİJİTAL</p>
      </div>
    </div>
  );
}
