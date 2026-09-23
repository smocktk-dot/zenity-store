import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User,
  AppWindow,
  Key,
  Shield,
  Ticket,
  BarChart3,
  Menu,
  X,
  ExternalLink,
  Search,
  ShoppingCart,
  Bell,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import UserMenuDropdown from "@/components/UserMenuDropdown";

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isLoading } = trpc.auth.session.useQuery(undefined, { retry: false });
  // Live balance check
  const { data: liveProfile } = trpc.reseller.profile.useQuery(undefined, {
    enabled: session?.role === "reseller",
    retry: false,
  });
  const { t } = useLanguage();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success(t.nav_logout_success);
      navigate("/");
    },
  });

  // Global Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/reseller/apps");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const navItems = [
    { href: "/reseller", icon: User, label: t.nav_profile },
    { href: "/reseller/apps", icon: AppWindow, label: t.nav_apps },
    { href: "/reseller/keys", icon: Key, label: t.nav_my_keys },
    { href: "/reseller/tickets", icon: Ticket, label: t.nav_tickets },
    ...(session?.canCreateSubResellers ? [{ href: "/reseller/stats", icon: BarChart3, label: t.nav_stats }] : []),
  ];

  // Allow both resellers and admins to access the reseller panel
  useEffect(() => {
    if (!isLoading && (!session || (session.role !== "reseller" && session.role !== "admin"))) {
      navigate("/");
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020403] relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3 text-emerald-400 font-medium text-sm">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          {t.nav_loading}
        </div>
      </div>
    );
  }

  const isAdmin = session?.role === "admin";
  const resellerSession = session?.role === "reseller" ? session : null;
  const isCredits = resellerSession?.resellerType === "credits";
  const isPercentage = resellerSession?.resellerType === "percentage";
  const isUnlimited = resellerSession?.resellerType === "unlimited";
  const displayUsername = session?.username ?? "User";

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#030305] text-white">
      {/* Background: clean subtle grid overlay identical to LoginPage */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at 50% 30%, black 60%, transparent 95%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 30%, black 60%, transparent 95%)",
        }}
      />

      {/* Top Header - clean, minimal, monochrome enterprise bar */}
      <header
        className="relative z-30 border-b sticky top-0"
        style={{
          background: "rgba(3, 3, 5, 0.88)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-8 h-16">
          {/* Left: Menu button + Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex lg:hidden items-center justify-center text-zinc-400 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              aria-label="Abrir menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo Lockup */}
            <Link href="/reseller">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <span className="font-mono font-bold text-xs text-white">VG</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm tracking-wide leading-none">VG SELLERS</span>
                  <span className="text-[10px] tracking-wider text-zinc-500 font-medium uppercase mt-0.5">
                    Console do Revendedor
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links - clean monochrome pill */}
            <nav className="hidden lg:flex items-center gap-1 ml-6 pl-6 border-l border-white/[0.06]">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = location === href || (href !== "/reseller" && location.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        active
                          ? "bg-white/[0.08] text-white border border-white/[0.12]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: search + cart + language + separator + bell + user menu trigger (as in image) */}
          <div className="flex items-center gap-2 sm:gap-2.5 relative">
            {/* Search shortcut button (Ctrl K) */}
            <button
              onClick={() => navigate("/reseller/apps")}
              className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
              title="Buscar softwares (Ctrl + K)"
              type="button"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-400">Ctrl K</span>
            </button>

            {/* Cart / Store icon */}
            <Link href="/reseller/apps">
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                title="Catálogo de Apps"
                type="button"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* White dot separator */}
            <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:inline-block" />

            {/* Notification Bell */}
            <button
              onClick={() => toast.info("Você não possui notificações pendentes.")}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
              title="Notificações"
              type="button"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>

            {/* Status badges */}
            {isAdmin && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#d4d4d8",
                }}
              >
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Admin</span>
              </div>
            )}

            {resellerSession && isCredits && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#f4f4f5",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{parseFloat((liveProfile as any)?.credits ?? (resellerSession as any)?.credits ?? "0").toFixed(2)} cr</span>
              </div>
            )}

            {resellerSession && isPercentage && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#f4f4f5",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{parseFloat((resellerSession as any).discountPercent ?? "0").toFixed(0)}% desc</span>
              </div>
            )}

            {resellerSession && isUnlimited && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  color: "#c4b5fd",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>Unlimited</span>
              </div>
            )}

            {/* User Avatar Menu Trigger (matching Image 1!) */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                userMenuOpen
                  ? "bg-white/[0.1] text-white border border-white/[0.2]"
                  : "bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
              }`}
              title="Menu do Usuário"
              aria-label="Menu do Usuário"
              type="button"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Floating User Profile Dropdown Popover */}
            <UserMenuDropdown
              open={userMenuOpen}
              onClose={() => setUserMenuOpen(false)}
              username={displayUsername}
              email={session?.email || undefined}
              resellerType={resellerSession?.resellerType}
              isAdmin={isAdmin}
              onLogout={() => logout.mutate()}
            />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: 290,
          background: "rgba(6, 10, 8, 0.96)",
          borderRight: "1px solid rgba(52,211,153,0.18)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs text-white"
              style={{
                background: "rgba(16,185,129,0.25)",
                border: "1px solid rgba(52,211,153,0.4)",
              }}
            >
              VG
            </div>
            <span className="text-white font-extrabold text-xs tracking-[0.16em]">VG SELLERS</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reseller Info Mini Card in drawer */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">Conta Conectada</p>
          <p className="text-white text-sm font-bold mt-0.5">{displayUsername}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">
              {isPercentage ? "Reseller Porcentagem" : isCredits ? "Reseller Créditos" : isUnlimited ? "Reseller Unlimited" : "Reseller Autorizado"}
            </span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/reseller" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-xs font-semibold ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin">
              <div
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-xs font-semibold"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <Shield className="w-4 h-4" />
                <span>{t.nav_admin_panel}</span>
              </div>
            </Link>
          )}
        </nav>

        {/* Footer in Drawer */}
        <div className="absolute bottom-4 left-4 right-4 pt-3 border-t border-white/[0.06]">
          <a
            href="https://discord.gg/vgseller"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 transition-all text-xs font-semibold"
          >
            <span>Suporte Discord</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      <main className="relative z-10 px-4 sm:px-8 py-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
