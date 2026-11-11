import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasAnyCredentialAdmin } from "@/server/auth/guards";
import { AdminLoginView } from "@/components/admin/login-form";

export const metadata = { title: "Giriş" };

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");
  // Kurulum kilidi: sistemde şifreli admin hesabı yoksa ekran "İlk kurulum"
  // modunda açılır (owner hesabı oluşturma); varsa normal giriş formu basılır.
  const setupDone = await hasAnyCredentialAdmin();
  return <AdminLoginView mode={setupDone ? "login" : "bootstrap"} />;
}
