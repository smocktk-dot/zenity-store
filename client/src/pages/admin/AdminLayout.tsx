import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Tag, AppWindow, Key, LogOut, ChevronRight, Shield, Lock, Ticket, UserPlus, HelpCircle, Boxes, Send, Download, KeyRound
} from "lucide-react";
import InteractiveStars from "@/components/InteractiveStars";

const LOGO_URL = "/logo.png";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/resellers", icon: Users, label: "Resellers" },
  { href: "/admin/categories", icon: Tag, label: "Categorias" },
  { href: "/admin/apps", icon: AppWindow, label: "Apps" },
  { href: "/admin/keys", icon: Key, label: "License Keys" },
  { href: "/admin/api-keys", icon: KeyRound, label: "API Keys" },
  { href: "/admin/stock", icon: Boxes, label: "Estoque" },
  { href: "/admin/manual-delivery", icon: Send, label: "Entrega Manual" },
  { href: "/admin/downloads", icon: Download, label: "Downloads" },
  { href: "/admin/tickets", icon: Ticket, label: "Tickets" },
  { href: "/admin/applications", icon: UserPlus, label: "Aplicações" },
  { href: "/admin/support", icon: HelpCircle, label: "Dúvidas" },
  { href: "/admin/ip-whitelist", icon: Shield, label: "Whitelist IPs" },
  { href: "/admin/security", icon: Lock, label: "Segurança" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="galaxy-bg">
        <div className="galaxy-shooting-star" />
        <div className="galaxy-shooting-star" style={{ animationDelay: "9s", top: "55%" }} />
      </div>
      <InteractiveStars />

      {/* Sidebar */}
      <aside
        className="relative z-10 w-60 flex-shrink-0 flex flex-col rounded-r-3xl m-4 mr-0"
        style={{
          background: "rgba(8,6,18,0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
          <img
            src={LOGO_URL}
            alt="VG Sellers"
            className="w-9 h-9 object-contain"
            style={{ filter: "drop-shadow(0 0 10px rgba(16,185,129,0.6))" }}
          />
          <div>
            <p className="text-white font-black text-base leading-none tracking-tight">VG</p>
            <p className="text-[10px] font-semibold tracking-[0.25em] mt-0.5" style={{ color: "#34d399" }}>SELLERS</p>
          </div>
          <div className="ml-auto w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Shield className="w-3 h-3 text-emerald-500" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
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

        {/* User */}
        <div className="px-4 py-5 border-t border-white/[0.06]">
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
      <main className="relative z-10 flex-1 overflow-auto p-4 pl-6">
        {children}
      </main>
    </div>
  );
}
