import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { User, AppWindow, Key, LogOut, ChevronRight } from "lucide-react";

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

  useEffect(() => {
    if (!isLoading && (!session || session.role !== "reseller")) navigate("/");
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Carregando...
        </div>
      </div>
    );
  }

  const resellerSession = session?.role === "reseller" ? session : null;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Top Header */}
      <header className="border-b border-white/5 sticky top-0 z-50" style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-sm">C</div>
              <span className="text-white font-semibold text-sm">CV STORE</span>
            </div>
            {/* Nav */}
            <nav className="flex items-center gap-1 ml-4">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = location === href || (href !== "/reseller" && location.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${active ? "bg-red-600/20 text-red-400" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {resellerSession && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-400 text-xs font-mono font-medium">
                    {parseFloat((resellerSession as any).credits ?? "0").toFixed(2)} cr
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400 text-xs font-medium">
                    {parseFloat((resellerSession as any).discountPercent ?? "35").toFixed(0)}% desc
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <div className="w-5 h-5 rounded-full bg-red-600/40 flex items-center justify-center text-red-400 text-xs font-bold uppercase">
                {resellerSession?.username?.[0] ?? "R"}
              </div>
              <span className="text-gray-300 text-sm">{resellerSession?.username}</span>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
