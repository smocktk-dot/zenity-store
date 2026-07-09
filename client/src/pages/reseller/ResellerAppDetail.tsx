import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Key, DollarSign, Clock, Star, Plus, ShoppingCart, CreditCard, Percent, CheckCircle, QrCode, Copy, CheckCircle2, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useCallback } from "react";

const levelColors: Record<string, string> = {
  basic: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  premium: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  lifetime: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
};

// ─── Credits Flow (Gerar Keys) ────────────────────────────────────────────────
function CreditsAppDetail({ app, id }: { app: any; id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ planId: "", quantity: "1", customMask: "", note: "" });

  const generateKeys = trpc.reseller.generateKeys.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.keys.length} key(s) gerada(s) com sucesso!`);
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
      <div className="space-y-4">
        {/* Credit balance bar */}
        <div className="rounded-xl border border-violet-500/20 p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.12) 0%, rgba(139,92,246,0.06) 100%)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">Saldo disponível</p>
              <p className="text-white font-bold font-mono text-base leading-tight">{credits.toFixed(2)} <span className="text-violet-400 text-sm font-semibold">créditos</span></p>
            </div>
          </div>

        </div>

        {/* Plans */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Planos Disponíveis</h3>
          {!app.plans?.length ? (
            <p className="text-gray-600 text-sm">Nenhum plano disponível</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {app.plans.map((plan: any) => {
                const price = parseFloat(String(plan.priceCredits)) * (1 - discount / 100);
                return (
                  <div key={plan.id} className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all cursor-pointer" style={{ background: "rgba(255,255,255,0.02)" }}
                    onClick={() => { setGenForm(f => ({...f, planId: String(plan.id)})); setShowGenerate(true); }}>
                    <div className="mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level] ?? levelColors.basic}`}>{plan.level}</span>
                    </div>
                    <h4 className="text-white font-semibold">{plan.name}</h4>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-yellow-400 font-bold font-mono text-sm">{price.toFixed(2)}</span>
                        <span className="text-gray-600 text-xs">cr</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 text-blue-400" />
                        {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3 text-xs h-7 font-semibold tracking-wide border-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)", color: "#a78bfa" }}>
                      <Key className="w-3 h-3 mr-1" /> Gerar Key
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features */}
        {app.features && (
          <div className="rounded-xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Features
            </h3>
            <div className="space-y-2">
              {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">Gerar Keys — {app.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-violet-500/20 p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.12) 0%, rgba(139,92,246,0.06) 100%)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-widest">Saldo</p>
                  <p className="text-white font-bold font-mono">{credits.toFixed(2)} <span className="text-violet-400 text-xs">cr</span></p>
                </div>
              </div>

            </div>

            <div>
              <Label className="text-gray-300 text-sm">Plano *</Label>
              <Select value={genForm.planId} onValueChange={v => setGenForm(f => ({...f, planId: v}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  {app.plans?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-white">
                      {p.name} — {(parseFloat(String(p.priceCredits)) * (1 - discount / 100)).toFixed(2)} cr ({p.durationDays >= 9000 ? "Lifetime" : `${p.durationDays}d`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Quantidade (1-100)</Label>
              <Input type="number" min="1" max="100" value={genForm.quantity} onChange={e => setGenForm(f => ({...f, quantity: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Nota (opcional)</Label>
              <textarea value={genForm.note} onChange={e => setGenForm(f => ({...f, note: e.target.value}))} placeholder="Nota para estas keys..." rows={2} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:border-red-500/50 placeholder:text-gray-700" />
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preço por key:</span>
                  <span className="text-white font-mono">{discountedPrice.toFixed(2)} cr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quantidade:</span>
                  <span className="text-white">{genForm.quantity}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-1.5 mt-1.5">
                  <span className="text-gray-300">Total:</span>
                  <span className={totalCost > credits ? "text-red-400" : "text-yellow-400"}>{totalCost.toFixed(2)} cr</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Saldo atual:</span>
                  <span className="text-gray-400 font-mono">{credits.toFixed(2)} cr</span>
                </div>
                {totalCost > credits && <p className="text-red-400 text-xs font-medium">⚠ Créditos insuficientes</p>}
              </div>
            )}

            <Button
              onClick={() => generateKeys.mutate({ appId: id, planId: parseInt(genForm.planId), quantity: parseInt(genForm.quantity), customMask: genForm.customMask || undefined, note: genForm.note || undefined })}
              disabled={generateKeys.isPending || !genForm.planId || totalCost > credits}
              className="w-full gap-2 font-bold tracking-wide text-sm h-11"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
            >
              <Key className="w-4 h-4" />
              {generateKeys.isPending ? "Gerando..." : `Gerar ${genForm.quantity} Key(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Percentage Flow (Comprar Keys) ──────────────────────────────────────────
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

  const { data: statusData, refetch: refetchStatus } = trpc.reseller.checkKeyPixStatus.useQuery(
    { paymentId: pixData?.paymentId || "" },
    {
      enabled: step === "pending" && !!pixData?.paymentId,
      refetchInterval: step === "pending" ? 4000 : false,
    }
  );

  useEffect(() => {
    if (statusData?.status === "paid" && step === "pending") {
      setStep("paid");
      setDeliveredKeys((statusData.keys as string[]) || []);
      toast.success(`Pagamento confirmado! ${(statusData.keys as string[]).length} key(s) entregue(s).`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.profile.invalidate();
    }
  }, [statusData?.status, step, utils]);

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
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      toast.success("Key copiada!");
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(139,92,246,0.15))", border: "1px solid rgba(124,58,237,0.4)" }}>
                <QrCode className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">Comprar Key — {planName}</h2>
                <p className="text-gray-500 text-xs">{quantity}x {appName} • Pagamento via Pix</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Pending ── */}
          {step === "pending" && pixData && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">Valor a pagar</p>
                <p className="text-white text-4xl font-bold font-mono">R$ {(pixData.amountCents / 100).toFixed(2)}</p>
                <p className="text-violet-400 text-sm mt-1">{quantity} key(s) serão entregues após o pagamento</p>
              </div>

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

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 border-white/10 text-gray-400 hover:text-gray-200 bg-transparent h-10 text-sm">Fechar</Button>
                <Button variant="outline" onClick={() => refetchStatus()} className="flex-1 border-violet-500/30 text-violet-400 hover:text-violet-300 bg-transparent h-10 text-sm gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Verificar
                </Button>
              </div>
              <p className="text-gray-600 text-xs text-center">Verificação automática a cada 4 segundos</p>
            </div>
          )}

          {/* ── Paid ── */}
          {step === "paid" && (
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))", border: "2px solid rgba(34,197,94,0.4)" }}>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1">Pagamento confirmado!</h3>
                <p className="text-gray-400 text-sm">{deliveredKeys.length} key(s) gerada(s) com sucesso</p>
              </div>
              {deliveredKeys.length > 0 && (
                <div className="w-full space-y-2">
                  {deliveredKeys.map((k) => (
                    <div key={k} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <Key className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-green-300 font-mono text-sm flex-1 text-left truncate">{k}</span>
                      <button onClick={() => handleCopyKey(k)} className="text-gray-500 hover:text-green-400 transition-colors">
                        {copiedKey === k ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleClose} className="w-full h-11 font-semibold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>
                Ver Minhas Keys
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Percentage Flow (Comprar Keys via Pix) ───────────────────────────────────
function PercentageAppDetail({ app, id }: { app: any; id: number }) {
  const utils = trpc.useUtils();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [pixData, setPixData] = useState<{ paymentId: string; brCode?: string; qrCodeImage?: string; amountCents: number; totalCost: number } | null>(null);

  const createKeyPix = trpc.reseller.createKeyPixCharge.useMutation({
    onSuccess: (data) => {
      setPixData({
        paymentId: data.paymentId,
        brCode: data.brCode,
        qrCodeImage: data.qrCodeImage,
        amountCents: data.amountCents,
        totalCost: data.totalCost,
      });
      setShowBuy(false);
      setShowPix(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBuy = () => {
    if (!selectedPlan) return;
    createKeyPix.mutate({ appId: id, planId: selectedPlan.id, quantity: parseInt(quantity) || 1 });
  };

  const discount = parseFloat(String(profile?.discountPercent ?? "35"));
  const planPrice = selectedPlan ? parseFloat(String(selectedPlan.pricePercentage ?? "0")) : 0;
  const discountedPrice = planPrice * (1 - discount / 100);
  const totalCost = discountedPrice * parseInt(quantity || "1");

  return (
    <>
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 font-bold text-sm">Overview</TabsTrigger>
          <TabsTrigger value="buy" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400 gap-1.5 font-bold text-sm">
            <ShoppingCart className="w-3.5 h-3.5" /> Comprar Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Discount bar */}
          <div className="rounded-xl border border-purple-500/20 p-4 flex items-center justify-between" style={{ background: "rgba(168,85,247,0.05)" }}>
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-sm">Seu desconto atual:</span>
              <span className="text-purple-400 font-bold text-lg">{discount.toFixed(0)}%</span>
            </div>
            {profile?.nextLevel && (
              <span className="text-gray-500 text-xs">Próximo nível: {(profile.nextLevel as any).discount}% após {(profile.nextLevel as any).target} compras</span>
            )}
          </div>

          {/* Plans */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Planos Disponíveis</h3>
            {!app.plans?.length ? (
              <p className="text-gray-600 text-sm">Nenhum plano disponível</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {app.plans.map((plan: any) => {
                  const original = parseFloat(String(plan.pricePercentage ?? "0"));
                  const withDiscount = original * (1 - discount / 100);
                  return (
                    <div key={plan.id} className="rounded-xl border border-white/10 p-4 hover:border-purple-500/30 transition-all cursor-pointer" style={{ background: "rgba(255,255,255,0.02)" }}
                      onClick={() => { setSelectedPlan(plan); setShowBuy(true); }}>
                      <div className="mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level] ?? levelColors.basic}`}>{plan.level}</span>
                      </div>
                      <h4 className="text-white font-semibold">{plan.name}</h4>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-400 font-bold font-mono text-sm">R$ {withDiscount.toFixed(2)}</span>
                          {discount > 0 && original > 0 && <span className="text-gray-600 text-xs line-through">R$ {original.toFixed(2)}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/30 transition-all text-xs h-7">
                        <ShoppingCart className="w-3 h-3 mr-1" /> Comprar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Features */}
          {app.features && (
            <div className="rounded-xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Features
              </h3>
              <div className="space-y-2">
                {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="buy" className="mt-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-xl border border-purple-500/20 p-4 flex items-center justify-between" style={{ background: "rgba(168,85,247,0.05)" }}>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">Desconto:</span>
                <span className="text-purple-400 font-bold">{discount.toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Plano *</Label>
              <Select value={selectedPlan ? String(selectedPlan.id) : ""} onValueChange={v => setSelectedPlan(app.plans?.find((p: any) => String(p.id) === v))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  {app.plans?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-white">
                      {p.name} — R$ {(parseFloat(String(p.pricePercentage ?? "0")) * (1 - discount / 100)).toFixed(2)} ({p.durationDays >= 9000 ? "Lifetime" : `${p.durationDays}d`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Quantidade (1-100)</Label>
              <Input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preço original:</span>
                  <span className="text-gray-400 font-mono line-through">R$ {planPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Com {discount.toFixed(0)}% desconto:</span>
                  <span className="text-purple-400 font-mono">R$ {discountedPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-1.5 mt-1.5">
                  <span className="text-gray-300">Total ({quantity}x):</span>
                  <span className="text-purple-400">R$ {totalCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleBuy}
              disabled={createKeyPix.isPending || !selectedPlan}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {createKeyPix.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando Pix...</> : `Comprar ${quantity} Key(s)`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pix Key Modal */}
      <PixKeyModal
        open={showPix}
        onClose={() => setShowPix(false)}
        pixData={pixData}
        appName={app.name}
        planName={selectedPlan?.name || ""}
        quantity={parseInt(quantity) || 1}
      />

      {/* Buy Modal (from plan card click) */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-purple-400" /> Comprar Key — {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-purple-500/20 p-3" style={{ background: "rgba(168,85,247,0.05)" }}>
              <p className="text-purple-400/80 text-xs">Desconto atual: <span className="font-bold text-purple-400">{discount.toFixed(0)}%</span></p>
              <p className="text-gray-400 text-xs mt-1">
                Preço com desconto: <span className="text-purple-400 font-mono font-bold">R$ {(parseFloat(String(selectedPlan?.pricePercentage ?? "0")) * (1 - discount / 100)).toFixed(2)}</span>
              </p>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Quantidade</Label>
              <Input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBuy(false)} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
              <Button onClick={handleBuy} disabled={createKeyPix.isPending} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
                {createKeyPix.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ResellerAppDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: app, isLoading } = trpc.reseller.appDetail.useQuery({ appId: id });
  const { data: profile } = trpc.reseller.profile.useQuery();

  if (isLoading) return <div className="text-gray-500 py-8 text-center animate-pulse">Carregando...</div>;
  if (!app) return <div className="text-gray-500 py-8 text-center">App não encontrado</div>;

  const resellerType = profile?.resellerType ?? "credits";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/reseller/apps")} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-2xl font-bold">{app.name}</h1>
          <p className="text-gray-500 text-sm">{app.description || "Sem descrição"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 font-mono">{app.version}</span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${app.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
            {app.status}
          </span>
          {resellerType === "credits"
            ? <span className="text-xs px-2 py-1 rounded-full border font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Créditos</span>
            : <span className="text-xs px-2 py-1 rounded-full border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1"><Percent className="w-3 h-3" /> Porcentagem</span>
          }
        </div>
      </div>

      {resellerType === "percentage"
        ? <PercentageAppDetail app={app} id={id} />
        : <CreditsAppDetail app={app} id={id} />
      }
    </div>
  );
}
