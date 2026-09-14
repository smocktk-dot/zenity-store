import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Key, DollarSign, Clock, Star, Plus, ShoppingCart, CreditCard,
  Percent, CheckCircle, QrCode, Copy, CheckCircle2, Loader2, RefreshCw, X,
  Bitcoin, Wallet, AlertTriangle, Download, Film, ShieldCheck, Sparkles,
  TrendingUp, Tag, Layers, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { QRCodeSVG } from "qrcode.react";

const levelColors: Record<string, string> = {
  basic: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  premium: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
  lifetime: "text-amber-400 bg-amber-500/20 border-amber-500/30",
};

// ─── Credits Flow (Gerar Keys) ────────────────────────────────────────────────
function CreditsAppDetail({ app, id }: { app: any; id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ planId: "", quantity: "1", customMask: "", note: "" });
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();

  const generateKeys = trpc.reseller.generateKeys.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.keys.length} ${language === "en" ? "key(s) generated successfully!" : "key(s) gerada(s) com sucesso!"}`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.profile.invalidate();
      setShowGenerate(false);
      setGenForm({ planId: "", quantity: "1", customMask: "", note: "" });
      navigate("/reseller/keys");
    },
    onError: e => toast.error(e.message),
  });

  const credits = parseFloat(String(profile?.credits ?? "0"));
  const discount = parseFloat(String(profile?.discountPercent ?? "0"));
  const selectedPlan = app.plans?.find((p: any) => String(p.id) === genForm.planId);
  const planPrice = selectedPlan ? parseFloat(String(selectedPlan.priceCredits)) : 0;
  const discountedPrice = planPrice * (1 - discount / 100);
  const totalCost = discountedPrice * parseInt(genForm.quantity || "1");

  return (
    <>
      <div className="space-y-6">
        {/* Credit balance banner */}
        <div
          className="relative rounded-3xl p-6 sm:p-7 overflow-hidden border border-emerald-500/20"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.06) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(16,185,129,0.2)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CreditCard className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                  {language === "en" ? "Available Balance" : "Seu Saldo em Créditos"}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-white font-bold font-mono text-3xl leading-none">{credits.toFixed(2)}</span>
                  <span className="text-emerald-400 text-sm font-semibold">{t.general_credits}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:border-l sm:border-white/10 sm:pl-6">
              <div className="text-left sm:text-right">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  {language === "en" ? "Your Discount" : "Desconto Aplicado"}
                </p>
                <p className="text-emerald-400 font-bold font-mono text-2xl mt-0.5">{discount.toFixed(0)}% OFF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2.5">
                <Key className="w-5 h-5 text-emerald-400" /> {t.apps_available_plans}
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Selecione o plano desejado para gerar suas licenças instantaneamente</p>
            </div>
          </div>

          {!app.plans?.length ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
              <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{t.apps_no_plans}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {app.plans.map((plan: any) => {
                const original = parseFloat(String(plan.priceCredits));
                const price = original * (1 - discount / 100);
                const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));
                return (
                  <div
                    key={plan.id}
                    className="group relative rounded-3xl border border-white/[0.08] p-5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {plan.durationDays >= 9000 ? t.apps_lifetime : `${plan.durationDays} ${t.apps_days}`}
                        </span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-xl border font-bold uppercase tracking-wider ${levelColors[plan.level] ?? levelColors.basic}`}>
                          {plan.level}
                        </span>
                      </div>

                      {/* Plan Title */}
                      <h4 className="text-white font-bold text-lg mb-4 group-hover:text-emerald-300 transition-colors">
                        {plan.name}
                      </h4>

                      {/* Price Block */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] mb-5 space-y-3">
                        <div>
                          <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Custo do Revendedor</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-emerald-400 font-extrabold font-mono text-2xl leading-none">{price.toFixed(2)}</span>
                            <span className="text-emerald-400/70 text-xs font-semibold">cr</span>
                            {discount > 0 && original > 0 && (
                              <span className="text-gray-500 text-xs line-through ml-1">{original.toFixed(2)} cr</span>
                            )}
                          </div>
                        </div>

                        {suggestedSell > 0 && (
                          <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                            <span className="text-gray-400">{language === "en" ? "Suggested Sell" : "Preço de Venda"}</span>
                            <span className="text-white font-mono font-bold">R$ {suggestedSell.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => { setGenForm(f => ({...f, planId: String(plan.id)})); setShowGenerate(true); }}
                      className="w-full h-11 rounded-2xl text-xs font-bold tracking-wide border-0 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}
                    >
                      <Key className="w-4 h-4 mr-2" /> {t.apps_generate_key}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features */}
        {app.features && (
          <div className="rounded-3xl border border-white/[0.08] p-6 sm:p-7" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)" }}>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400" /> {t.apps_features}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent
          className="bg-[#0b1311] border border-emerald-500/20 text-white max-w-md rounded-3xl p-0 overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(16,185,129,0.12)" }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="p-6 sm:p-7 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-white font-bold text-lg">{t.apps_generate_key}</DialogTitle>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedPlan?.name} — {app.name}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-2xl border border-white/[0.08] p-4 bg-black/40 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Custo Total</p>
                <p className="text-emerald-400 font-bold font-mono text-2xl mt-0.5">{totalCost.toFixed(2)} cr</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase font-semibold">Seu Saldo</p>
                <p className={`font-mono font-bold text-sm mt-1 ${credits >= totalCost ? "text-white" : "text-red-400"}`}>
                  {credits.toFixed(2)} cr
                </p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">{t.general_quantity}</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={genForm.quantity}
                onChange={e => setGenForm(f => ({ ...f, quantity: e.target.value }))}
                className="bg-black/40 border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 text-white rounded-xl h-11"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">Nota / Cliente (Opcional)</Label>
              <Input
                placeholder="Ex: Cliente João"
                value={genForm.note}
                onChange={e => setGenForm(f => ({ ...f, note: e.target.value }))}
                className="bg-black/40 border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 text-white rounded-xl h-11"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerate(false)}
                className="flex-1 h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white"
              >
                {t.apps_cancel}
              </Button>
              <Button
                onClick={() => generateKeys.mutate({
                  appId: id,
                  planId: parseInt(genForm.planId),
                  quantity: parseInt(genForm.quantity || "1"),
                  customMask: genForm.customMask || undefined,
                  note: genForm.note || undefined,
                })}
                disabled={generateKeys.isPending || credits < totalCost}
                className="flex-1 h-12 rounded-2xl font-bold border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 text-white"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                <Key className="w-4 h-4 mr-2" />
                {generateKeys.isPending ? t.apps_generating : `${language === "en" ? "Generate" : "Gerar"} ${genForm.quantity} Key(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Payment Method Selection Modal ───────────────────────────────────────────
function PaymentMethodModal({
  open, onClose, onSelectPix, onSelectCrypto, isLoadingPix, isLoadingCrypto, hideLtc,
}: {
  open: boolean;
  onClose: () => void;
  onSelectPix: () => void;
  onSelectCrypto: () => void;
  isLoadingPix: boolean;
  isLoadingCrypto: boolean;
  hideLtc?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-sm w-full shadow-2xl" style={{ boxShadow: "none" }}>
        <div
          className="relative rounded-3xl overflow-hidden border border-emerald-500/25"
          style={{
            background: "linear-gradient(170deg, #0b1311 0%, #070a09 100%)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(16,185,129,0.12)",
          }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">{t.payment_select_method}</h2>
                <p className="text-gray-400 text-xs">Escolha como deseja pagar</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-3">
            {/* PIX Option */}
            <button
              onClick={onSelectPix}
              disabled={isLoadingPix || isLoadingCrypto}
              className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  {isLoadingPix ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.payment_pix}</p>
                  <p className="text-gray-400 text-xs">{t.payment_pix_desc}</p>
                </div>
                {!isLoadingPix && (
                  <div className="ml-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>
                )}
              </div>
            </button>

            {/* Crypto (LTC) Option */}
            {!hideLtc && (
              <button
                onClick={onSelectCrypto}
                disabled={isLoadingPix || isLoadingCrypto}
                className="w-full rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/[0.08] hover:bg-amber-500/[0.14]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    {isLoadingCrypto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bitcoin className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.payment_crypto}</p>
                    <p className="text-gray-400 text-xs">{t.payment_crypto_desc}</p>
                  </div>
                  {!isLoadingCrypto && (
                    <div className="ml-auto">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pix Key Modal ────────────────────────────────────────────────────────────
type PixKeyStep = "pending" | "paid";

function PixKeyModal({
  open, onClose, pixData, appName, planName, quantity,
}: {
  open: boolean;
  onClose: () => void;
  pixData: { paymentId: string; brCode?: string; qrCodeImage?: string; amountCents: number; totalCost: number } | null;
  appName: string;
  planName: string;
  quantity: number;
}) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<PixKeyStep>("pending");
  const [copied, setCopied] = useState(false);
  const [deliveredKeys, setDeliveredKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { t } = useLanguage();
  const { fmtCents } = useCurrency();

  const { data: statusData } = trpc.reseller.checkKeyPixStatus.useQuery(
    { paymentId: pixData?.paymentId || "" },
    {
      enabled: step === "pending" && !!pixData?.paymentId,
      refetchInterval: step === "pending" ? 3000 : false,
    }
  );

  useEffect(() => {
    if (statusData?.status === "paid" && step === "pending") {
      setStep("paid");
      setDeliveredKeys((statusData.keys as string[]) || []);
      toast.success(`${(statusData.keys as string[]).length} ${t.pix_keys_delivered}`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.profile.invalidate();
    }
  }, [statusData?.status, step, utils, t.pix_keys_delivered]);

  const handleClose = useCallback(() => {
    setStep("pending");
    setCopied(false);
    setCopiedKey(null);
    setDeliveredKeys([]);
    onClose();
    if (step === "paid") navigate("/reseller/keys");
  }, [onClose, step, navigate]);

  const handleCopy = () => {
    if (!pixData?.brCode) return;
    navigator.clipboard.writeText(pixData.brCode).then(() => {
      setCopied(true);
      toast.success(t.pix_copied);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      toast.success(t.general_copied);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full shadow-2xl" style={{ boxShadow: "none" }}>
        <div
          className="relative rounded-3xl overflow-hidden border border-emerald-500/25"
          style={{
            background: "linear-gradient(170deg, #0b1311 0%, #070a09 100%)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(16,185,129,0.12)",
          }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">{t.pix_title}</h2>
                <p className="text-gray-400 text-xs">{quantity}x {appName} — {planName}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === "pending" && pixData && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t.pix_amount_to_pay}</p>
                <p className="text-white text-3xl font-extrabold font-mono mt-1">
                  <span className="text-emerald-400">{fmtCents(pixData.amountCents)}</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">{quantity} key(s) liberada(s) automaticamente</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center my-2">
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                  {pixData.qrCodeImage ? (
                    <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                  ) : pixData.brCode ? (
                    <QRCodeSVG value={pixData.brCode} size={192} />
                  ) : null}
                </div>
              </div>

              {pixData.brCode && (
                <div>
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  >
                    {copied ? <><CheckCircle2 className="w-4 h-4" /> {t.pix_copied}</> : <><Copy className="w-4 h-4" /> {t.pix_copy_code}</>}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>{t.pix_waiting_payment}</span>
              </div>
            </div>
          )}

          {step === "paid" && (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{t.pix_paid_title}</h3>
                <p className="text-gray-400 text-xs mt-1">{deliveredKeys.length} {t.pix_keys_delivered}</p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deliveredKeys.map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-emerald-300 truncate">{key}</span>
                    <button onClick={() => handleCopyKey(key)} className="text-gray-400 hover:text-emerald-400 p-1">
                      {copiedKey === key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>

              <Button onClick={handleClose} className="w-full h-12 rounded-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {t.pix_see_keys}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── LTC Key Modal ────────────────────────────────────────────────────────────
type LtcKeyStep = "pending" | "paid";

function LtcKeyModal({
  open, onClose, ltcData, appName, planName, quantity,
}: {
  open: boolean;
  onClose: () => void;
  ltcData: {
    paymentId: string;
    amountCents: number;
    totalCost: number;
    ltcAddress: string;
    ltcAmount: number;
    ltcPriceBrl: number;
    expiresAt?: string;
  } | null;
  appName: string;
  planName: string;
  quantity: number;
}) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<LtcKeyStep>("pending");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [deliveredKeys, setDeliveredKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { t } = useLanguage();
  const { fmt, fmtCents } = useCurrency();

  const { data: statusData } = trpc.reseller.checkKeyLtcStatus.useQuery(
    { paymentId: ltcData?.paymentId || "" },
    {
      enabled: step === "pending" && !!ltcData?.paymentId,
      refetchInterval: step === "pending" ? 4000 : false,
    }
  );

  useEffect(() => {
    if (statusData?.status === "paid" && step === "pending") {
      setStep("paid");
      setDeliveredKeys((statusData.keys as string[]) || []);
      toast.success(`${t.ltc_confirmed} ${(statusData.keys as string[]).length} ${t.ltc_keys_delivered}.`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.profile.invalidate();
    }
  }, [statusData?.status, step, utils, t]);

  const handleClose = useCallback(() => {
    setStep("pending");
    setCopiedAddress(false);
    setCopiedKey(null);
    setDeliveredKeys([]);
    onClose();
    if (step === "paid") navigate("/reseller/keys");
  }, [onClose, step, navigate]);

  const handleCopyAddress = () => {
    if (!ltcData?.ltcAddress) return;
    navigator.clipboard.writeText(ltcData.ltcAddress).then(() => {
      setCopiedAddress(true);
      toast.success(t.ltc_copied);
      setTimeout(() => setCopiedAddress(false), 2500);
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      toast.success(t.general_copied);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="p-0 border-0 bg-transparent max-w-md w-full shadow-2xl" style={{ boxShadow: "none" }}>
        <div
          className="relative rounded-3xl overflow-hidden border border-amber-500/25"
          style={{
            background: "linear-gradient(170deg, #0b1311 0%, #070a09 100%)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(251,191,36,0.12)",
          }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Bitcoin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">{t.ltc_title}</h2>
                <p className="text-gray-400 text-xs">{quantity}x {appName} — {planName}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === "pending" && ltcData && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t.ltc_amount_to_pay}</p>
                <p className="text-white text-3xl font-extrabold font-mono mt-1">
                  <span className="text-amber-400">{ltcData.ltcAmount.toFixed(6)}</span>
                  <span className="text-gray-400 text-sm ml-2">LTC</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {t.ltc_brl_value}: <span className="text-white font-mono font-bold">{fmtCents(ltcData.amountCents)}</span>
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">{t.ltc_address}</p>
                <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center justify-between gap-2">
                  <p className="text-amber-300 text-xs font-mono break-all">{ltcData.ltcAddress}</p>
                  <button onClick={handleCopyAddress} className="text-gray-400 hover:text-amber-400 p-1.5 shrink-0">
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Aguardando confirmação na rede Litecoin...</span>
              </div>
            </div>
          )}

          {step === "paid" && (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-white font-bold text-lg">{t.ltc_paid_title}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deliveredKeys.map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                    <span className="font-mono text-xs text-emerald-300 truncate">{key}</span>
                    <button onClick={() => handleCopyKey(key)} className="text-gray-400 hover:text-emerald-400 p-1">
                      {copiedKey === key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {t.ltc_see_keys}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Percentage Flow (Comprar Keys via Pix ou Crypto) ─────────────────────────
function PercentageAppDetail({ app, id, otherStore }: { app: any; id: number; otherStore?: boolean }) {
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [showMethodSelect, setShowMethodSelect] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [showLtc, setShowLtc] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [pixData, setPixData] = useState<{ paymentId: string; brCode?: string; qrCodeImage?: string; amountCents: number; totalCost: number } | null>(null);
  const [ltcData, setLtcData] = useState<{
    paymentId: string;
    amountCents: number;
    totalCost: number;
    ltcAddress: string;
    ltcAmount: number;
    ltcPriceBrl: number;
    expiresAt?: string;
  } | null>(null);
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();

  const createKeyPix = trpc.reseller.createKeyPixCharge.useMutation({
    onSuccess: (data) => {
      setPixData({
        paymentId: data.paymentId,
        brCode: data.brCode,
        qrCodeImage: data.qrCodeImage,
        amountCents: data.amountCents,
        totalCost: data.totalCost,
      });
      setShowMethodSelect(false);
      setShowBuy(false);
      setShowPix(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const createOtherStorePix = trpc.reseller.createOtherStoreSplitCharge.useMutation({
    onSuccess: (data: any) => {
      setPixData({
        paymentId: data.paymentId,
        brCode: data.brCode,
        qrCodeImage: data.qrCodeImage,
        amountCents: data.amountCents,
        totalCost: data.totalCost ?? data.amountCents / 100,
      });
      setShowMethodSelect(false);
      setShowBuy(false);
      setShowLtc(false);
      setShowPix(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const createKeyLtc = trpc.reseller.createKeyLtcCharge.useMutation({
    onSuccess: (data) => {
      setLtcData({
        paymentId: data.paymentId,
        amountCents: data.amountCents,
        totalCost: data.totalCost,
        ltcAddress: data.ltcAddress,
        ltcAmount: data.ltcAmount,
        ltcPriceBrl: data.ltcPriceBrl,
        expiresAt: data.expiresAt,
      });
      setShowMethodSelect(false);
      setShowBuy(false);
      setShowLtc(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBuy = () => {
    if (!selectedPlan) return;
    setShowBuy(false);
    setShowMethodSelect(true);
  };

  const handleSelectPix = () => {
    if (!selectedPlan) return;
    if (otherStore) {
      createOtherStorePix.mutate({ appId: id, planId: selectedPlan.id, quantity: parseInt(quantity) || 1 });
    } else {
      createKeyPix.mutate({ appId: id, planId: selectedPlan.id, quantity: parseInt(quantity) || 1 });
    }
  };

  const handleSelectCrypto = () => {
    if (!selectedPlan) return;
    createKeyLtc.mutate({ appId: id, planId: selectedPlan.id, quantity: parseInt(quantity) || 1 });
  };

  const discount = parseFloat(String(profile?.discountPercent ?? "0"));
  const planPrice = selectedPlan ? parseFloat(String(selectedPlan.pricePercentage ?? "0")) : 0;
  const discountedPrice = planPrice * (1 - discount / 100);
  const totalCost = discountedPrice * parseInt(quantity || "1");

  return (
    <>
      <Tabs defaultValue="overview" className="w-full">
        {/* Modern Tabs */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1.5 rounded-2xl flex gap-1 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/30 border border-transparent text-gray-400 text-sm font-semibold rounded-xl px-5 py-2.5 transition-all flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              {t.apps_overview}
            </TabsTrigger>
            <TabsTrigger
              value="downloads"
              className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/30 border border-transparent text-gray-400 text-sm font-semibold rounded-xl px-5 py-2.5 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Downloads & Tutoriais
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-7">
          {/* Discount Hero Banner */}
          <div
            className="relative rounded-3xl p-6 sm:p-7 overflow-hidden border border-emerald-500/25"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.06) 100%)",
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(16,185,129,0.2)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Percent className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                      {t.apps_current_discount}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      ATIVO
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-white font-extrabold font-mono text-3xl sm:text-4xl leading-none">
                      {discount.toFixed(0)}% OFF
                    </span>
                    <span className="text-gray-400 text-xs hidden md:inline">aplicado automaticamente nos preços</span>
                  </div>
                </div>
              </div>

              {profile?.nextLevel && (
                <div className="sm:border-l sm:border-white/10 sm:pl-6 text-left sm:text-right">
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t.apps_next_level}</p>
                  <p className="text-emerald-400 text-base font-bold mt-0.5">
                    +{(profile.nextLevel as any)?.purchasesNeeded} {language === "en" ? "purchases to upgrade" : "compras para subir"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Plans Section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-xl flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" /> {t.apps_available_plans}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">Escolha a duração e faça a compra instantânea da sua chave</p>
              </div>
            </div>

            {!app.plans?.length ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
                <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t.apps_no_plans}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {app.plans.map((plan: any) => {
                  const original = parseFloat(String(plan.pricePercentage ?? "0"));
                  const withDiscount = original * (1 - discount / 100);
                  const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));
                  const estimatedProfit = suggestedSell > withDiscount ? suggestedSell - withDiscount : 0;
                  const profitPercentage = withDiscount > 0 ? ((estimatedProfit / withDiscount) * 100).toFixed(0) : 0;

                  return (
                    <div
                      key={plan.id}
                      className="group relative rounded-3xl border border-white/[0.08] p-5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all flex flex-col justify-between"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {plan.durationDays >= 9000 ? t.apps_lifetime : `${plan.durationDays} ${t.apps_days}`}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-xl border font-bold uppercase tracking-wider ${levelColors[plan.level] ?? levelColors.basic}`}>
                            {plan.level}
                          </span>
                        </div>

                        {/* Plan Title */}
                        <h4 className="text-white font-bold text-lg mb-4 group-hover:text-emerald-300 transition-colors">
                          {plan.name}
                        </h4>

                        {/* Price Block */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] mb-5 space-y-3">
                          <div>
                            <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider">Custo Revendedor</p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-emerald-400 font-extrabold font-mono text-2xl leading-none">
                                {fmt(withDiscount)}
                              </span>
                              {discount > 0 && original > 0 && (
                                <span className="text-gray-500 text-xs line-through ml-1">{fmt(original)}</span>
                              )}
                            </div>
                          </div>

                          {suggestedSell > 0 && (
                            <div className="pt-2.5 border-t border-white/[0.06] space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">{language === "en" ? "Suggested Sell" : "Preço de Venda"}</span>
                                <span className="text-white font-mono font-bold">{fmt(suggestedSell)}</span>
                              </div>
                              {estimatedProfit > 0 && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-emerald-400/80 font-medium">Lucro Estimado</span>
                                  <span className="text-emerald-400 font-mono font-bold">+{fmt(estimatedProfit)} ({profitPercentage}%)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => { setSelectedPlan(plan); setShowBuy(true); }}
                        className="w-full h-11 rounded-2xl text-xs font-bold tracking-wide border-0 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" /> {t.apps_buy}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Features */}
          {app.features && (
            <div className="rounded-3xl border border-white/[0.08] p-6 sm:p-7" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)" }}>
              <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-400" /> {t.apps_features}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="downloads" className="mt-6">
          <ResellerDownloads appId={id} />
        </TabsContent>
      </Tabs>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        open={showMethodSelect}
        onClose={() => setShowMethodSelect(false)}
        onSelectPix={handleSelectPix}
        onSelectCrypto={handleSelectCrypto}
        isLoadingPix={otherStore ? createOtherStorePix.isPending : createKeyPix.isPending}
        isLoadingCrypto={createKeyLtc.isPending}
        hideLtc={otherStore}
      />

      {/* Pix Key Modal */}
      <PixKeyModal
        open={showPix}
        onClose={() => setShowPix(false)}
        pixData={pixData}
        appName={app.name}
        planName={selectedPlan?.name || ""}
        quantity={parseInt(quantity) || 1}
      />

      {/* LTC Key Modal */}
      <LtcKeyModal
        open={showLtc}
        onClose={() => setShowLtc(false)}
        ltcData={ltcData}
        appName={app.name}
        planName={selectedPlan?.name || ""}
        quantity={parseInt(quantity) || 1}
      />

      {/* Buy Modal (from plan card click) */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent
          className="bg-[#0b1311] border border-emerald-500/20 text-white max-w-sm rounded-3xl p-0 overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(16,185,129,0.12)" }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-white font-bold text-base">{language === "en" ? "Buy Key" : "Comprar Chave"}</DialogTitle>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedPlan?.name} — {app.name}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-2xl border border-white/[0.08] p-4 bg-black/40 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase">{t.apps_current_discount}</p>
                <p className="text-emerald-400 font-extrabold text-2xl mt-0.5">{discount.toFixed(0)}% OFF</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-semibold uppercase">{language === "en" ? "Unit Price" : "Preço Unitário"}</p>
                <p className="text-white font-mono font-bold text-xl mt-0.5">
                  R$ {(parseFloat(String(selectedPlan?.pricePercentage ?? "0")) * (1 - discount / 100)).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2 block">{t.general_quantity}</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="bg-black/40 border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 text-white rounded-xl h-11"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowBuy(false)}
                className="flex-1 h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:text-white"
              >
                {t.apps_cancel}
              </Button>
              <Button
                onClick={handleBuy}
                disabled={createKeyPix.isPending || createKeyLtc.isPending}
                className="flex-1 h-12 rounded-2xl font-bold border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 text-white"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                {(createKeyPix.isPending || createKeyLtc.isPending) ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === "en" ? "Loading..." : "Carregando..."}</>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> {t.apps_confirm}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Downloads Tab ─────────────────────────────────────────────────────────────
function ResellerDownloads({ appId }: { appId: number }) {
  const { data: downloads = [], isLoading } = trpc.reseller.getDownloadsByApp.useQuery({ appId });
  const downloadItems = downloads.filter((d: any) => d.type === "download");
  const tutorialItems = downloads.filter((d: any) => d.type === "tutorial");

  if (isLoading) return <div className="text-gray-500 text-sm py-8 text-center animate-pulse">Carregando downloads...</div>;

  return (
    <div className="space-y-6">
      {downloadItems.length > 0 && (
        <div>
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" /> Arquivos para Download
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloadItems.map((d: any) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-white/[0.08] p-5 hover:border-emerald-500/40 bg-white/[0.02] hover:bg-emerald-500/[0.03] transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-emerald-300 transition-colors">{d.title}</p>
                  <p className="text-gray-500 text-xs mt-1">Clique para iniciar o download do arquivo</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {tutorialItems.length > 0 && (
        <div>
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-400" /> Tutoriais e Vídeos Explicativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorialItems.map((d: any) => (
              <div key={d.id} className="rounded-2xl border border-white/[0.08] p-5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold text-sm">{d.title}</p>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Film className="w-3.5 h-3.5" /> Abrir link
                  </a>
                </div>
                {d.videoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-black/60 border border-white/[0.06]">
                    <iframe
                      src={d.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {downloads.length === 0 && (
        <div className="text-center py-12 rounded-3xl border border-dashed border-white/10 bg-white/[0.01]">
          <Download className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum download ou tutorial cadastrado para este aplicativo.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ResellerAppDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: app, isLoading } = trpc.reseller.appDetail.useQuery({ appId: id });
  const { data: profile } = trpc.reseller.profile.useQuery();
  const { t, language } = useLanguage();

  if (isLoading) return <div className="text-gray-500 py-12 text-center animate-pulse">{t.apps_loading_app}</div>;
  if (!app) return <div className="text-gray-500 py-12 text-center">{t.apps_not_found}</div>;

  const resellerType = profile?.resellerType ?? "credits";

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 border border-white/[0.08] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(16,185,129,0.04) 100%)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <button
              onClick={() => navigate("/reseller/apps")}
              className="p-3 rounded-2xl text-gray-400 hover:text-white bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/20 transition-all shrink-0"
              title="Voltar aos apps"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">{app.name}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] text-gray-300 font-mono border border-white/[0.08]">
                  {app.version || "v1.0"}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${
                  app.status === "active"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${app.status === "active" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-gray-400"}`} />
                  {app.status === "active" ? t.general_active : app.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
                {app.description || t.general_no_description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {resellerType === "credits" ? (
              <span className="text-xs px-3.5 py-2 rounded-2xl border font-bold bg-yellow-500/15 text-yellow-400 border-yellow-500/30 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> {language === "en" ? "Credits Reseller" : "Revendedor de Créditos"}
              </span>
            ) : (
              <span className="text-xs px-3.5 py-2 rounded-2xl border font-bold bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-2">
                <Percent className="w-4 h-4" /> {language === "en" ? "Percentage Reseller" : "Revendedor com Porcentagem"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {resellerType === "credits" ? (
        <CreditsAppDetail app={app} id={id} />
      ) : (
        <PercentageAppDetail app={app} id={id} otherStore={resellerType === "other"} />
      )}
    </div>
  );
}
