"use client";

import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8254D8] text-lg font-bold text-white" aria-hidden>
            N
          </span>
          <div>
            <h1 className="text-xl font-semibold text-white">NOF DİJİTAL Yönetim</h1>
            <p className="mt-1 text-sm text-neutral-400">Devam etmek için giriş yapın.</p>
          </div>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          aria-label="Giriş formu"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300">
              E-posta
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@nofdigital.com"
              className="border-white/15 bg-white/5 text-neutral-100 placeholder:text-neutral-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-300">
              Şifre
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="border-white/15 bg-white/5 text-neutral-100"
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full bg-[#8254D8] text-white hover:bg-[#7143C2]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Giriş yap
          </Button>
        </form>
      </div>
    </div>
  );
}
