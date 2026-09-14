import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Users, Clock, Star, Edit2, Check,
  CreditCard, Percent, Tag, ShieldCheck, Layers, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminAppDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: app, isLoading } = trpc.admin.getApp.useQuery({ id });
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();

  const [showPlan, setShowPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "", durationDays: "30",
    priceCredits: "", pricePercentage: "", resellerSellingPrice: "",
    level: "basic" as "basic" | "premium" | "lifetime"
  });
  const [selectedReseller, setSelectedReseller] = useState("");

  const createPlan = trpc.admin.createPlan.useMutation({
    onSuccess: () => { toast.success("Plano criado com sucesso!"); utils.admin.getApp.invalidate({ id }); setShowPlan(false); resetForm(); },
    onError: e => toast.error(e.message)
  });
  const updatePlan = trpc.admin.updatePlan.useMutation({
    onSuccess: () => { toast.success("Plano atualizado com sucesso!"); utils.admin.getApp.invalidate({ id }); setEditingPlan(null); },
    onError: e => toast.error(e.message)
  });
  const deletePlan = trpc.admin.deletePlan.useMutation({
    onSuccess: () => { toast.success("Plano removido!"); utils.admin.getApp.invalidate({ id }); },
    onError: e => toast.error(e.message)
  });
  const assignApp = trpc.admin.assignApp.useMutation({
    onSuccess: () => { toast.success("App atribuído ao reseller!"); setSelectedReseller(""); },
    onError: e => toast.error(e.message)
  });

  function resetForm() {
    setPlanForm({ name: "", durationDays: "30", priceCredits: "", pricePercentage: "", resellerSellingPrice: "", level: "basic" });
  }

  function openEdit(plan: any) {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      durationDays: String(plan.durationDays),
      priceCredits: parseFloat(plan.priceCredits).toFixed(2),
      pricePercentage: parseFloat(plan.pricePercentage ?? "0").toFixed(2),
      resellerSellingPrice: parseFloat(plan.resellerSellingPrice ?? "0").toFixed(2),
      level: plan.level || "basic",
    });
  }

  if (isLoading) return (
    <div className="p-10 text-center text-xs text-gray-500 animate-pulse">
      Carregando detalhes do aplicativo...
    </div>
  );
  if (!app) return <div className="p-10 text-center text-xs text-gray-500">Aplicativo não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/admin/apps")}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{app.name}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-300 font-mono border border-white/[0.08]">
                {app.version || "v1.0"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {app.status === "active" ? "Ativo" : app.status}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5">{app.description || "Sem descrição informada."}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => { resetForm(); setShowPlan(true); }}
            className="h-9 px-4 text-xs font-semibold rounded-xl border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Novo Plano
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        {/* Navigation Tabs */}
        <div className="border-b border-white/[0.06] pb-3 mb-5">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl flex gap-1 h-auto w-fit">
            <TabsTrigger
              value="plans"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Planos de Assinatura ({app.plans?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="resellers"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Atribuir Resellers
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-emerald-400" />
              Recursos / Features
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Plans Tab ── */}
        <TabsContent value="plans" className="space-y-4">
          {!app.plans?.length ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
              <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white text-sm font-semibold">Nenhum plano cadastrado</p>
              <p className="text-gray-400 text-xs mt-1">Crie opções de duração para seus revendedores poderem emitir e comprar chaves</p>
              <Button
                size="sm"
                onClick={() => { resetForm(); setShowPlan(true); }}
                className="mt-4 h-8 px-4 text-xs font-semibold rounded-lg border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Criar Primeiro Plano
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-3">Plano</th>
                      <th className="px-4 py-3">Duração</th>
                      <th className="px-4 py-3 text-right">Preço em Créditos</th>
                      <th className="px-4 py-3 text-right">Preço Base (R$)</th>
                      <th className="px-4 py-3 text-right">Venda Sugerida (R$)</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {app.plans.map((plan: any) => {
                      const creditsPrice = parseFloat(plan.priceCredits);
                      const percentPrice = parseFloat(plan.pricePercentage ?? "0");
                      const sellPrice = parseFloat(plan.resellerSellingPrice ?? "0");

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
                          <td className="px-4 py-3.5 text-right font-mono font-medium text-amber-300">
                            {creditsPrice.toFixed(2)} cr
                            <div className="text-[10px] text-gray-500 font-normal">
                              35%: {(creditsPrice * 0.65).toFixed(2)} • 50%: {(creditsPrice * 0.5).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-400">
                            R$ {percentPrice.toFixed(2)}
                            <div className="text-[10px] text-gray-500 font-normal">
                              35%: R$ {(percentPrice * 0.65).toFixed(2)} • 50%: R$ {(percentPrice * 0.5).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-white">
                            {sellPrice > 0 ? `R$ ${sellPrice.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(plan)}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                                title="Editar Plano"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => { if (confirm(`Remover plano "${plan.name}"?`)) deletePlan.mutate({ id: plan.id }); }}
                                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-all"
                                title="Excluir Plano"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Resellers Tab ── */}
        <TabsContent value="resellers" className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
            <h3 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Atribuir Acesso a Resellers
            </h3>
            <p className="text-gray-400 text-xs mb-4">Selecione o revendedor para liberar este software no painel dele</p>

            <div className="flex gap-2.5 max-w-md">
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-9">
                  <SelectValue placeholder="Selecione um reseller..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  {resellers.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {r.username} ({r.resellerType === "percentage" ? "Porcentagem" : r.resellerType === "other" ? "Other Store" : "Créditos"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => { if (selectedReseller) assignApp.mutate({ resellerId: parseInt(selectedReseller), appId: id }); }}
                disabled={!selectedReseller || assignApp.isPending}
                className="h-9 px-4 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black border-0 shrink-0"
              >
                {assignApp.isPending ? "Atribuindo..." : "Atribuir"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Features Tab ── */}
        <TabsContent value="features" className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-emerald-400" /> Recursos Cadastrados
            </h3>
            {app.features ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/[0.04] text-xs text-gray-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{f.replace(/^\[\+\]\s*/, "")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">Nenhum recurso cadastrado. Edite o app para adicionar recursos.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit Plan Modal Corporativo ── */}
      <Dialog open={showPlan || !!editingPlan} onOpenChange={(open) => { if (!open) { setShowPlan(false); setEditingPlan(null); } }}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-md rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">
              {editingPlan ? "Editar Plano de Assinatura" : "Novo Plano de Assinatura"}
            </DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Configure os valores para ambos os tipos de revendedor</p>
          </DialogHeader>

          <form
            onSubmit={e => {
              e.preventDefault();
              const payload = {
                appId: id,
                name: planForm.name,
                durationDays: parseInt(planForm.durationDays),
                priceCredits: parseFloat(planForm.priceCredits) || 0,
                pricePercentage: parseFloat(planForm.pricePercentage) || 0,
                resellerSellingPrice: parseFloat(planForm.resellerSellingPrice) || 0,
                level: planForm.level,
              };
              if (editingPlan) {
                updatePlan.mutate({ id: editingPlan.id, ...payload });
              } else {
                createPlan.mutate(payload);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Nome do Plano *</Label>
                <Input
                  value={planForm.name}
                  onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: DIÁRIO, SEMANAL, MENSAL"
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Duração (dias) *</Label>
                <Input
                  type="number"
                  value={planForm.durationDays}
                  onChange={e => setPlanForm(f => ({ ...f, durationDays: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                  required
                />
                <span className="text-[10px] text-gray-500">9999 = Lifetime</span>
              </div>
            </div>

            {/* Sistema de Créditos */}
            <div className="rounded-xl border border-white/[0.08] p-3.5 bg-black/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Sistema de Créditos
                </span>
                <span className="text-[10px] text-gray-500">Revendedores de crédito</span>
              </div>
              <div>
                <Label className="text-gray-400 text-[11px] block mb-1">Preço em Créditos *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={planForm.priceCredits}
                  onChange={e => setPlanForm(f => ({ ...f, priceCredits: e.target.value }))}
                  placeholder="Ex: 10.00"
                  className="bg-black/40 border-white/[0.08] text-white rounded-lg h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* Sistema de Porcentagem */}
            <div className="rounded-xl border border-white/[0.08] p-3.5 bg-black/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" /> Sistema de Porcentagem (R$)
                </span>
                <span className="text-[10px] text-gray-500">Revendedores %</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-gray-400 text-[11px] block mb-1">Preço Base (Custo R$)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={planForm.pricePercentage}
                    onChange={e => setPlanForm(f => ({ ...f, pricePercentage: e.target.value }))}
                    placeholder="Ex: 25.00"
                    className="bg-black/40 border-white/[0.08] text-white rounded-lg h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-[11px] block mb-1">Preço de Venda Final (R$)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={planForm.resellerSellingPrice}
                    onChange={e => setPlanForm(f => ({ ...f, resellerSellingPrice: e.target.value }))}
                    placeholder="Ex: 50.00"
                    className="bg-black/40 border-white/[0.08] text-white rounded-lg h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => { setShowPlan(false); setEditingPlan(null); }}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPlan.isPending || updatePlan.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {createPlan.isPending || updatePlan.isPending ? "Salvando..." : editingPlan ? "Salvar Alterações" : "Criar Plano"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
