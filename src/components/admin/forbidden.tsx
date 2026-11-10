import type { AdminRole } from "@/server/auth/guards";

/** 403 arayüzü — guard rol kontrolü geçemeyen admin sayfalarında gösterilir. */
export function Forbidden({ role }: { role?: AdminRole }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl" aria-hidden>
        🚫
      </span>
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Bu alana erişim yetkiniz yok</h1>
        <p className="mt-1 max-w-md text-sm text-neutral-500">
          Bu bölümü yalnızca sahip (owner) rolündeki kullanıcılar görüntüleyebilir.
          {role === "editor" ? " Şu anki rolünüz: editör." : ""}
        </p>
      </div>
    </div>
  );
}
