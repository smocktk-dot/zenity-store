import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Key, Clock, Star, ShoppingCart, CreditCard,
  Percent, CheckCircle, QrCode, Copy, CheckCircle2, Loader2, X,
  Bitcoin, Wallet, Download, Film, ShieldCheck, Tag,
  LayoutGrid, List, Check, Zap, ExternalLink, RefreshCw, XCircle, Ban, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { QRCodeSVG } from "qrcode.react";

// ─── Credits Flow (Gerar Keys) — também usado por resellers Unlimited ────────
function CreditsAppDetail({ app, id, isUnlimited = false }: { app: any; id: number; isUnlimited?: boolean }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ planId: "", quantity: "1", customMask: "", note: "" });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();

  const generateKeys = trpc.reseller.generateKeys.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.keys.length} ${language === "en" ? "key(s) generated successfully!" : "key(s) gerada(s) com sucesso!"}`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.myKeysByApp.invalidate();
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
      <Tabs defaultValue="overview" className="w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-5">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl flex gap-1 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all"
            >
              Visão Geral & Planos
            </TabsTrigger>
            <TabsTrigger
              value="keys"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Minhas Keys
            </TabsTrigger>
            <TabsTrigger
              value="downloads"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Downloads
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
      <div className="space-y-5">
        {/* Strip de Métricas Compacta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isUnlimited ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{isUnlimited ? "Assinatura" : "Saldo Disponível"}</p>
                {isUnlimited ? (
                  <p className="text-white font-bold font-mono text-lg">
                    {(profile as any)?.subscriptionExpiresAt
                      ? new Date((profile as any).subscriptionExpiresAt).toLocaleDateString("pt-BR")
                      : "—"}
                    <span className="text-violet-400 text-xs"> expira</span>
                  </p>
                ) : (
                  <p className="text-white font-bold font-mono text-lg">{credits.toFixed(2)} <span className="text-emerald-400 text-xs">cr</span></p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isUnlimited ? "bg-violet-500/10 border border-violet-500/20 text-violet-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}>
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{isUnlimited ? "Custo por Key" : "Desconto Ativo"}</p>
                <p className={`font-bold font-mono text-lg ${isUnlimited ? "text-violet-400" : "text-emerald-400"}`}>
                  {isUnlimited ? "Grátis" : `${discount.toFixed(0)}% OFF`}
                </p>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${isUnlimited ? "bg-violet-500/15 text-violet-300 border-violet-500/25" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"}`}>
              {isUnlimited ? "UNLIMITED" : "APLICADO"}
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Entrega</p>
              <p className="text-white font-semibold text-sm">Geração Instantânea</p>
            </div>
          </div>
        </div>

        {/* Planos Disponíveis */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" /> Planos Disponíveis
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">{isUnlimited ? "Selecione o plano e gere as chaves — incluído na sua assinatura" : "Selecione o plano desejado para debitar dos seus créditos e gerar as chaves"}</p>
            </div>

            <div className="flex items-center gap-1 bg-black/40 border border-white/[0.06] p-1 rounded-lg">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition-all ${viewMode === "table" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"}`}
                title="Visualização em Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition-all ${viewMode === "grid" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"}`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!app.plans?.length ? (
            <div className="p-10 text-center">
              <Key className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Nenhum plano cadastrado para este aplicativo.</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="px-5 py-3">Plano</th>
                    <th className="px-4 py-3">Duração</th>
                    <th className="px-4 py-3 text-right">Preço Original</th>
                    <th className="px-4 py-3 text-right">Seu Custo</th>
                    <th className="px-4 py-3 text-right">Preço de Venda</th>
                    <th className="px-5 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {app.plans.map((plan: any) => {
                    const original = parseFloat(String(plan.priceCredits));
                    const price = original * (1 - discount / 100);
                    const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));

                    return (
                      <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{plan.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.08] text-gray-400 uppercase font-mono">
                              {plan.level || "basic"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-300">
                          {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-500 line-through font-mono">
                          {original.toFixed(2)} cr
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-sm">
                          {isUnlimited
                            ? <span className="text-violet-400">Grátis</span>
                            : <span className="text-emerald-400">{price.toFixed(2)} cr</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-300">
                          {suggestedSell > 0 ? `R$ ${suggestedSell.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => { setGenForm(f => ({ ...f, planId: String(plan.id) })); setShowGenerate(true); }}
                            className="h-8 px-3.5 text-xs font-semibold rounded-lg border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all"
                          >
                            <Key className="w-3.5 h-3.5 mr-1.5" /> Gerar Key
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {app.plans.map((plan: any) => {
                const original = parseFloat(String(plan.priceCredits));
                const price = original * (1 - discount / 100);
                const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));

                return (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-white/[0.08] bg-black/30 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm">{plan.name}</span>
                        <span className="text-[10px] text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays}d`}
                        </span>
                      </div>

                      <div className="my-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Seu Custo</p>
                          <p className={`font-mono font-bold text-base leading-tight mt-0.5 ${isUnlimited ? "text-violet-400" : "text-emerald-400"}`}>
                            {isUnlimited ? "Grátis" : `${price.toFixed(2)} cr`}
                          </p>
                        </div>
                        {suggestedSell > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Preço de Venda</p>
                            <p className="text-gray-200 font-mono text-xs mt-0.5">R$ {suggestedSell.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => { setGenForm(f => ({ ...f, planId: String(plan.id) })); setShowGenerate(true); }}
                      className="w-full h-8 text-xs font-semibold rounded-lg border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all"
                    >
                      <Key className="w-3.5 h-3.5 mr-1.5" /> Gerar Key
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Features Compacto */}
        {app.features && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-emerald-400" /> Recursos e Funções
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{f.replace(/^\[\+\]\s*/, "")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <AppKeysPanel appId={id} />
        </TabsContent>

        <TabsContent value="downloads" className="mt-4">
          <ResellerDownloads appId={id} />
        </TabsContent>
      </Tabs>

      {/* Generate Modal Compacto */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">Gerar Chave de Licença</DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">{selectedPlan?.name} — {app.name}</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-gray-400">{isUnlimited ? "Custo:" : "Total a debitar:"}</span>
              {isUnlimited ? (
                <span className="text-violet-400 font-mono font-bold text-sm">Incluído na assinatura</span>
              ) : (
                <span className="text-emerald-400 font-mono font-bold text-sm">{totalCost.toFixed(2)} cr</span>
              )}
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1.5">Quantidade</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={genForm.quantity}
                onChange={e => setGenForm(f => ({ ...f, quantity: e.target.value }))}
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1.5">Observação (Opcional)</Label>
              <Input
                placeholder="Ex: Cliente João"
                value={genForm.note}
                onChange={e => setGenForm(f => ({ ...f, note: e.target.value }))}
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerate(false)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => generateKeys.mutate({
                  appId: id,
                  planId: parseInt(genForm.planId),
                  quantity: parseInt(genForm.quantity || "1"),
                  customMask: genForm.customMask || undefined,
                  note: genForm.note || undefined,
                })}
                disabled={generateKeys.isPending || (!isUnlimited && credits < totalCost)}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {generateKeys.isPending ? "Gerando..." : "Confirmar"}
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
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-5 shadow-2xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-white font-bold text-sm">Método de Pagamento</DialogTitle>
          <p className="text-gray-400 text-xs">Selecione como deseja efetuar o pagamento da key</p>
        </DialogHeader>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={onSelectPix}
            disabled={isLoadingPix || isLoadingCrypto}
            className="w-full rounded-xl p-3 text-left transition-all border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                {isLoadingPix ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-white font-semibold text-xs">PIX (Instantâneo)</p>
                <p className="text-gray-400 text-[10px]">Aprovação imediata via QR Code</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {!hideLtc && (
            <button
              onClick={onSelectCrypto}
              disabled={isLoadingPix || isLoadingCrypto}
              className="w-full rounded-xl p-3 text-left transition-all border border-white/[0.08] hover:border-amber-500/40 bg-white/[0.02] hover:bg-amber-500/[0.08] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                  {isLoadingCrypto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bitcoin className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Criptomoeda (Litecoin)</p>
                  <p className="text-gray-400 text-[10px]">Confirmação rápida na rede LTC</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            </button>
          )}
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
      toast.success("Pagamento confirmado! Keys entregues.");
      utils.reseller.myKeys.invalidate();
      utils.reseller.myKeysByApp.invalidate();
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
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      toast.success("Chave copiada!");
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-white font-bold text-base">Pagamento via PIX</DialogTitle>
          <p className="text-gray-400 text-xs">{quantity}x {appName} — {planName}</p>
        </DialogHeader>

        {step === "pending" && pixData && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <p className="text-gray-400 text-[11px] uppercase font-medium">Valor Total</p>
              <p className="text-emerald-400 text-2xl font-bold font-mono mt-0.5">{fmtCents(pixData.amountCents)}</p>
            </div>

            <div className="flex justify-center my-1">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                {pixData.qrCodeImage ? (
                  <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-40 h-40 object-contain" />
                ) : pixData.brCode ? (
                  <QRCodeSVG value={pixData.brCode} size={160} />
                ) : null}
              </div>
            </div>

            {pixData.brCode && (
              <Button
                onClick={handleCopy}
                className="w-full h-9 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black border-0"
              >
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Código Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Código PIX</>}
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Aguardando confirmação do banco...</span>
            </div>
          </div>
        )}

        {step === "paid" && (
          <div className="text-center space-y-4 py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Pagamento Confirmado!</h3>
              <p className="text-gray-400 text-xs mt-0.5">{deliveredKeys.length} chave(s) entregue(s)</p>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {deliveredKeys.map((key, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs">
                  <span className="font-mono text-emerald-300 truncate">{key}</span>
                  <button onClick={() => handleCopyKey(key)} className="text-gray-400 hover:text-white p-1">
                    {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>

            <Button onClick={handleClose} className="w-full h-9 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black">
              Ver Minhas Keys
            </Button>
          </div>
        )}
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
  const { fmtCents } = useCurrency();

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
      toast.success("Pagamento confirmado! Keys entregues.");
      utils.reseller.myKeys.invalidate();
      utils.reseller.myKeysByApp.invalidate();
      utils.reseller.profile.invalidate();
    }
  }, [statusData?.status, step, utils]);

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
      toast.success("Endereço LTC copiado!");
      setTimeout(() => setCopiedAddress(false), 2500);
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(key);
      toast.success("Chave copiada!");
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-white font-bold text-base">Pagamento em Litecoin</DialogTitle>
          <p className="text-gray-400 text-xs">{quantity}x {appName} — {planName}</p>
        </DialogHeader>

        {step === "pending" && ltcData && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <p className="text-gray-400 text-[11px] uppercase font-medium">Quantidade Exata</p>
              <p className="text-amber-400 text-xl font-bold font-mono mt-0.5">{ltcData.ltcAmount.toFixed(6)} LTC</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Equivalente a {fmtCents(ltcData.amountCents)}</p>
            </div>

            <div>
              <p className="text-gray-400 text-[11px] mb-1 font-medium uppercase">Endereço de Destino (Rede LTC)</p>
              <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-between gap-2">
                <p className="text-amber-300 text-xs font-mono break-all">{ltcData.ltcAddress}</p>
                <button onClick={handleCopyAddress} className="text-gray-400 hover:text-white p-1 shrink-0">
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1">
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Aguardando transação na blockchain...</span>
            </div>
          </div>
        )}

        {step === "paid" && (
          <div className="text-center space-y-4 py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-white font-bold text-sm">Pagamento Confirmado!</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {deliveredKeys.map((key, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs">
                  <span className="font-mono text-emerald-300 truncate">{key}</span>
                  <button onClick={() => handleCopyKey(key)} className="text-gray-400 hover:text-white p-1">
                    {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="w-full h-9 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black">
              Ver Minhas Keys
            </Button>
          </div>
        )}
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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
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
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-5">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl flex gap-1 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all"
            >
              Visão Geral & Planos
            </TabsTrigger>
            <TabsTrigger
              value="keys"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Minhas Keys
            </TabsTrigger>
            <TabsTrigger
              value="downloads"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Downloads
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-5">
          {/* Barra de Resumo Compacta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Seu Desconto Atual</p>
                  <p className="text-emerald-400 font-bold font-mono text-lg">{discount.toFixed(0)}% OFF</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold">
                ATIVO
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400">
                <Tag className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Planos Cadastrados</p>
                <p className="text-white font-bold text-sm">{app.plans?.length || 0} opções disponíveis</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Entrega</p>
                <p className="text-white font-semibold text-sm">Liberação Imediata pós-Pix</p>
              </div>
            </div>
          </div>

          {/* Tabela de Planos */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" /> Tabela de Preços e Planos
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">Selecione o plano desejado para comprar keys com entrega automática</p>
              </div>

              <div className="flex items-center gap-1 bg-black/40 border border-white/[0.06] p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs transition-all ${viewMode === "table" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"}`}
                  title="Visualização em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md text-xs transition-all ${viewMode === "grid" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"}`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!app.plans?.length ? (
              <div className="p-10 text-center">
                <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">Nenhum plano disponível no momento.</p>
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-3">Plano</th>
                      <th className="px-4 py-3">Duração</th>
                      <th className="px-4 py-3 text-right">Preço de Tabela</th>
                      <th className="px-4 py-3 text-right">Seu Custo Revendedor</th>
                      <th className="px-4 py-3 text-right">Preço de Venda</th>
                      <th className="px-4 py-3 text-right">Margem</th>
                      <th className="px-5 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {app.plans.map((plan: any) => {
                      const original = parseFloat(String(plan.pricePercentage ?? "0"));
                      const withDiscount = original * (1 - discount / 100);
                      const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));
                      const profit = suggestedSell > withDiscount ? suggestedSell - withDiscount : 0;
                      const profitPct = withDiscount > 0 ? ((profit / withDiscount) * 100).toFixed(0) : "0";

                      return (
                        <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{plan.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.08] text-gray-400 uppercase font-mono">
                                {plan.level || "basic"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-300">
                            {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}
                          </td>
                          <td className="px-4 py-3.5 text-right text-gray-500 line-through font-mono">
                            {fmt(original)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                            {fmt(withDiscount)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-gray-200">
                            {suggestedSell > 0 ? fmt(suggestedSell) : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {profit > 0 ? (
                              <span className="text-emerald-400 font-mono font-medium text-[11px]">
                                +{fmt(profit)} <span className="text-gray-500">({profitPct}%)</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              size="sm"
                              onClick={() => { setSelectedPlan(plan); setShowBuy(true); }}
                              className="h-8 px-3.5 text-xs font-semibold rounded-lg border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {app.plans.map((plan: any) => {
                  const original = parseFloat(String(plan.pricePercentage ?? "0"));
                  const withDiscount = original * (1 - discount / 100);
                  const suggestedSell = parseFloat(String(plan.resellerSellingPrice ?? "0"));
                  const profit = suggestedSell > withDiscount ? suggestedSell - withDiscount : 0;

                  return (
                    <div
                      key={plan.id}
                      className="rounded-xl border border-white/[0.08] bg-black/30 p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold text-sm">{plan.name}</span>
                          <span className="text-[10px] text-gray-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays}d`}
                          </span>
                        </div>

                        <div className="my-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-medium">Seu Custo</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-emerald-400 font-mono font-bold text-base">{fmt(withDiscount)}</span>
                              {discount > 0 && <span className="text-gray-500 text-[10px] line-through font-mono">{fmt(original)}</span>}
                            </div>
                          </div>
                          {suggestedSell > 0 && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
                              <span className="text-gray-400">Venda Sugerida</span>
                              <span className="text-gray-200 font-mono font-medium">{fmt(suggestedSell)}</span>
                            </div>
                          )}
                          {profit > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-emerald-400">
                              <span>Lucro Estimado</span>
                              <span className="font-mono font-semibold">+{fmt(profit)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => { setSelectedPlan(plan); setShowBuy(true); }}
                        className="w-full h-8 text-xs font-semibold rounded-lg border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Features Compacto */}
          {app.features && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-emerald-400" /> Recursos e Funções
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{f.replace(/^\[\+\]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <AppKeysPanel appId={id} />
        </TabsContent>

        <TabsContent value="downloads" className="mt-4">
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

      {/* Buy Modal Compacto */}
      <Dialog open={showBuy} onOpenChange={setShowBuy}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">Comprar Chave</DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">{selectedPlan?.name} — {app.name}</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-medium">Preço com Desconto ({discount.toFixed(0)}%)</p>
                <p className="text-emerald-400 font-mono font-bold text-lg mt-0.5">
                  R$ {(parseFloat(String(selectedPlan?.pricePercentage ?? "0")) * (1 - discount / 100)).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase font-medium">Preço Normal</p>
                <p className="text-gray-500 font-mono line-through text-xs mt-0.5">
                  R$ {parseFloat(String(selectedPlan?.pricePercentage ?? "0")).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1.5">Quantidade de Licenças</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{parseInt(quantity || "1")}x {selectedPlan?.name}</span>
              <span className="text-emerald-400 font-mono font-bold text-base">R$ {totalCost.toFixed(2)}</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowBuy(false)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBuy}
                disabled={createKeyPix.isPending || createKeyLtc.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {(createKeyPix.isPending || createKeyLtc.isPending) ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Carregando...</>
                ) : (
                  <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Continuar</>
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

  if (isLoading) return <div className="text-gray-500 text-xs py-6 text-center animate-pulse">Carregando downloads...</div>;

  return (
    <div className="space-y-4">
      {downloadItems.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Arquivos Disponíveis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {downloadItems.map((d: any) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-xl border border-white/[0.06] bg-black/20 hover:border-emerald-500/30 transition-all flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-medium text-xs">{d.title}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">Download direto</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Download className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {tutorialItems.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
          <h4 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-emerald-400" /> Tutoriais e Vídeos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tutorialItems.map((d: any) => (
              <div key={d.id} className="p-3.5 rounded-xl border border-white/[0.06] bg-black/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium text-xs">{d.title}</p>
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1">
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {d.videoUrl && (
                  <div className="rounded-lg overflow-hidden aspect-video bg-black/60 border border-white/[0.06]">
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
        <div className="text-center py-10 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <Download className="w-7 h-7 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-xs">Nenhum download ou tutorial cadastrado para este aplicativo.</p>
        </div>
      )}
    </div>
  );
}

// ─── Keys por App (aba Minhas Keys) ───────────────────────────────────────────
function AppKeysPanel({ appId }: { appId: number }) {
  const utils = trpc.useUtils();
  const { data: keys = [], isLoading } = trpc.reseller.myKeysByApp.useQuery({ appId });
  const { data: profile } = trpc.reseller.profile.useQuery();
  const canBanDelete = profile?.resellerType === "percentage" && (profile as any)?.canBanDeleteKeys === true;
  const [copied, setCopied] = useState<number | null>(null);

  const resetHwid = trpc.reseller.resetHwid.useMutation({
    onSuccess: () => {
      toast.success("HWID resetado com sucesso!");
      utils.reseller.myKeysByApp.invalidate({ appId });
    },
    onError: e => toast.error(e.message),
  });

  const revokeKey = trpc.reseller.revokeKey.useMutation({
    onSuccess: () => {
      toast.success("Key revogada!");
      utils.reseller.myKeysByApp.invalidate({ appId });
    },
    onError: e => toast.error(e.message),
  });

  const banKey = trpc.reseller.banKey.useMutation({
    onSuccess: () => {
      toast.success("Key banida!");
      utils.reseller.myKeysByApp.invalidate({ appId });
    },
    onError: e => toast.error(e.message),
  });

  const deleteKey = trpc.reseller.deleteKey.useMutation({
    onSuccess: () => {
      toast.success("Key deletada!");
      utils.reseller.myKeysByApp.invalidate({ appId });
    },
    onError: e => toast.error(e.message),
  });

  const copyKey = (id: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    toast.success("Key copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-xs py-6 text-center animate-pulse">Carregando keys...</div>;
  }

  if (keys.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
        <Key className="w-7 h-7 text-gray-600 mx-auto mb-2" />
        <p className="text-gray-400 text-xs">Nenhuma key gerada para este aplicativo ainda.</p>
      </div>
    );
  }

  const statusMap: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    used: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    revoked: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h4 className="text-white font-semibold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-emerald-400" /> Keys deste Aplicativo
        </h4>
        <span className="text-[11px] text-gray-500 font-mono">{keys.length} key(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-5 py-3">Key</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {keys.map((k: any) => (
              <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <span className="text-gray-200 font-mono text-[11px] bg-white/[0.03] px-2 py-1 rounded-md border border-white/[0.05]">{k.keyValue}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{k.planName}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase ${statusMap[k.status] ?? statusMap.expired}`}>{k.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(k.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-gray-500">
                  {k.expiresAt
                    ? new Date(k.expiresAt).toLocaleDateString("pt-BR")
                    : k.durationDays >= 9000
                      ? "Lifetime"
                      : "Após uso"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => copyKey(k.id, k.keyValue)} title="Copiar key" className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                      {copied === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {k.status === "active" && (
                      <button
                        onClick={() => { if (confirm("Resetar HWID desta key?")) resetHwid.mutate({ keyId: k.id }); }}
                        title="Resetar HWID"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(k.status === "active" || k.status === "used") && (
                      <button
                        onClick={() => { if (confirm("Revogar esta key? Esta ação não pode ser desfeita.")) revokeKey.mutate({ keyId: k.id }); }}
                        title="Revogar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canBanDelete && (
                      <>
                        <button
                          onClick={() => {
                            const reason = prompt("Motivo do ban (opcional):", "Banned by reseller");
                            if (reason !== null) banKey.mutate({ keyId: k.id, reason: reason || undefined });
                          }}
                          disabled={banKey.isPending}
                          title="Banir key"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all disabled:opacity-40"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Deletar esta key? Esta ação não pode ser desfeita.")) deleteKey.mutate({ keyId: k.id }); }}
                          disabled={deleteKey.isPending}
                          title="Deletar key"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ResellerAppDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { data: app, isLoading } = trpc.reseller.appDetail.useQuery({ appId: id });
  const { data: profile } = trpc.reseller.profile.useQuery();

  if (isLoading) return <div className="text-gray-500 py-10 text-center text-xs animate-pulse">Carregando detalhes do app...</div>;
  if (!app) return <div className="text-gray-500 py-10 text-center text-xs">Aplicativo não encontrado.</div>;

  const resellerType = profile?.resellerType ?? "credits";

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4 sm:p-6">
      {/* Header Corporativo Limpo */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/reseller/apps")}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">{app.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-300 font-mono border border-white/[0.08]">
                {app.version || "v1.0"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>
            {app.description && (
              <p className="text-gray-400 text-xs mt-0.5">{app.description}</p>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {resellerType === "credits" ? (
            <span className="text-xs px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-300 font-medium flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Revendedor de Créditos
            </span>
          ) : resellerType === "unlimited" ? (
            <span className="text-xs px-3 py-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Revendedor Unlimited
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Revendedor de Porcentagem
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      {resellerType === "credits" || resellerType === "unlimited" ? (
        <CreditsAppDetail app={app} id={id} isUnlimited={resellerType === "unlimited"} />
      ) : (
        <PercentageAppDetail app={app} id={id} otherStore={resellerType === "other"} />
      )}
    </div>
  );
}
