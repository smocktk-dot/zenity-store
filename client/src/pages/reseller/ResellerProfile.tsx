import { trpc } from "@/lib/trpc";
import {
  CreditCard, Percent, TrendingUp, ShoppingBag, Calendar, MapPin, Clock,
  ArrowUpRight, ArrowDownRight, Plus, User, Mail, QrCode, Copy, CheckCircle2,
  Loader2, RefreshCw, X, Zap,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Pix Modal ────────────────────────────────────────────────────────────────
type PixStep = "select" | "pending" | "paid";

interface PixModalProps {
  open: boolean;
  onClose: () => void;
  currentCredits: number;
  onSuccess: () => void;
}

function BuyCreditsModal({ open, onClose, currentCredits, onSuccess }: PixModalProps) {
  const [step, setStep] = useState<PixStep>("select");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    brCode: string;
    qrCodeImage?: string;
    credits: number;
    amountCents: number;
    expiresAt?: string;
  } | null>(null);

  const createCharge = trpc.reseller.createPixCharge.useMutation({
    onSuccess: (data) => {
      setPixData({
        paymentId: data.paymentId,
        brCode: data.brCode || "",
        qrCodeImage: data.qrCodeImage,
        credits: data.credits,
        amountCents: data.amountCents,
        expiresAt: data.expiresAt,
      });
      setStep("pending");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar cobrança Pix");
    },
  });

  const { data: statusData, refetch: refetchStatus } = trpc.reseller.checkPixStatus.useQuery(
    { paymentId: pixData?.paymentId || "" },
    {
      enabled: step === "pending" && !!pixData?.paymentId,
      refetchInterval: step === "pending" ? 4000 : false,
    }
  );

  useEffect(() => {
    if (statusData?.status === "paid" && step === "pending") {
      setStep("paid");
      toast.success("Pagamento confirmado! Créditos adicionados.");
      onSuccess();
    }
  }, [statusData?.status, step, onSuccess]);

  const handleClose = useCallback(() => {
    setStep("select");
    setAmount("");
    setPixData(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  const handleCopy = () => {
    if (!pixData?.brCode) return;
    navigator.clipboard.writeText(pixData.brCode).then(() => {
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleGenerate = () => {
    const n = parseInt(amount);
    if (!n || n < 1) { toast.error("Informe uma quantidade válida"); return; }
    createCharge.mutate({ credits: n });
  };

  const presets = [10, 25, 50, 100, 250, 500];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full shadow-2xl" style={{ boxShadow: "none" }}>
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(13,10,25,0.98) 0%, rgba(18,12,35,0.98) 100%)",
            border: "1px solid rgba(124,58,237,0.3)",
            boxShadow: "0 0 60px rgba(124,58,237,0.15), 0 25px 50px rgba(0,0,0,0.6)",
          }}
        >
          {/* Glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(139,92,246,0.15))", border: "1px solid rgba(124,58,237,0.4)" }}>
                <QrCode className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">Comprar Créditos</h2>
                <p className="text-gray-500 text-xs">Pagamento via Pix • Instantâneo</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Step: Select amount ── */}
          {step === "select" && (
            <div className="p-6 space-y-5">
              {/* Balance badge */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-gray-400 text-xs">Saldo atual</span>
                </div>
                <span className="text-violet-300 font-mono font-bold text-sm">{currentCredits.toFixed(2)} créditos</span>
              </div>

              {/* Preset amounts */}
              <div>
                <p className="text-gray-400 text-xs mb-2.5 font-medium uppercase tracking-wider">Valores rápidos</p>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                        amount === String(p)
                          ? "text-white"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                      style={amount === String(p) ? {
                        background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(139,92,246,0.25))",
                        border: "1px solid rgba(124,58,237,0.5)",
                        boxShadow: "0 0 16px rgba(124,58,237,0.2)",
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="font-mono">{p}</span>
                      <span className="text-xs ml-1 opacity-60">R$</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 block">Ou digite o valor</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 150"
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 pr-16 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">créditos</span>
                </div>
                {amount && parseInt(amount) > 0 && (
                  <p className="text-violet-400 text-xs mt-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Valor a pagar: <span className="font-mono font-bold">R$ {parseInt(amount).toFixed(2)}</span>
                  </p>
                )}
              </div>

              {/* Rate info */}
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-gray-500 text-xs">1 crédito = R$ 1,00 • Pix expira em 30 minutos</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-white/10 text-gray-400 hover:text-gray-200 bg-transparent h-11">
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={createCharge.isPending || !amount || parseInt(amount) < 1}
                  className="flex-1 h-11 font-semibold text-white gap-2"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
                >
                  {createCharge.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                  ) : (
                    <><QrCode className="w-4 h-4" /> Gerar Pix</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Pending payment ── */}
          {step === "pending" && pixData && (
            <div className="p-6 space-y-5">
              {/* Amount summary */}
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Valor a pagar</p>
                <p className="text-white text-4xl font-bold font-mono">R$ {(pixData.amountCents / 100).toFixed(2)}</p>
                <p className="text-violet-400 text-sm mt-1">+{pixData.credits} créditos na sua conta</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                {pixData.qrCodeImage ? (
                  <div className="rounded-xl overflow-hidden p-3" style={{ background: "white", border: "3px solid rgba(124,58,237,0.4)" }}>
                    <img src={pixData.qrCodeImage} alt="QR Code Pix" className="w-44 h-44 object-contain" />
                  </div>
                ) : (
                  <div className="w-52 h-52 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)", border: "2px dashed rgba(124,58,237,0.3)" }}>
                    <QrCode className="w-16 h-16 text-violet-500/40" />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-xs font-medium">Aguardando pagamento...</span>
                </div>
              </div>

              {/* Pix copy-paste */}
              {pixData.brCode && (
                <div>
                  <p className="text-gray-500 text-xs mb-2 text-center">Ou use o código Pix Copia e Cola</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.25)" }}>
                    <div className="px-3 py-2.5 bg-white/[0.03]">
                      <p className="text-gray-400 text-xs font-mono truncate">{pixData.brCode.slice(0, 60)}...</p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                      style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.15)", color: copied ? "#4ade80" : "#a78bfa" }}
                    >
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Refresh + cancel */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-white/10 text-gray-400 hover:text-gray-200 bg-transparent h-10 text-sm"
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetchStatus()}
                  className="flex-1 border-violet-500/30 text-violet-400 hover:text-violet-300 bg-transparent h-10 text-sm gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Verificar
                </Button>
              </div>
              <p className="text-gray-600 text-xs text-center">Verificação automática a cada 4 segundos</p>
            </div>
          )}

          {/* ── Step: Paid ── */}
          {step === "paid" && (
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))", border: "2px solid rgba(34,197,94,0.4)" }}>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1">Pagamento confirmado!</h3>
                <p className="text-gray-400 text-sm">
                  <span className="text-green-400 font-bold font-mono">+{pixData?.credits}</span> créditos adicionados à sua conta
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="w-full h-11 font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Credits Profile ──────────────────────────────────────────────────────────
function CreditsProfile({ profile, refetch }: { profile: any; refetch: () => void }) {
  const [showBuy, setShowBuy] = useState(false);
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
          <Button
            onClick={() => setShowBuy(true)}
            className="font-bold gap-2 h-9 text-sm text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
          >
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
      <BuyCreditsModal
        open={showBuy}
        onClose={() => setShowBuy(false)}
        currentCredits={credits}
        onSuccess={() => {
          // Don't close the modal here — BuyCreditsModal shows the success screen itself.
          // Refetch profile so balance updates when user closes.
          refetch();
        }}
      />
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
  const { data: profile, isLoading, refetch } = trpc.reseller.profile.useQuery();

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

  return <CreditsProfile profile={profile} refetch={refetch} />;
}
