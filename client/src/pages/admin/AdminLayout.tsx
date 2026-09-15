import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Tag, AppWindow, Key, LogOut, ChevronRight, Shield, Lock, Ticket, UserPlus, HelpCircle, Boxes, Send, Download, KeyRound, Store, Menu, X, Megaphone
} from "lucide-react";
import InteractiveStars from "@/components/InteractiveStars";


const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/resellers", icon: Users, label: "Resellers" },
  { href: "/admin/other-store", icon: Store, label: "Other Store" },
  { href: "/admin/categories", icon: Tag, label: "Categorias" },
  { href: "/admin/apps", icon: AppWindow, label: "Apps" },
  { href: "/admin/keys", icon: Key, label: "License Keys" },
  { href: "/admin/api-keys", icon: KeyRound, label: "API Keys" },
  { href: "/admin/stock", icon: Boxes, label: "Estoque" },
  { href: "/admin/manual-delivery", icon: Send, label: "Entrega Manual" },
  { href: "/admin/downloads", icon: Download, label: "Downloads" },
  { href: "/admin/reseller-info", icon: Megaphone, label: "Reseller Info" },
  { href: "/admin/tickets", icon: Ticket, label: "Tickets" },
  { href: "/admin/applications", icon: UserPlus, label: "Aplicações" },
  { href: "/admin/support", icon: HelpCircle, label: "Dúvidas" },
  { href: "/admin/ip-whitelist", icon: Shield, label: "Whitelist IPs" },
  { href: "/admin/security", icon: Lock, label: "Segurança" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isLoading } = trpc.auth.session.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { toast.success("Logout realizado"); navigate("/"); },
  });

  useEffect(() => {
    if (!isLoading && (!session || session.role !== "admin")) navigate("/");
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="galaxy-bg"><div className="galaxy-stars" /></div>
        <div className="relative z-10 flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="galaxy-bg">
        <div className="galaxy-shooting-star" />
        <div className="galaxy-shooting-star" style={{ animationDelay: "9s", top: "55%" }} />
      </div>
      <InteractiveStars />

      {/* Top header with hamburger */}
      <header
        className="relative z-30 border-b sticky top-0"
        style={{
          background: "rgba(5,5,5,0.88)",
          backdropFilter: "blur(24px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between px-4 h-14">
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-gray-400 text-sm hidden sm:inline">{session?.username}</span>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
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
          width: 260,
          background: "rgba(8,6,18,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <p className="text-white font-black text-base leading-none tracking-[0.2em]">SELLERS</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Shield className="w-3 h-3 text-emerald-500" />
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto h-[calc(100%-200px)]">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 group"
                  style={active ? {
                    background: "rgba(16,185,129,0.14)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#6ee7b7",
                  } : {
                    color: "#6b7280",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.color = "#d1d5db"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#6b7280"; } }}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? "bg-emerald-500/20" : "bg-white/[0.03]"}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? "#34d399" : "inherit" }} />
                  </div>
                  <span className="text-sm font-medium flex-1">{label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(110,231,183,0.7)" }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-white/[0.06] absolute bottom-0 w-full" style={{ background: "rgba(8,6,18,0.95)" }}>
          <div className="rounded-2xl p-3 mb-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold uppercase"
                style={{ background: "rgba(16,185,129,0.18)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                {session?.username?.[0] ?? "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{session?.username}</p>
                <p className="text-[10px]" style={{ color: "#059669" }}>Administrator</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-gray-500 transition-all text-sm"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
