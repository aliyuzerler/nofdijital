import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/guards";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Giriş",
};

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");
  return <LoginForm />;
}
