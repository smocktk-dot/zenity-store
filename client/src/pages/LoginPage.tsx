import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import InteractiveStars from "@/components/InteractiveStars";

const LOGO_URL = "/manus-storage/zenity-logo_13a05e29.png";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Unified login: tries reseller first, then admin (admin gets redirected to /admin)
  const resellerLogin = trpc.auth.resellerLogin.useMutation({
    onSuccess: (data) => {
      toast.success("Login realizado com sucesso!");
      // If admin logged in via reseller flow, go to admin panel
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/reseller");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error("Preencha todos os campos"); return; }
    resellerLogin.mutate({ username, password });
  };

  const isLoading = resellerLogin.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="galaxy-bg">
        <div className="galaxy-shooting-star" />
        <div className="galaxy-shooting-star" style={{ animationDelay: "7s", top: "40%" }} />
        <div className="galaxy-shooting-star" style={{ animationDelay: "13s", top: "65%" }} />
      </div>
      <InteractiveStars />

      {/* Glow orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%)", filter: "blur(100px)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 60%)", filter: "blur(120px)" }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            <img
              src={LOGO_URL}
              alt="Zenity Store"
              className="w-16 h-16 object-contain"
              style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.6))" }}
            />
            <div className="text-left">
              <h1 className="text-4xl font-black tracking-tight text-white leading-none">ZENITY</h1>
              <p className="text-sm font-bold tracking-[0.4em] mt-0.5" style={{ color: "#a78bfa" }}>STORE</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Reseller Management Panel</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgba(10,8,20,0.88)",
            backdropFilter: "blur(24px)",
            borderColor: "rgba(124,58,237,0.2)",
            boxShadow: "0 0 80px rgba(124,58,237,0.1), 0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Form */}
          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <LogIn className="w-4 h-4" style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-none">Reseller Access</h2>
                <p className="text-gray-600 text-xs mt-0.5">Sign in to your reseller account</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  className="h-11 text-white placeholder:text-gray-600 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    className="h-11 text-white placeholder:text-gray-600 pr-10 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg font-semibold text-sm text-white mt-2 flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isLoading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
                  boxShadow: isLoading ? "none" : "0 4px 24px rgba(124,58,237,0.45), 0 1px 0 rgba(255,255,255,0.1) inset",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-700 text-xs mt-5">
              Secure reseller access for ZENITY STORE
            </p>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          © 2025 ZENITY STORE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
