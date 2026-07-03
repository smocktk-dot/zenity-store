import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"admin" | "reseller">("reseller");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const adminLogin = trpc.auth.adminLogin.useMutation({
    onSuccess: () => { toast.success("Login realizado com sucesso!"); navigate("/admin"); },
    onError: (e) => toast.error(e.message),
  });
  const resellerLogin = trpc.auth.resellerLogin.useMutation({
    onSuccess: () => { toast.success("Login realizado com sucesso!"); navigate("/reseller"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("Preencha todos os campos"); return; }
    if (tab === "admin") adminLogin.mutate({ username, password });
    else resellerLogin.mutate({ username, password });
  };

  const isLoading = adminLogin.isPending || resellerLogin.isPending;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 20% 50%, rgba(220,38,38,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.05) 0%, transparent 50%), #0a0a0f",
      }}
    >
      {/* Animated dot top-left */}
      <div className="fixed top-4 left-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-red-900/40">
            C
          </div>
          <span className="text-white text-xl font-semibold tracking-wide">
            CV STORE <span className="text-gray-400 font-normal">| Login</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-8"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", backdropFilter: "blur(12px)" }}
        >
          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-white/10 mb-6">
            <button
              onClick={() => setTab("reseller")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${tab === "reseller" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Reseller
            </button>
            <button
              onClick={() => setTab("admin")}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${tab === "admin" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Admin
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              {tab === "admin" ? <Shield className="w-5 h-5 text-red-500" /> : <LogIn className="w-5 h-5 text-red-500" />}
              <h1 className="text-white text-xl font-bold">
                {tab === "admin" ? "Admin Access" : "Reseller Access"}
              </h1>
            </div>
            <p className="text-gray-500 text-sm">
              {tab === "admin" ? "Sign in to CV STORE admin panel" : "Sign in to your reseller account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 h-11"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-red-500/50 focus:ring-red-500/20 h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-red-900/30 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <LogIn className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Secure {tab === "admin" ? "admin" : "reseller"} access for CV STORE management
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          © 2024 CV STORE. {tab === "admin" ? "Admin Panel" : "Reseller Panel"}
        </p>
      </div>
    </div>
  );
}
