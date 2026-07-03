import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Key, DollarSign, Clock, Star, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ResellerAppDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: app, isLoading } = trpc.reseller.appDetail.useQuery({ appId: id });
  const { data: session } = trpc.auth.session.useQuery();
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ planId: "", quantity: "1", durationDays: "30", customMask: "", note: "" });

  const generateKeys = trpc.reseller.generateKeys.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.keys.length} key(s) gerada(s) com sucesso!`);
      utils.reseller.appDetail.invalidate({ appId: id });
      utils.reseller.myKeys.invalidate();
      utils.auth.session.invalidate();
      setShowGenerate(false);
      setGenForm({ planId: "", quantity: "1", durationDays: "30", customMask: "", note: "" });
      navigate("/reseller/keys");
    },
    onError: e => toast.error(e.message),
  });

  if (isLoading) return <div className="text-gray-500 py-8 text-center">Carregando...</div>;
  if (!app) return <div className="text-gray-500 py-8 text-center">App não encontrado</div>;

  const discount = parseFloat(String((session as any)?.discountPercent ?? "35"));
  const credits = parseFloat(String((session as any)?.credits ?? "0"));

  const selectedPlan = app.plans?.find((p: any) => String(p.id) === genForm.planId);
  const planPrice = selectedPlan ? parseFloat(String(selectedPlan.priceCredits)) : 0;
  const discountedPrice = planPrice * (1 - discount / 100);
  const totalCost = discountedPrice * parseInt(genForm.quantity || "1");

  const levelColors: Record<string, string> = {
    basic: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    premium: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    lifetime: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
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
            {app.status === "active" ? "Active" : app.status}
          </span>

        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Overview</TabsTrigger>
          <TabsTrigger value="keys" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">License Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Subscription Plans */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Subscription Plans</h3>
            {!app.plans?.length ? (
              <p className="text-gray-600 text-sm">Nenhum plano disponível</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {app.plans.map((plan: any) => {
                  const original = parseFloat(String(plan.priceCredits));
                  const withDiscount = original * (1 - discount / 100);
                  return (
                    <div key={plan.id} className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level] ?? levelColors.basic}`}>{plan.level}</span>
                      </div>
                      <h4 className="text-white font-semibold">{plan.name}</h4>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                          <div>
                            <span className="text-yellow-400 font-bold font-mono text-sm">{withDiscount.toFixed(2)}</span>
                            <span className="text-gray-600 text-xs ml-1">cr</span>
                            {discount > 0 && <span className="text-gray-600 text-xs ml-1 line-through">{original.toFixed(2)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}
                        </div>
                      </div>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-2">
            <Button onClick={() => setShowGenerate(true)} className="bg-green-600 hover:bg-green-500 text-white gap-2 px-8">
              <Key className="w-4 h-4" /> Generate Key
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">Keys geradas para este app</p>
            <Button onClick={() => setShowGenerate(true)} className="bg-green-600 hover:bg-green-500 text-white gap-2 h-8 text-sm">
              <Plus className="w-3.5 h-3.5" /> Generate Key
            </Button>
          </div>
<div className="text-center py-12">
              <Key className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600">Veja todas as suas keys na aba "Minhas Keys"</p>
              <button onClick={() => navigate("/reseller/keys")} className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors">Ir para Minhas Keys →</button>
            </div>
        </TabsContent>
      </Tabs>

      {/* Generate Keys Modal */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-green-400" /> Generate License Keys
            </DialogTitle>
            <p className="text-gray-500 text-sm">Create new license keys for your application</p>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            generateKeys.mutate({
              appId: id,
              planId: parseInt(genForm.planId),
              quantity: parseInt(genForm.quantity),
              customMask: genForm.customMask || undefined,
              note: genForm.note || undefined,
            });
          }} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-300 text-sm">Subscription Plan *</Label>
              <Select value={genForm.planId} onValueChange={v => setGenForm(f => ({...f, planId: v}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select a subscription plan" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  {app.plans?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-white">
                      {p.name} — {(parseFloat(String(p.priceCredits)) * (1 - discount / 100)).toFixed(2)} cr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm">Quantity * <span className="text-gray-600">(1-100)</span></Label>
                <Input type="number" min="1" max="100" value={genForm.quantity} onChange={e => setGenForm(f => ({...f, quantity: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required />
                <p className="text-gray-600 text-xs mt-1">Number of keys to generate</p>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Duration (days) *</Label>
                <Input type="number" min="1" value={genForm.durationDays} onChange={e => setGenForm(f => ({...f, durationDays: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required />
                <p className="text-gray-600 text-xs mt-1">How long keys remain valid</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Custom Key Mask <span className="text-gray-600">(Optional)</span></Label>
              <Input value={genForm.customMask} onChange={e => setGenForm(f => ({...f, customMask: e.target.value}))} placeholder="e.g., CV STORE-XXXX-XXXX-XXXX" className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-gray-700" />
              <p className="text-gray-600 text-xs mt-1">Use X for random characters. Leave empty for default format.</p>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Note <span className="text-gray-600">(Optional)</span></Label>
              <textarea value={genForm.note} onChange={e => setGenForm(f => ({...f, note: e.target.value}))} placeholder="Add a note for these keys..." rows={2} className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:border-red-500/50 placeholder:text-gray-700" />
            </div>

            {/* Cost Preview */}
            {selectedPlan && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Preço por key:</span>
                  <span className="text-white font-mono">{discountedPrice.toFixed(2)} cr <span className="text-green-400 text-xs">(-{discount}%)</span></span>
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
                {totalCost > credits && <p className="text-red-400 text-xs">⚠ Créditos insuficientes</p>}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowGenerate(false)} className="flex-1 border-white/10 text-gray-300">Cancel</Button>
              <Button type="submit" disabled={generateKeys.isPending || !genForm.planId || totalCost > credits} className="flex-1 bg-green-600 hover:bg-green-500 text-white gap-2">
                <Key className="w-3.5 h-3.5" />
                {generateKeys.isPending ? "Gerando..." : "Generate Keys"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
