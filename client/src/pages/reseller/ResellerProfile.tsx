import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { User, Mail, MapPin, Calendar, Clock, DollarSign, TrendingUp, ShoppingCart, AppWindow, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ResellerProfile() {
  const [, navigate] = useLocation();
  const { data: profile, isLoading } = trpc.reseller.profile.useQuery();

  if (isLoading) return <div className="text-gray-500 py-8 text-center">Carregando perfil...</div>;
  if (!profile) return <div className="text-gray-500 py-8 text-center">Erro ao carregar perfil</div>;

  const discount = parseFloat(String(profile.discountPercent));
  const purchases = profile.totalPurchases;
  const credits = parseFloat(String(profile.credits));

  // Progress to next level
  const getProgressInfo = () => {
    if (purchases < 10) return { current: purchases, target: 10, nextDiscount: 40, progress: (purchases / 10) * 100 };
    if (purchases < 20) return { current: purchases - 10, target: 10, nextDiscount: 50, progress: ((purchases - 10) / 10) * 100 };
    return null;
  };
  const progressInfo = getProgressInfo();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Suas informações e configurações de conta</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/reseller/apps")} className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/15 transition-all text-left group">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <AppWindow className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">App Management</p>
            <p className="text-gray-500 text-xs">Manage applications and configurations</p>
          </div>
        </button>
        <button onClick={() => navigate("/reseller/keys")} className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/10 hover:bg-green-500/15 transition-all text-left group">
          <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Minhas Keys</p>
            <p className="text-gray-500 text-xs">Gerenciar e gerar license keys</p>
          </div>
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600/40 to-red-800/20 border border-red-500/20 flex items-center justify-center text-red-400 text-2xl font-bold uppercase">
            {profile.username[0]}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{profile.username}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-medium">RESELLER</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-blue-400" /></div>
            <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-medium">{profile.username}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-green-400" /></div>
            <div><p className="text-gray-500 text-xs">Email</p><p className="text-white text-sm font-medium">{profile.email || "—"}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-yellow-400" /></div>
              <div><p className="text-gray-500 text-xs">Credits</p><p className="text-yellow-400 text-sm font-bold font-mono">{credits.toFixed(2)}</p></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-purple-400" /></div>
              <div><p className="text-gray-500 text-xs">Discount</p><p className="text-green-400 text-sm font-bold">{discount.toFixed(0)}%</p></div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-orange-400" /></div>
            <div><p className="text-gray-500 text-xs">Account Created</p><p className="text-white text-sm font-medium">{new Date(profile.createdAt).toLocaleString("pt-BR")}</p></div>
          </div>
          {profile.lastLoginAt && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-cyan-400" /></div>
              <div><p className="text-gray-500 text-xs">Last Login</p><p className="text-white text-sm font-medium">{new Date(profile.lastLoginAt).toLocaleString("pt-BR")}</p></div>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-pink-400" /></div>
              <div><p className="text-gray-500 text-xs">Location</p><p className="text-white text-sm font-medium">{profile.location}</p></div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center"><ShoppingCart className="w-3.5 h-3.5 text-teal-400" /></div>
            <div><p className="text-gray-500 text-xs">Total de Compras</p><p className="text-white text-sm font-medium">{purchases} keys geradas</p></div>
          </div>
        </div>
      </div>

      {/* Discount Progress */}
      {progressInfo ? (
        <div className="rounded-xl border border-purple-500/20 p-5" style={{ background: "rgba(139,92,246,0.05)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-white font-semibold text-sm">Progresso de Desconto</h3>
            </div>
            <span className="text-purple-400 text-sm font-bold">{discount}% → {progressInfo.nextDiscount}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{progressInfo.current} compras realizadas</span>
            <span>{progressInfo.target - progressInfo.current} restantes para {progressInfo.nextDiscount}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5">
            <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500" style={{ width: `${Math.min(100, progressInfo.progress)}%` }} />
          </div>
          <p className="text-gray-600 text-xs mt-2">Faça mais {progressInfo.target - progressInfo.current} compras para desbloquear {progressInfo.nextDiscount}% de desconto</p>
        </div>
      ) : (
        <div className="rounded-xl border border-green-500/20 p-5" style={{ background: "rgba(34,197,94,0.05)" }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h3 className="text-white font-semibold text-sm">Desconto Máximo Atingido!</h3>
          </div>
          <p className="text-green-400 text-sm mt-1 font-bold">Você está no nível máximo de 50% de desconto 🎉</p>
        </div>
      )}

      {/* Transaction History */}
      {profile.transactions && profile.transactions.length > 0 && (
        <div className="rounded-xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-white font-semibold text-sm mb-4">Histórico de Transações</h3>
          <div className="space-y-2">
            {profile.transactions.slice(0, 10).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t.type === "add" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                    {t.type === "add" ? <ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs font-medium">{t.description}</p>
                    <p className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <span className={`text-sm font-mono font-bold ${t.type === "add" ? "text-green-400" : "text-red-400"}`}>
                  {t.type === "add" ? "+" : "-"}{parseFloat(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
