import type { Metadata } from "next";
import { getSessionUser } from "@/server/auth/guards";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/chrome";
import { Toaster } from "@/components/ui/sonner";

import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "Yönetim Paneli — NOF DİJİTAL",
    template: "%s — NOF Yönetim",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    // Oturum yok: yalnızca çocukları bas (login sayfası kendi görünümünü kurar).
    return (
      <div className="admin-root min-h-screen bg-neutral-950 text-neutral-100">
        {children}
      </div>
    );
  }
  return (
    <>
      <AdminShell user={user}>{children}</AdminShell>
      <Toaster richColors position="top-right" />
    </>
  );
}
