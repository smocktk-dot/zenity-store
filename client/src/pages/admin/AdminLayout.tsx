import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Tag, AppWindow, Key, LogOut, ChevronRight, Shield, Lock, Ticket,
  UserPlus, HelpCircle, Boxes, Send, Download, KeyRound, Store, Menu, X, Megaphone,
  ArrowLeftRight, ShieldCheck, ShieldAlert, Sparkles
} from "lucide-react";

type NavItem = {
  href: string;
  icon: any;
  label: string;
  section: "core" | "catalog" | "operations" | "support" | "security";
};

const navItems: NavItem[] = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", section: "core" },
  { href: "/admin/resellers", icon: Users, label: "Resellers", section: "core" },
  { href: "/admin/other-store", icon: Store, label: "Other Store", section: "core" },

  { href: "/admin/apps", icon: AppWindow, label: "Apps", section: "catalog" },
  { href: "/admin/categories", icon: Tag, label: "Categorias", section: "catalog" },
  { href: "/admin/keys", icon: Key, label: "License Keys", section: "catalog" },
  { href: "/admin/transfer-keys", icon: ArrowLeftRight, label: "Transferir Keys", section: "catalog" },
  { href: "/admin/stock", icon: Boxes, label: "Estoque", section: "catalog" },
  { href: "/admin/api-keys", icon: KeyRound, label: "API Keys", section: "catalog" },

  { href: "/admin/manual-delivery", icon: Send, label: "Entrega Manual", section: "operations" },
  { href: "/admin/downloads", icon: Download, label: "Downloads", section: "operations" },
  { href: "/admin/reseller-info", icon: Megaphone, label: "Reseller Info", section: "operations" },
  { href: "/admin/vg-auth", icon: ShieldCheck, label: "VG Auth", section: "operations" },

  { href: "/admin/tickets", icon: Ticket, label: "Tickets", section: "support" },
  { href: "/admin/applications", icon: UserPlus, label: "Aplicações", section: "support" },
  { href: "/admin/support", icon: HelpCircle, label: "Dúvidas", section: "support" },

  { href: "/admin/protect", icon: ShieldAlert, label: "Protect Website", section: "security" },
  { href: "/admin/ip-whitelist", icon: Shield, label: "Whitelist IPs", section: "security" },
  { href: "/admin/security", icon: Lock, label: "Segurança", section: "security" },
];

const SECTION_LABELS: Record<NavItem["section"], string> = {
  core: "Principal",
  catalog: "Catálogo & Chaves",
  operations: "Operações",
  support: "Atendimento",
  security: "Segurança",
};

const SUPPORT_HREFS = new Set(["/admin/keys", "/admin/manual-delivery", "/admin/tickets", "/admin/support", "/admin/downloads"]);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, isLoading } = trpc.auth.session.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { toast.success("Logout realizado"); navigate("/"); },
  });

  const isSupport = (session as any)?.adminRole === "support";
  const visibleItems = isSupport ? navItems.filter(i => SUPPORT_HREFS.has(i.href)) : navItems;

  useEffect(() => {
    if (!isLoading && (!session || session.role !== "admin")) navigate("/");
    else if (!isLoading && isSupport && !SUPPORT_HREFS.has(location)) navigate("/admin/tickets");
  }, [session, isLoading, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030305] relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3 text-emerald-400 font-medium text-sm">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Carregando console...
        </div>
      </div>
    );
  }

  // Group visible items by section
  const sections: NavItem["section"][] = isSupport
    ? ["catalog", "operations", "support"]
    : ["core", "catalog", "operations", "support", "security"];

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#030305] text-white">
      {/* Background: clean subtle grid overlay identical to LoginPage / ResellerLayout */}
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

      {/* Top Header - clean, minimal corporate bar */}
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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
              aria-label="Abrir menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo Lockup */}
            <Link href="/admin">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                  }}
                >
                  <span className="font-mono font-bold text-xs text-emerald-400">VG</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm tracking-wide leading-none">VG SELLERS</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono uppercase font-semibold">
                      {isSupport ? "Suporte" : "Admin"}
                    </span>
                  </div>
                  <span className="text-[10px] tracking-wider text-zinc-500 font-medium uppercase mt-0.5">
                    Console Administrativo
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right: Status + Admin Monogram Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400 font-medium">Sistema Online</span>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs font-bold text-emerald-400 uppercase">
                {session?.username?.[0] ?? "A"}
              </div>
              <span className="text-xs font-medium text-zinc-200 hidden md:inline">
                {session?.username}
              </span>
            </div>

            <button
              onClick={() => logout.mutate()}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 transition-all text-xs"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-out flex flex-col ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: 290,
          background: "rgba(6, 10, 8, 0.98)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.08] shrink-0">
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
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-xs tracking-[0.16em]">VG SELLERS</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Console de Gestão</span>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div className="p-3.5 mx-3 my-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-sm font-bold text-emerald-400 uppercase">
              {session?.username?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{session?.username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-zinc-400 font-medium">
                  {isSupport ? "Suporte Autorizado" : "Administrador Full"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List grouped by Section */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {sections.map(section => {
            const items = visibleItems.filter(i => i.section === section);
            if (!items.length) return null;
            return (
              <div key={section} className="space-y-1">
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                  {SECTION_LABELS[section]}
                </p>
                {items.map(({ href, icon: Icon, label }) => {
                  const active = location === href || (href !== "/admin" && location.startsWith(href));
                  return (
                    <Link key={href} href={href}>
                      <div
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-xs font-medium ${
                          active
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.03] text-zinc-400"
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="flex-1 truncate">{label}</span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-white/[0.06] bg-black/40 shrink-0">
          <button
            onClick={() => logout.mutate()}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
