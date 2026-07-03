import { trpc } from "@/lib/trpc";
import { CreditCard, Percent, TrendingUp, ShoppingBag, Calendar, MapPin, Clock, ArrowUpRight, ArrowDownRight, Plus, User, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Credits Profile ──────────────────────────────────────────────────────────
function CreditsProfile({ profile }: { profile: any }) {
  const [showBuy, setShowBuy] = useState(false);
  const [amount, setAmount] = useState("");
  const credits = parseFloat(String(profile.credits ?? "0"));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Meu Perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Painel de Créditos</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1.5">
          <CreditCard className="w-3 h-3" /> Reseller Créditos
        </span>
      </div>

      {/* Main credit card */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.04) 100%)", border: "1px solid rgba(234,179,8,0.25)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #eab308, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-yellow-400/70" />
          <p className="text-yellow-400/70 text-sm font-medium">Saldo de Créditos</p>
        </div>
        <p className="text-white text-5xl font-bold font-mono mb-5">{credits.toFixed(2)}</p>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowBuy(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> Comprar Créditos
          </Button>
          <p className="text-gray-500 text-sm"><span className="text-gray-300 font-medium">{profile.totalPurchases}</span> compras realizadas</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Compras", value: profile.totalPurchases, icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/20" },
          { label: "Membro desde", value: formatDate(profile.createdAt), icon: Calendar, color: "text-green-400", bg: "bg-green-500/20" },
          { label: "Último acesso", value: formatDate(profile.lastLoginAt), icon: Clock, color: "text-purple-400", bg: "bg-purple-500/20" },
          { label: "Localização", value: profile.location || "—", icon: MapPin, color: "text-orange-400", bg: "bg-orange-500/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-white text-sm font-medium mt-0.5 truncate">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-white/5 p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-white font-semibold text-sm mb-1">Informações da Conta</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-red-400" /></div>
          <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-medium">{profile.username}</p></div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-blue-400" /></div>
          <div><p className="text-gray-500 text-xs">Email</p><p className="text-white text-sm font-medium">{profile.email || "—"}</p></div>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" /> Histórico de Transações
        </h2>
        <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {!profile.transactions?.length ? (
            <p className="text-gray-600 text-sm text-center py-8">Nenhuma transação ainda</p>
          ) : profile.transactions.slice(0, 20).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "add" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  {t.type === "add"
                    ? <ArrowUpRight className="w-4 h-4 text-green-400" />
                    : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <p className="text-white text-sm">{t.description}</p>
                  <p className="text-gray-600 text-xs">{formatDate(t.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold text-sm ${t.type === "add" ? "text-green-400" : "text-red-400"}`}>
                  {t.type === "add" ? "+" : "-"}{parseFloat(t.amount).toFixed(2)}
                </p>
                <p className="text-gray-600 text-xs font-mono">Saldo: {parseFloat(t.balanceAfter).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Credits Modal */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-yellow-400" /> Comprar Créditos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-yellow-500/20 p-3" style={{ background: "rgba(234,179,8,0.05)" }}>
              <p className="text-yellow-400/80 text-xs">Saldo atual: <span className="font-mono font-bold text-yellow-400">{credits.toFixed(2)} créditos</span></p>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Quantidade de Créditos</Label>
              <Input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 100" className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">Pagamento via Pix</p>
              <p className="text-gray-600 text-xs">Integração Pix (Purin Cash) em breve</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBuy(false)} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
              <Button onClick={() => { toast.info("Integração Pix em breve!"); setShowBuy(false); }} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                Gerar Pix
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Percentage Profile ───────────────────────────────────────────────────────
function PercentageProfile({ profile }: { profile: any }) {
  const purchases = profile.totalPurchases ?? 0;
  const discount = parseFloat(String(profile.discountPercent ?? 35));

  const levels = [
    { label: "Nível 1", discount: 35, from: 0, to: 10, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", activeBg: "bg-blue-500" },
    { label: "Nível 2", discount: 40, from: 10, to: 20, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", activeBg: "bg-purple-500" },
    { label: "Nível MAX", discount: 50, from: 20, to: Infinity, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", activeBg: "bg-yellow-500" },
  ];

  const currentLevelIdx = purchases >= 20 ? 2 : purchases >= 10 ? 1 : 0;
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = currentLevelIdx < 2 ? levels[currentLevelIdx + 1] : null;
  const progressInLevel = purchases >= 20 ? 10 : purchases >= 10 ? purchases - 10 : purchases;
  const progressPct = nextLevel ? Math.min(100, (progressInLevel / 10) * 100) : 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Meu Perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Painel de Porcentagem</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1.5">
          <Percent className="w-3 h-3" /> Reseller Porcentagem
        </span>
      </div>

      {/* Discount hero card */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.04) 100%)", border: "1px solid rgba(168,85,247,0.25)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #a855f7, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="flex items-center gap-2 mb-1">
          <Percent className="w-4 h-4 text-purple-400/70" />
          <p className="text-purple-400/70 text-sm font-medium">Seu Desconto Atual</p>
        </div>
        <div className="flex items-end gap-3 mb-5">
          <p className="text-white text-6xl font-bold">{discount.toFixed(0)}<span className="text-3xl text-purple-400">%</span></p>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium mb-2 ${currentLevel.border} ${currentLevel.color}`} style={{ background: "rgba(168,85,247,0.08)" }}>
            {currentLevel.label}
          </span>
        </div>

        {nextLevel ? (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">{progressInLevel}/10 compras neste nível</span>
              <span className={nextLevel.color}>{nextLevel.discount}% após {nextLevel.from} compras</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1.5">
              Faltam <span className="text-purple-400 font-semibold">{10 - progressInLevel} compras</span> para {nextLevel.discount}% de desconto
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(234,179,8,0.2)" }}>
              <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #ca8a04, #eab308)" }} />
            </div>
            <span className="text-yellow-400 text-sm font-bold whitespace-nowrap">🏆 MÁXIMO ATINGIDO</span>
          </div>
        )}
      </div>

      {/* Level progression */}
      <div>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" /> Progressão de Desconto
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {levels.map((level, idx) => {
            const isUnlocked = currentLevelIdx >= idx;
            const isCurrent = currentLevelIdx === idx;
            return (
              <div key={level.label} className={`rounded-xl border p-4 transition-all ${isCurrent ? `${level.border}` : isUnlocked ? "border-white/10" : "border-white/5 opacity-40"}`}
                style={{ background: isCurrent ? "rgba(168,85,247,0.07)" : "rgba(255,255,255,0.02)" }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${isUnlocked ? level.bg : "bg-white/5"}`}>
                  <Percent className={`w-4 h-4 ${isUnlocked ? level.color : "text-gray-600"}`} />
                </div>
                <p className={`text-3xl font-bold ${isUnlocked ? level.color : "text-gray-600"}`}>{level.discount}%</p>
                <p className="text-gray-400 text-xs font-medium mt-0.5">{level.label}</p>
                <p className="text-gray-600 text-xs mt-1">{level.from === 0 ? "Desconto inicial" : `Após ${level.from} compras`}</p>
                {isCurrent && <span className="text-xs text-green-400 font-semibold mt-2 block">● Nível atual</span>}
                {isUnlocked && !isCurrent && <span className="text-xs text-gray-500 mt-2 block">✓ Desbloqueado</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total de Compras", value: purchases, icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/20" },
          { label: "Membro desde", value: formatDate(profile.createdAt), icon: Calendar, color: "text-green-400", bg: "bg-green-500/20" },
          { label: "Último acesso", value: formatDate(profile.lastLoginAt), icon: Clock, color: "text-purple-400", bg: "bg-purple-500/20" },
          { label: "Localização", value: profile.location || "—", icon: MapPin, color: "text-orange-400", bg: "bg-orange-500/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-white text-sm font-medium mt-0.5 truncate">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-white/5 p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-white font-semibold text-sm mb-1">Informações da Conta</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-red-400" /></div>
          <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-medium">{profile.username}</p></div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-blue-400" /></div>
          <div><p className="text-gray-500 text-xs">Email</p><p className="text-white text-sm font-medium">{profile.email || "—"}</p></div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ResellerProfile() {
  const { data: profile, isLoading } = trpc.reseller.profile.useQuery();

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-gray-500 text-sm animate-pulse">Carregando perfil...</div>
    </div>
  );

  if (!profile) return (
    <div className="p-6 text-gray-500 text-center">Erro ao carregar perfil.</div>
  );

  if (profile.resellerType === "percentage") {
    return <PercentageProfile profile={profile} />;
  }

  return <CreditsProfile profile={profile} />;
}
