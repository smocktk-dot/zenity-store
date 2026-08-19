import { trpc } from "@/lib/trpc";
import {
  CreditCard, TrendingUp, ShoppingBag, Calendar, MapPin, Clock,
  ArrowUpRight, ArrowDownRight, ArrowRight, Plus, User, Mail, QrCode, Copy, CheckCircle2,
  Loader2, RefreshCw, X, Zap, Bitcoin, Trash2, LayoutDashboard, Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import PercentageProfile from "./PercentageProfile";
import SubResellersSection from "./SubResellersSection";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

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

type BuyStep = "select" | "method" | "pending-pix" | "pending-ltc" | "paid";

function BuyCreditsModal({ open, onClose, currentCredits, onSuccess }: PixModalProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<BuyStep>("select");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLtc, setCopiedLtc] = useState(false);
  const { fmt, fmtCents } = useCurrency();
  const [paymentId, setPaymentId] = useState("");
  const [pixData, setPixData] = useState<{
    paymentId: string;
    brCode: string;
    qrCodeImage?: string;
    credits: number;
    amountCents: number;
    expiresAt?: string;
  } | null>(null);
  const [ltcData, setLtcData] = useState<{
    paymentId: string;
    credits: number;
    amountCents: number;
    totalCost: number;
    ltcAddress: string;
    ltcAmount: number;
    ltcPriceBrl: number;
    expiresAt?: string;
  } | null>(null);

  const activePaymentId = pixData?.paymentId || ltcData?.paymentId || "";

  const createPix = trpc.reseller.createPixCharge.useMutation({
    onSuccess: (data) => {
      setPixData({
        paymentId: data.paymentId,
        brCode: data.brCode || "",
        qrCodeImage: data.qrCodeImage,
        credits: data.credits,
        amountCents: data.amountCents,
        expiresAt: data.expiresAt,
      });
      setPaymentId(data.paymentId);
      setStep("pending-pix");
    },
    onError: (err) => toast.error(err.message || t.buy_credits_error),
  });

  const createLtc = trpc.reseller.createLtcCreditsCharge.useMutation({
    onSuccess: (data) => {
      setLtcData({
        paymentId: data.paymentId,
        credits: data.credits,
        amountCents: data.amountCents,
        totalCost: data.credits,
        ltcAddress: data.ltcAddress,
        ltcAmount: data.ltcAmount,
        ltcPriceBrl: data.ltcPriceBrl,
        expiresAt: data.expiresAt,
      });
      setPaymentId(data.paymentId);
      setStep("pending-ltc");
    },
    onError: (err) => toast.error(err.message || t.buy_credits_error),
  });

  const { data: statusData, refetch: refetchStatus } = trpc.reseller.checkPixStatus.useQuery(
    { paymentId: activePaymentId },
    {
      enabled: (step === "pending-pix" || step === "pending-ltc") && !!activePaymentId,
      refetchInterval: (step === "pending-pix" || step === "pending-ltc") ? 4000 : false,
    }
  );

  useEffect(() => {
    if (statusData?.status === "paid" && (step === "pending-pix" || step === "pending-ltc")) {
      setStep("paid");
      toast.success(t.buy_credits_confirmed_title);
      onSuccess();
    }
  }, [statusData?.status, step, onSuccess]);

  const handleClose = useCallback(() => {
    setStep("select");
    setAmount("");
    setPixData(null);
    setLtcData(null);
    setPaymentId("");
    setCopied(false);
    setCopiedLtc(false);
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

  const handleCopyLtc = () => {
    if (!ltcData?.ltcAddress) return;
    navigator.clipboard.writeText(ltcData.ltcAddress).then(() => {
      setCopiedLtc(true);
      toast.success(language === "en" ? "LTC address copied!" : "Endereço LTC copiado!");
      setTimeout(() => setCopiedLtc(false), 2500);
    });
  };

  const handleContinue = () => {
    const n = parseInt(amount);
    if (!n || n < 600) { toast.error(language === "en" ? "Minimum recharge is 600 credits" : "Recarga mínima é de 600 créditos"); return; }
    setStep("method");
  };

  const handlePix = () => {
    const n = parseInt(amount);
    if (n < 600) { toast.error(language === "en" ? "Minimum recharge is 600 credits" : "Recarga mínima é de 600 créditos"); return; }
    createPix.mutate({ credits: n });
  };

  const handleLtc = () => {
    const n = parseInt(amount);
    if (n < 600) { toast.error(language === "en" ? "Minimum recharge is 600 credits" : "Recarga mínima é de 600 créditos"); return; }
    createLtc.mutate({ credits: n });
  };

  const presets = [10, 25, 50, 100, 250, 500];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full shadow-2xl" style={{ boxShadow: "none" }}>
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(13,10,25,0.98) 0%, rgba(18,12,35,0.98) 100%)",
            border: "1px solid rgba(16,185,129,0.25)",
            boxShadow: "0 0 60px rgba(16,185,129,0.12), 0 25px 50px rgba(0,0,0,0.6)",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.12))", border: "1px solid rgba(16,185,129,0.35)" }}>
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">{t.buy_credits_title}</h2>
                <p className="text-gray-500 text-xs">{step === "select" ? t.buy_credits_subtitle : step === "method" ? (language === "en" ? "Select payment method" : "Selecione o método") : step === "paid" ? (language === "en" ? "Payment confirmed" : "Pagamento confirmado") : (language === "en" ? "Complete your payment" : "Complete seu pagamento")}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Step: Select amount ── */}
          {step === "select" && (
            <div className="p-6 space-y-5">
              <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-wider">{t.buy_credits_current_balance}</p>
                    <p className="text-white font-mono font-bold text-sm">{currentCredits.toFixed(2)} <span className="text-emerald-400 text-xs">{t.general_credits}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-wider">{t.buy_credits_quick_values}</p>
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
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2 block">{t.buy_credits_or_type}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="600"
                    max="10000"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.buy_credits_placeholder}
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-700 pr-24 focus:border-emerald-500/50 focus:ring-emerald-500/10 h-12 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t.general_credits}</span>
                </div>
                {amount && parseInt(amount) > 0 && (
                  <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {language === "en" ? "Amount to pay:" : "Valor a pagar:"} <span className="font-mono font-bold">{fmt(parseInt(amount))}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-gray-500 text-xs">{t.buy_credits_rate}</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.03] bg-transparent h-11">
                  {t.buy_credits_cancel}
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!amount || parseInt(amount) < 600}
                  className="flex-1 h-11 rounded-xl font-semibold text-white gap-2"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
                >
                  {language === "en" ? "Continue" : "Continuar"} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Select method ── */}
          {step === "method" && (
            <div className="p-6 space-y-5">
              <div className="text-center pb-2">
                <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{language === "en" ? "Amount" : "Quantidade"}</p>
                <p className="text-white text-4xl font-bold font-mono">{amount}</p>
                <p className="text-emerald-400 text-sm">{t.general_credits}</p>
                <p className="text-gray-500 text-xs mt-2">{language === "en" ? "Select payment method" : "Selecione o método de pagamento"}</p>
              </div>

              <button
                onClick={handlePix}
                disabled={createPix.isPending}
                className="w-full group rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.08))", border: "1px solid rgba(34,197,94,0.3)" }}>
                    {createPix.isPending ? <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /> : <QrCode className="w-6 h-6 text-emerald-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base group-hover:text-emerald-300 transition-colors">Pix</p>
                    <p className="text-gray-500 text-xs">{language === "en" ? "Pay with QR code" : "Pagar com QR code"}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>

              <button
                onClick={handleLtc}
                disabled={createLtc.isPending}
                className="w-full group rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))", border: "1px solid rgba(251,191,36,0.25)" }}>
                    {createLtc.isPending ? <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" /> : <Bitcoin className="w-6 h-6 text-yellow-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base group-hover:text-yellow-300 transition-colors">Crypto (LTC)</p>
                    <p className="text-gray-500 text-xs">{language === "en" ? "Pay with Litecoin" : "Pagar com Litecoin"}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                </div>
              </button>

              <Button variant="outline" onClick={() => setStep("select")} className="w-full rounded-xl border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.03] bg-transparent h-11">
                {language === "en" ? "Back" : "Voltar"}
              </Button>
            </div>
          )}

          {/* ── Step: Pending Pix ── */}
          {step === "pending-pix" && pixData && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{t.buy_credits_amount_to_pay}</p>
                <p className="text-white text-4xl font-bold font-mono">{fmtCents(pixData.amountCents)}</p>
                <p className="text-emerald-400 text-sm mt-1">+{pixData.credits} {t.buy_credits_will_add}</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                {pixData.qrCodeImage ? (
                  <div className="rounded-2xl overflow-hidden p-4" style={{ background: "white", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <img src={pixData.qrCodeImage} alt="QR Code Pix" className="w-48 h-48 object-contain" />
                  </div>
                ) : pixData.brCode ? (
                  <div className="rounded-2xl overflow-hidden p-4" style={{ background: "white", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <QRCodeSVG value={pixData.brCode} size={192} />
                  </div>
                ) : (
                  <div className="w-52 h-52 rounded-2xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.05)", border: "2px dashed rgba(16,185,129,0.2)" }}>
                    <QrCode className="w-16 h-16 text-emerald-500/40" />
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(251,191,36,0.08)" }}>
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-xs font-medium">{t.buy_credits_waiting}</span>
                </div>
              </div>

              {pixData.brCode && (
                <div>
                  <p className="text-gray-500 text-xs mb-2 text-center">{t.buy_credits_or_copypaste}</p>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="px-4 py-3 bg-white/[0.02]">
                      <p className="text-gray-400 text-xs font-mono truncate">{pixData.brCode.slice(0, 60)}...</p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
                      style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(16,185,129,0.12)", color: copied ? "#4ade80" : "#34d399" }}
                    >
                      {copied ? <><CheckCircle2 className="w-4 h-4" /> {t.buy_credits_copied}</> : <><Copy className="w-4 h-4" /> {t.buy_credits_copy}</>}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.03] bg-transparent h-11 text-sm">
                  {t.buy_credits_close}
                </Button>
                <Button variant="outline" onClick={() => refetchStatus()} className="flex-1 rounded-xl border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 bg-transparent h-11 text-sm gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> {t.buy_credits_verify}
                </Button>
              </div>
              <p className="text-gray-600 text-xs text-center">{t.buy_credits_auto_check}</p>
            </div>
          )}

          {/* ── Step: Pending LTC ── */}
          {step === "pending-ltc" && ltcData && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{language === "en" ? "Amount to pay" : "Valor a pagar"}</p>
                <p className="text-white text-4xl font-bold font-mono">{fmtCents(ltcData.amountCents)}</p>
                <p className="text-yellow-400 text-sm mt-1">+{ltcData.credits} {t.general_credits}</p>
              </div>

              <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">{language === "en" ? "Send exactly" : "Envie exatamente"}</span>
                  <span className="text-yellow-400 font-mono font-bold text-base">{ltcData.ltcAmount.toFixed(6)} LTC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">{language === "en" ? "LTC price" : "Preço LTC"}</span>
                  <span className="text-gray-400 font-mono text-xs">R$ {ltcData.ltcPriceBrl.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-2 text-center">{language === "en" ? "Send LTC to this address" : "Envie LTC para este endereço"}</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <div className="px-4 py-3 bg-white/[0.02]">
                    <p className="text-gray-400 text-xs font-mono break-all">{ltcData.ltcAddress}</p>
                  </div>
                  <button
                    onClick={handleCopyLtc}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
                    style={{ background: copiedLtc ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.12)", color: copiedLtc ? "#4ade80" : "#fbbf24" }}
                  >
                    {copiedLtc ? <><CheckCircle2 className="w-4 h-4" /> {language === "en" ? "Copied" : "Copiado"}</> : <><Copy className="w-4 h-4" /> {language === "en" ? "Copy address" : "Copiar endereço"}</>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full mx-auto w-fit" style={{ background: "rgba(251,191,36,0.08)" }}>
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-xs font-medium">{language === "en" ? "Waiting for payment" : "Aguardando pagamento"}</span>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 rounded-xl border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.03] bg-transparent h-11 text-sm">
                  {t.buy_credits_close}
                </Button>
                <Button variant="outline" onClick={() => refetchStatus()} className="flex-1 rounded-xl border-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/5 bg-transparent h-11 text-sm gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> {language === "en" ? "Verify" : "Verificar"}
                </Button>
              </div>
              <p className="text-gray-600 text-xs text-center">{language === "en" ? "Payment will be confirmed automatically" : "O pagamento será confirmado automaticamente"}</p>
            </div>
          )}

          {/* ── Step: Paid ── */}
          {step === "paid" && (
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))", border: "2px solid rgba(16,185,129,0.35)" }}>
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1">{t.buy_credits_confirmed_title}</h3>
                <p className="text-gray-400 text-sm">
                  <span className="text-emerald-400 font-bold font-mono">+{pixData?.credits ?? ltcData?.credits}</span> {t.buy_credits_confirmed_desc}
                </p>
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
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
const chartTooltipStyle = {
  backgroundColor: "rgba(8,8,10,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
};

function CreditsProfile({ profile, refetch }: { profile: any; refetch: () => void }) {
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();
  const [showBuy, setShowBuy] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "credits" | "subresellers">("overview");
  const credits = parseFloat(String(profile.credits ?? "0"));

  const monthlyData = useMemo(() => {
    const groups: Record<string, number> = {};
    (profile.transactions || []).forEach((tx: any) => {
      const m = new Date(tx.createdAt).toISOString().slice(0, 7);
      groups[m] = (groups[m] || 0) + 1;
    });
    const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    const year = new Date().getFullYear().toString();
    return months.map((label, idx) => {
      const key = `${year}-${String(idx + 1).padStart(2, "0")}`;
      return { label, count: groups[key] || 0 };
    });
  }, [profile.transactions]);

  const tabButton = (id: "overview" | "credits" | "subresellers", label: string, icon: any) => {
    const Icon = icon;
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  const summaryCards = [
    { label: "Saldo", value: `${credits.toFixed(2)} cr`, sub: "disponível", icon: CreditCard },
    { label: t.profile_total_purchases, value: profile.totalPurchases, sub: "compras", icon: ShoppingBag },
    { label: t.profile_member_since, value: formatDate(profile.createdAt, language), sub: "registro", icon: Calendar },
    { label: language === "en" ? "Last access" : "Último acesso", value: formatDate(profile.lastLoginAt, language), sub: "login", icon: Clock },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.profile_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.profile_type_credits}</p>
        </div>
        <span className="self-start sm:self-auto text-xs px-3 py-2 rounded-full border font-semibold bg-yellow-500/15 text-yellow-400 border-yellow-500/30 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /> {language === "en" ? "Credits Reseller" : "Reseller Créditos"}
        </span>
      </div>

      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        {tabButton("overview", language === "en" ? "Overview" : "Visão Geral", LayoutDashboard)}
        {tabButton("credits", language === "en" ? "My Credits" : "Meus Créditos", CreditCard)}
        {profile.canCreateSubResellers && tabButton("subresellers", language === "en" ? "Sub Resellers" : "Sub Resellers", Users)}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(16,185,129,0.20)" }}>
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-white text-xl font-bold leading-none">{String(value)}</p>
                <p className="text-white/80 text-xs mt-1">{label}</p>
                <p className="text-emerald-400/80 text-[10px]">{sub}</p>
              </div>
            ))}
          </div>

          {/* Account */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><User className="w-4 h-4 text-emerald-400" /></div>
                <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-semibold">{profile.username}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-400" /></div>
                <div><p className="text-gray-500 text-xs">{t.profile_email}</p><p className="text-white text-sm font-semibold">{profile.email || "—"}</p></div>
              </div>
            </div>
            {[
              { label: t.profile_location, value: profile.location || "—", icon: MapPin, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`rounded-3xl p-5 ${bg} border ${border}`}>
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-4">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-lg font-semibold mt-1 truncate">{String(value)}</p>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> {language === "en" ? "Activity by month" : "Atividade por mês"}</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} />
                  <YAxis stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCredit)"
                    dot={{ r: 3, fill: "#34d399" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "credits" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Balance card */}
          <div className="rounded-3xl p-8 text-center" style={{ background: "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(8,8,10,0.75) 55%)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <p className="text-emerald-400/80 text-sm font-medium">{t.profile_balance}</p>
            </div>
            <p className="text-white text-5xl sm:text-6xl font-bold tracking-tight mb-6">{credits.toFixed(2)} <span className="text-xl sm:text-2xl text-emerald-400/70">cr</span></p>
            <Button
              onClick={() => setShowBuy(true)}
              className="font-semibold gap-2 h-11 px-6 text-sm text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}
            >
              <Plus className="w-4 h-4" /> {t.profile_buy_credits}
            </Button>
          </div>

          {/* Transactions */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
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
        </div>
      )}

      {activeTab === "subresellers" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <SubResellersSection />
        </div>
      )}

      <BuyCreditsModal
        open={showBuy}
        onClose={() => setShowBuy(false)}
        currentCredits={credits}
        onSuccess={() => { refetch(); }}
      />
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

  return (
    <div className="space-y-6">
      {profile.resellerType === "credits"
        ? <CreditsProfile profile={profile} refetch={refetch} />
        : <PercentageProfile profile={profile} otherStore={profile.resellerType === "other"} />}
    </div>
  );
}
