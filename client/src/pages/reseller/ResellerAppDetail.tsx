import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Key, DollarSign, Clock, Star, Plus, ShoppingCart, CreditCard, Percent, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const discount = parseFloat(String(profile?.discountPercent ?? "35"));
  const selectedPlan = app.plans?.find((p: any) => String(p.id) === genForm.planId);
  const planPrice = selectedPlan ? parseFloat(String(selectedPlan.priceCredits)) : 0;
  const discountedPrice = planPrice * (1 - discount / 100);
  const totalCost = discountedPrice * parseInt(genForm.quantity || "1");

  return (
    <>
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400 font-bold text-sm">Overview</TabsTrigger>
          <TabsTrigger value="generate" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400 gap-1.5 font-bold text-sm">
            <Key className="w-3.5 h-3.5" /> Gerar Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
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
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Percent className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold">{discount.toFixed(0)}% off</span>
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
                  const original = parseFloat(String(plan.priceCredits));
                  const withDiscount = original * (1 - discount / 100);
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
                          <span className="text-yellow-400 font-bold font-mono text-sm">{withDiscount.toFixed(2)}</span>
                          <span className="text-gray-600 text-xs">cr</span>
                          {discount > 0 && <span className="text-gray-600 text-xs line-through">{original.toFixed(2)}</span>}
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
        </TabsContent>

        <TabsContent value="generate" className="mt-4">
          <div className="max-w-md mx-auto space-y-4">
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
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <Percent className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold">{discount.toFixed(0)}% off</span>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm">Quantidade (1-100)</Label>
                <Input type="number" min="1" max="100" value={genForm.quantity} onChange={e => setGenForm(f => ({...f, quantity: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Máscara (opcional)</Label>
                <Input value={genForm.customMask} onChange={e => setGenForm(f => ({...f, customMask: e.target.value}))} placeholder="XXXX-XXXX-XXXX" className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-gray-700" />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Nota (opcional)</Label>
              <textarea value={genForm.note} onChange={e => setGenForm(f => ({...f, note: e.target.value}))} placeholder="Nota para estas keys..." rows={2} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:border-red-500/50 placeholder:text-gray-700" />
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preço por key:</span>
                  <span className="text-white font-mono">{discountedPrice.toFixed(2)} cr <span className="text-green-400 text-xs">(-{discount.toFixed(0)}%)</span></span>
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
        </TabsContent>
      </Tabs>
    </>
  );
}

// ─── Percentage Flow (Comprar Keys) ──────────────────────────────────────────
function PercentageAppDetail({ app, id }: { app: any; id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [quantity, setQuantity] = useState("1");

  const buyKey = trpc.reseller.buyKey.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.keys.length} key(s) comprada(s) com sucesso!`);
      utils.reseller.myKeys.invalidate();
      utils.reseller.profile.invalidate();
      setShowBuy(false);
      navigate("/reseller/keys");
    },
    onError: e => toast.error(e.message),
  });

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
              onClick={() => buyKey.mutate({ appId: id, planId: selectedPlan?.id, quantity: parseInt(quantity) })}
              disabled={buyKey.isPending || !selectedPlan}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {buyKey.isPending ? "Processando..." : `Comprar ${quantity} Key(s)`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

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
              <Button onClick={() => buyKey.mutate({ appId: id, planId: selectedPlan?.id, quantity: parseInt(quantity) })} disabled={buyKey.isPending} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
                {buyKey.isPending ? "Processando..." : "Confirmar"}
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
