import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, AppWindow, Key, LogOut, Shield } from "lucide-react";
import InteractiveStars from "@/components/InteractiveStars";

const LOGO_URL = "/logo.png";

const navItems = [
  { href: "/reseller", icon: User, label: "Perfil" },
  { href: "/reseller/apps", icon: AppWindow, label: "Apps" },
  { href: "/reseller/keys", icon: Key, label: "Minhas Keys" },
];

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: session, isLoading } = trpc.auth.session.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { toast.success("Logout realizado"); navigate("/"); },
  });

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
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }

  const isAdmin = session?.role === "admin";
  const resellerSession = session?.role === "reseller" ? session : null;
  const isCredits = !resellerSession || (resellerSession as any).resellerType !== "percentage";
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
        className="relative z-10 border-b sticky top-0"
        style={{
          background: "rgba(8,6,18,0.92)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(124,58,237,0.12)",
        }}
      >
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src={LOGO_URL}
                alt="Zenity"
                className="w-7 h-7 object-contain"
                style={{ filter: "drop-shadow(0 0 6px rgba(124,58,237,0.7))" }}
              />
              <span className="text-white font-black text-sm tracking-wide">ZENITY <span className="font-normal text-purple-400 text-xs tracking-widest">STORE</span></span>
            </div>

            <nav className="flex items-center gap-0.5 ml-2">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = location === href || (href !== "/reseller" && location.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm"
                      style={active ? {
                        background: "rgba(124,58,237,0.15)",
                        color: "#c4b5fd",
                        border: "1px solid rgba(124,58,237,0.2)",
                      } : {
                        color: "#6b7280",
                        border: "1px solid transparent",
                      }}
                      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.color = "#d1d5db"; } }}
                      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#6b7280"; } }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                  </Link>
                );
              })}

              {/* Admin-only: link to Admin Panel */}
              {isAdmin && (
                <Link href="/admin">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ml-1"
                    style={{
                      background: "rgba(124,58,237,0.12)",
                      color: "#a78bfa",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.25)"; (e.currentTarget as HTMLDivElement).style.color = "#c4b5fd"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(124,58,237,0.12)"; (e.currentTarget as HTMLDivElement).style.color = "#a78bfa"; }}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </div>
                </Link>
              )}
            </nav>
          </div>

          {/* Right: badges + user */}
          <div className="flex items-center gap-2">
            {/* Admin badge */}
            {isAdmin && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
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
            {resellerSession && !isCredits && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}
              >
                {parseFloat((resellerSession as any).discountPercent ?? "35").toFixed(0)}% desc
              </div>
            )}

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                style={{ background: isAdmin ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.3)", color: "#a78bfa" }}
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
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-6">{children}</main>
    </div>
  );
}
