"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  ListOrdered,
  LogOut,
  Menu,
  Newspaper,
  ScrollText,
  Search,
  Settings,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor";
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

interface NavSection {
  label: string | null;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Panel", icon: LayoutDashboard }],
  },
  {
    label: "İçerik",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/media", label: "Medya", icon: ImageIcon },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/admin/pages/home", label: "Ana Sayfa", icon: LayoutTemplate },
      { href: "/admin/services", label: "Hizmetler", icon: Briefcase },
      { href: "/admin/process", label: "Süreç", icon: ListOrdered },
      { href: "/admin/portfolio", label: "Portfolyo", icon: Images },
      // Menü paneli kaldırıldı (12.11.2026): manuel sekmeler yönlendirme
      // yapamıyordu; menü artık sitede statik (site-header/site-footer).
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/settings/general", label: "Genel Ayarlar", icon: Settings, ownerOnly: true },
      { href: "/admin/settings/seo", label: "SEO", icon: Search, ownerOnly: true },
      { href: "/admin/audit-log", label: "Denetim Kaydı", icon: ScrollText, ownerOnly: true },
    ],
  },
];

function NavLinks({ role, onNavigate }: { role: "owner" | "editor"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Yönetim menüsü" className="flex flex-col">
      {NAV_SECTIONS.map((section, si) => {
        const items = section.items.filter((n) => !n.ownerOnly || role === "owner");
        if (!items.length) return null;
        return (
          <div key={section.label ?? `s${si}`}>
            {section.label ? (
              <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                {section.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active =
                  item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-[#9335FF]/15 font-semibold text-white shadow-[inset_2px_0_0_#9335FF]"
                        : "font-medium text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4 shrink-0", active ? "text-[#B385FF]" : "text-neutral-500")}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9335FF] text-sm font-bold text-white" aria-hidden>
        N
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">NOF DİJİTAL</p>
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Yönetim Paneli</p>
      </div>
    </div>
  );
}

async function handleSignOut() {
  try {
    await signOut();
  } finally {
    window.location.assign("/admin/login");
  }
}

function UserBox({ user }: { user: ShellUser }) {
  return (
    <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-neutral-200" aria-hidden>
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-200">{user.name}</p>
          <p className="truncate text-xs text-neutral-500">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void handleSignOut()}
        className="w-full justify-start text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
      >
        <LogOut className="h-4 w-4" /> Çıkış yap
      </Button>
    </div>
  );
}

function MobileMenu({ user, open, onOpenChange }: { user: ShellUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menüyü aç">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-6 bg-[#15131b] px-4 py-6">
        <SheetTitle className="sr-only">Yönetim menüsü</SheetTitle>
        <Brand />
        <div className="admin-scroll flex-1 overflow-y-auto">
          <NavLinks role={user.role} onNavigate={() => onOpenChange(false)} />
        </div>
        <UserBox user={user} />
      </SheetContent>
    </Sheet>
  );
}

/** Koyu sidebar + üst bar + mobil çekmece. */
export function AdminShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-root min-h-screen bg-neutral-100 text-neutral-900">
      {/* Masaüstü sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col gap-6 bg-[#15131b] px-4 py-6 lg:flex">
        <Brand />
        <div className="admin-scroll flex-1 overflow-y-auto">
          <NavLinks role={user.role} />
        </div>
        <UserBox user={user} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <MobileMenu user={user} open={mobileOpen} onOpenChange={setMobileOpen} />
          <p className="text-sm font-medium text-neutral-500">NOF DİJİTAL yönetim</p>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="border-[#9335FF]/40 text-[#8426F2]">
              {user.role === "owner" ? "Sahip" : "Editör"}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                Siteyi gör <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
