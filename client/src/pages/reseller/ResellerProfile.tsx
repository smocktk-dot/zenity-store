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
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";

function formatDate(d: Date | null | undefined, lang: "pt" | "en") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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
  const { t, language } = useLanguage();
  const [step, setStep] = useState<PixStep>("select");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const { fmt, fmtCents } = useCurrency();
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
      toast.error(err.message || t.buy_credits_error);
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
      toast.success(t.buy_credits_confirmed_title);
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
      toast.success(t.buy_credits_pix_copied);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleGenerate = () => {
    const n = parseInt(amount);
    if (!n || n < 1) { toast.error(t.buy_credits_invalid_amount); return; }
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
            border: "1px solid rgba(16,185,129,0.3)",
            boxShadow: "0 0 60px rgba(16,185,129,0.15), 0 25px 50px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(52,211,153,0.15))", border: "1px solid rgba(16,185,129,0.4)" }}>
                <QrCode className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">{t.buy_credits_title}</h2>
                <p className="text-gray-500 text-xs">{t.buy_credits_subtitle}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Step: Select amount ── */}
          {step === "select" && (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-400 text-xs">{t.buy_credits_current_balance}</span>
                </div>
                <span className="text-emerald-300 font-mono font-bold text-sm">{currentCredits.toFixed(2)} {t.general_credits}</span>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2.5 font-medium uppercase tracking-wider">{t.buy_credits_quick_values}</p>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                        amount === String(p) ? "text-white" : "text-gray-400 hover:text-gray-200"
                      }`}
                      style={amount === String(p) ? {
                        background: "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(52,211,153,0.25))",
                        border: "1px solid rgba(16,185,129,0.5)",
                        boxShadow: "0 0 16px rgba(16,185,129,0.2)",
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

              <div>
                <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 block">{t.buy_credits_or_type}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.buy_credits_placeholder}
                    className="bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 pr-20 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t.general_credits}</span>
                </div>
                {amount && parseInt(amount) > 0 && (
                  <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {language === "en" ? "Amount to pay:" : "Valor a pagar:"} <span className="font-mono font-bold">{fmt(parseInt(amount))}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-gray-500 text-xs">{t.buy_credits_rate}</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-white/10 text-gray-400 hover:text-gray-200 bg-transparent h-11">
                  {t.buy_credits_cancel}
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={createCharge.isPending || !amount || parseInt(amount) < 1}
                  className="flex-1 h-11 font-semibold text-white gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
                >
                  {createCharge.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t.buy_credits_generating}</>
                  ) : (
                    <><QrCode className="w-4 h-4" /> {t.buy_credits_generate_pix}</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Pending payment ── */}
          {step === "pending" && pixData && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">{t.buy_credits_amount_to_pay}</p>
                <p className="text-white text-4xl font-bold font-mono">{fmtCents(pixData.amountCents)}</p>
                <p className="text-emerald-400 text-sm mt-1">+{pixData.credits} {t.buy_credits_will_add}</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                {pixData.qrCodeImage ? (
                  <div className="rounded-xl overflow-hidden p-3" style={{ background: "white", border: "3px solid rgba(16,185,129,0.4)" }}>
                    <img src={pixData.qrCodeImage} alt="QR Code Pix" className="w-44 h-44 object-contain" />
                  </div>
                ) : (
                  <div className="w-52 h-52 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.08)", border: "2px dashed rgba(16,185,129,0.3)" }}>
                    <QrCode className="w-16 h-16 text-emerald-500/40" />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-xs font-medium">{t.buy_credits_waiting}</span>
                </div>
              </div>

              {pixData.brCode && (
                <div>
                  <p className="text-gray-500 text-xs mb-2 text-center">{t.buy_credits_or_copypaste}</p>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.25)" }}>
                    <div className="px-3 py-2.5 bg-white/[0.03]">
                      <p className="text-gray-400 text-xs font-mono truncate">{pixData.brCode.slice(0, 60)}...</p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all"
                      style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(16,185,129,0.15)", color: copied ? "#4ade80" : "#34d399" }}
                    >
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> {t.buy_credits_copied}</> : <><Copy className="w-4 h-4" /> {t.buy_credits_copy}</>}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-white/10 text-gray-400 hover:text-gray-200 bg-transparent h-10 text-sm">
                  {t.buy_credits_close}
                </Button>
                <Button variant="outline" onClick={() => refetchStatus()} className="flex-1 border-emerald-500/30 text-emerald-400 hover:text-emerald-300 bg-transparent h-10 text-sm gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> {t.buy_credits_verify}
                </Button>
              </div>
              <p className="text-gray-600 text-xs text-center">{t.buy_credits_auto_check}</p>
            </div>
          )}

          {/* ── Step: Paid ── */}
          {step === "paid" && (
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))", border: "2px solid rgba(34,197,94,0.4)" }}>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1">{t.buy_credits_confirmed_title}</h3>
                <p className="text-gray-400 text-sm">
                  <span className="text-green-400 font-bold font-mono">+{pixData?.credits}</span> {t.buy_credits_confirmed_desc}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full h-11 font-semibold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {t.buy_credits_close}
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
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();
  const [showBuy, setShowBuy] = useState(false);
  const credits = parseFloat(String(profile.credits ?? "0"));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t.profile_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.profile_type_credits}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border font-medium bg-yellow-500/15 text-yellow-400 border-yellow-500/30 flex items-center gap-1.5">
          <CreditCard className="w-3 h-3" /> {language === "en" ? "Credits Reseller" : "Reseller Créditos"}
        </span>
      </div>

      {/* Hero balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-3xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #10b981, transparent)", transform: "translate(30%, -30%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-emerald-400/80 text-sm font-medium">{t.profile_balance}</p>
            </div>
            <p className="text-white text-6xl font-bold font-mono tracking-tight mb-6">{credits.toFixed(2)} <span className="text-2xl text-emerald-400/70">cr</span></p>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowBuy(true)}
                className="font-semibold gap-2 h-11 px-5 text-sm text-white rounded-xl"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
              >
                <Plus className="w-4 h-4" /> {t.profile_buy_credits}
              </Button>
              <p className="text-gray-500 text-sm"><span className="text-white font-medium">{profile.totalPurchases}</span> {language === "en" ? "purchases made" : "compras realizadas"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-semibold text-sm mb-4">{language === "en" ? "Account" : "Conta"}</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center"><User className="w-4 h-4 text-red-400" /></div>
              <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-medium">{profile.username}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-400" /></div>
              <div><p className="text-gray-500 text-xs">{t.profile_email}</p><p className="text-white text-sm font-medium">{profile.email || "—"}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.profile_total_purchases, value: profile.totalPurchases, icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: t.profile_member_since, value: formatDate(profile.createdAt, language), icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: language === "en" ? "Last access" : "Último acesso", value: formatDate(profile.lastLoginAt, language), icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/15" },
          { label: t.profile_location, value: profile.location || "—", icon: MapPin, color: "text-orange-400", bg: "bg-orange-500/15" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-white text-sm font-semibold mt-0.5 truncate">{String(value)}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> {t.profile_recent_transactions}
        </h2>
        {!profile.transactions?.length ? (
          <p className="text-gray-600 text-sm text-center py-8">{t.profile_no_transactions}</p>
        ) : (
          <div className="space-y-2">
            {profile.transactions.slice(0, 20).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors" style={{ background: "rgba(255,255,255,0.01)" }}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === "add" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                    {tx.type === "add"
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{tx.description}</p>
                    <p className="text-gray-600 text-xs">{formatDate(tx.createdAt, language)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold text-sm ${tx.type === "add" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "add" ? "+" : "-"}{parseFloat(tx.amount).toFixed(2)} cr
                  </p>
                  <p className="text-gray-600 text-xs font-mono">{language === "en" ? "Balance:" : "Saldo:"} {parseFloat(tx.balanceAfter).toFixed(2)} cr</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BuyCreditsModal
        open={showBuy}
        onClose={() => setShowBuy(false)}
        currentCredits={credits}
        onSuccess={() => { refetch(); }}
      />
    </div>
  );
}

// ─── Percentage Profile ───────────────────────────────────────────────────────
function PercentageProfile({ profile }: { profile: any }) {
  const { t, language } = useLanguage();
  const purchases = profile.totalPurchases ?? 0;
  const discount = parseFloat(String(profile.discountPercent ?? 0));

  const levels = [
    { label: language === "en" ? "Starter" : "Iniciante", discount: 35, from: 0, to: 10, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", activeBg: "bg-blue-500" },
    { label: language === "en" ? "Advanced" : "Avançado", discount: 40, from: 10, to: 20, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", activeBg: "bg-emerald-500" },
    { label: language === "en" ? "Elite" : "Elite", discount: 50, from: 20, to: Infinity, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", activeBg: "bg-yellow-500" },
  ];

  const currentLevelIdx = purchases >= 20 ? 2 : purchases >= 10 ? 1 : 0;
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = currentLevelIdx < 2 ? levels[currentLevelIdx + 1] : null;
  const progressInLevel = purchases >= 20 ? 10 : purchases >= 10 ? purchases - 10 : purchases;
  const progressPct = nextLevel ? Math.min(100, (progressInLevel / 10) * 100) : 100;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t.profile_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.profile_type_percentage}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border font-medium bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
          <Percent className="w-3 h-3" /> {language === "en" ? "Percentage Reseller" : "Reseller Porcentagem"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Discount hero */}
        <div className="lg:col-span-2 rounded-3xl p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #10b981, transparent)", transform: "translate(30%, -30%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Percent className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-emerald-400/80 text-sm font-medium">{t.profile_current_discount}</p>
            </div>
            <div className="flex items-end gap-4 mb-6">
              <p className="text-white text-6xl font-bold tracking-tight">{discount.toFixed(0)}<span className="text-3xl text-emerald-400">%</span></p>
              <span className={`text-xs px-3 py-1 rounded-full border font-medium mb-3 ${currentLevel.border} ${currentLevel.color}`} style={{ background: "rgba(16,185,129,0.08)" }}>
                {currentLevel.label}
              </span>
            </div>

            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">{progressInLevel}/10 {language === "en" ? "purchases at this level" : "compras neste nível"}</span>
                  <span className={nextLevel.color}>{nextLevel.discount}% {language === "en" ? "next level" : "próximo nível"}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #10b981, #34d399)" }} />
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {language === "en" ? "Need" : "Faltam"} <span className="text-emerald-400 font-semibold">{10 - progressInLevel} {language === "en" ? "more purchases" : "compras"}</span> {language === "en" ? `for ${nextLevel.discount}% discount` : `para ${nextLevel.discount}% de desconto`}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(234,179,8,0.2)" }}>
                  <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #ca8a04, #eab308)" }} />
                </div>
                <span className="text-yellow-400 text-sm font-bold whitespace-nowrap">{language === "en" ? "MAX REACHED" : "MÁXIMO ATINGIDO"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-white font-semibold text-sm mb-4">{language === "en" ? "Account" : "Conta"}</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center"><User className="w-4 h-4 text-red-400" /></div>
              <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-medium">{profile.username}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-400" /></div>
              <div><p className="text-gray-500 text-xs">{t.profile_email}</p><p className="text-white text-sm font-medium">{profile.email || "—"}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Levels */}
      <div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> {language === "en" ? "Discount Progression" : "Progressão de Desconto"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {levels.map((level, idx) => {
            const isUnlocked = currentLevelIdx >= idx;
            const isCurrent = currentLevelIdx === idx;
            return (
              <div key={level.label} className={`rounded-2xl border p-5 transition-all ${isCurrent ? `${level.border}` : isUnlocked ? "border-white/10" : "border-white/5 opacity-40"}`}
                style={{ background: isCurrent ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)" }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? level.bg : "bg-white/5"}`}>
                  <Percent className={`w-5 h-5 ${isUnlocked ? level.color : "text-gray-600"}`} />
                </div>
                <p className={`text-4xl font-bold ${isUnlocked ? level.color : "text-gray-600"}`}>{level.discount}%</p>
                <p className="text-gray-300 text-sm font-medium mt-1">{level.label}</p>
                <p className="text-gray-600 text-xs mt-1">{level.from === 0 ? (language === "en" ? "Starting discount" : "Desconto inicial") : `${language === "en" ? "After" : "Após"} ${level.from} ${language === "en" ? "purchases" : "compras"}`}</p>
                {isCurrent && <span className="text-xs text-emerald-400 font-semibold mt-3 block">● {language === "en" ? "Current level" : "Nível atual"}</span>}
                {isUnlocked && !isCurrent && <span className="text-xs text-gray-500 mt-3 block">✓ {language === "en" ? "Unlocked" : "Desbloqueado"}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.profile_total_purchases, value: purchases, icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: t.profile_member_since, value: formatDate(profile.createdAt, language), icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: language === "en" ? "Last access" : "Último acesso", value: formatDate(profile.lastLoginAt, language), icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/15" },
          { label: t.profile_location, value: profile.location || "—", icon: MapPin, color: "text-orange-400", bg: "bg-orange-500/15" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-white text-sm font-semibold mt-0.5 truncate">{String(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ResellerProfile() {
  const { data: profile, isLoading, refetch } = trpc.reseller.profile.useQuery();
  const { t } = useLanguage();

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-gray-500 text-sm animate-pulse">{t.general_loading}</div>
    </div>
  );

  if (!profile) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-gray-500 text-sm">{t.general_not_found}</div>
    </div>
  );

  return profile.resellerType === "percentage"
    ? <PercentageProfile profile={profile} />
    : <CreditsProfile profile={profile} refetch={refetch} />;
}
