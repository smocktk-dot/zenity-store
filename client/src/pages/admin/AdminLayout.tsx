import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Tag, AppWindow, Key, LogOut, ChevronRight, Shield
} from "lucide-react";
import InteractiveStars from "@/components/InteractiveStars";

const LOGO_URL = "/manus-storage/zenity-logo_13a05e29.png";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/resellers", icon: Users, label: "Resellers" },
  { href: "/admin/categories", icon: Tag, label: "Categorias" },
  { href: "/admin/apps", icon: AppWindow, label: "Apps" },
  { href: "/admin/keys", icon: Key, label: "License Keys" },
  { href: "/admin/ip-whitelist", icon: Shield, label: "Whitelist IPs" },
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
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
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
        className="relative z-10 w-56 flex-shrink-0 flex flex-col border-r"
        style={{
          background: "rgba(8,6,18,0.92)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(124,58,237,0.12)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
          <img
            src={LOGO_URL}
            alt="Zenity"
            className="w-8 h-8 object-contain"
            style={{ filter: "drop-shadow(0 0 8px rgba(124,58,237,0.7))" }}
          />
          <div>
            <p className="text-white font-black text-sm leading-none tracking-wide">ZENITY</p>
            <p className="text-xs font-semibold tracking-widest mt-0.5" style={{ color: "#a78bfa" }}>STORE</p>
          </div>
          <div className="ml-auto">
            <Shield className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group"
                  style={active ? {
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    color: "#c4b5fd",
                  } : {
                    color: "#6b7280",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.color = "#d1d5db"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#6b7280"; } }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? "#a78bfa" : "inherit" }} />
                  <span className="text-sm font-medium">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: "rgba(167,139,250,0.6)" }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
              style={{ background: "rgba(124,58,237,0.25)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              {session?.username?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{session?.username}</p>
              <p className="text-xs" style={{ color: "#7c3aed" }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 transition-all text-sm"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
