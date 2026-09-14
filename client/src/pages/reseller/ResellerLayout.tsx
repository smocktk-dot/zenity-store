import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, AppWindow, Key, LogOut, Shield, Ticket, BarChart3, Menu, X, LayoutDashboard } from "lucide-react";
import InteractiveStars from "@/components/InteractiveStars";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";


export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isLoading } = trpc.auth.session.useQuery(undefined, { retry: false });
  const { t } = useLanguage();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { toast.success(t.nav_logout_success); navigate("/"); },
  });

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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="galaxy-bg"><div className="galaxy-stars" /></div>
        <div className="relative z-10 flex items-center gap-3 text-gray-400">
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
  const isOther = resellerSession?.resellerType === "other";
  const displayUsername = session?.username ?? "User";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="galaxy-bg">
        <div className="galaxy-shooting-star" />
        <div className="galaxy-shooting-star" style={{ animationDelay: "10s", top: "60%" }} />
      </div>
      <InteractiveStars />

      {/* Top Header */}
      <header
        className="relative z-30 border-b sticky top-0"
        style={{
          background: "rgba(5,5,5,0.88)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Left: Menu button + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-white font-black text-sm tracking-[0.2em]">SELLERS</span>
          </div>

          {/* Right: language + badges + user */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {isAdmin && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}
              >
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}

            {resellerSession && isCredits && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
                style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}
              >
                {parseFloat((resellerSession as any).credits ?? "0").toFixed(2)} cr
              </div>
            )}
            {resellerSession && isPercentage && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}
              >
                {parseFloat((resellerSession as any).discountPercent ?? "0").toFixed(0)}% {t.general_discount}
              </div>
            )}
            {resellerSession && isOther && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
              >
                {t.general_other_store}
              </div>
            )}

            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                style={{ background: isAdmin ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)", color: "#34d399" }}
              >
                {displayUsername[0]}
              </div>
              <span className="text-gray-300 text-sm">{displayUsername}</span>
            </div>

            <button
              onClick={() => logout.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 transition-all text-sm"
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.nav_logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
          style={{ backdropFilter: "blur(6px)" }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: 280,
          background: "rgba(8,8,10,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="text-white font-black text-sm tracking-[0.2em]">SELLERS</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/reseller" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm"
                  style={active ? {
                    background: "rgba(16,185,129,0.15)",
                    color: "#6ee7b7",
                    border: "1px solid rgba(16,185,129,0.2)",
                  } : {
                    color: "#6b7280",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.color = "#d1d5db"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#6b7280"; } }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin">
              <div
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-sm"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  color: "#34d399",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(16,185,129,0.25)"; (e.currentTarget as HTMLDivElement).style.color = "#6ee7b7"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(16,185,129,0.12)"; (e.currentTarget as HTMLDivElement).style.color = "#34d399"; }}
              >
                <Shield className="w-4 h-4" />
                {t.nav_admin_panel}
              </div>
            </Link>
          )}
        </nav>
      </aside>

      <main className="relative z-10 p-6">{children}</main>
    </div>
  );
}
