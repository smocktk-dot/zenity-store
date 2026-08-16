import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Users, Clock, Star, Coins, Percent, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
    onSuccess: () => { toast.success("Plano criado!"); utils.admin.getApp.invalidate({ id }); setShowPlan(false); resetForm(); },
    onError: e => toast.error(e.message)
  });
  const updatePlan = trpc.admin.updatePlan.useMutation({
    onSuccess: () => { toast.success("Plano atualizado!"); utils.admin.getApp.invalidate({ id }); setEditingPlan(null); },
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
      level: plan.level,
    });
  }

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!app) return <div className="p-6 text-gray-500">App não encontrado</div>;

  const levelColors: Record<string, string> = {
    basic: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    premium: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    lifetime: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  };

  const creditResellers = resellers.filter((r: any) => r.resellerType === "credits" || !r.resellerType);
  const percentageResellers = resellers.filter((r: any) => r.resellerType === "percentage");

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/apps")} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.03] transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-white text-2xl font-bold">{app.name}</h1>
          <p className="text-gray-500 text-sm">{app.description || "Sem descrição"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-white/[0.03] text-gray-400 font-mono">{app.version}</span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${app.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{app.status}</span>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="bg-white/[0.03] border border-white/[0.06]">
          <TabsTrigger value="plans" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">Planos</TabsTrigger>
          <TabsTrigger value="resellers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">Atribuir Resellers</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">Features</TabsTrigger>
        </TabsList>

        {/* ── Plans Tab ── */}
        <TabsContent value="plans" className="mt-4 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">{app.plans?.length || 0} planos configurados</p>
            <Button onClick={() => { resetForm(); setShowPlan(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-8 text-sm">
              <Plus className="w-3.5 h-3.5" /> Novo Plano
            </Button>
          </div>

          {!app.plans?.length ? (
            <div className="text-center py-12 text-gray-600">
              <p>Nenhum plano criado ainda.</p>
              <p className="text-sm mt-1">Clique em "Novo Plano" para começar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ── Coluna: Sistema de Créditos ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-yellow-500/20">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10">
                    <Coins className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-sm">Sistema de Créditos</h3>
                    <p className="text-gray-600 text-xs">Preços em créditos para resellers do tipo Créditos</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {app.plans.map((plan: any) => (
                    <div key={plan.id} className="rounded-xl border border-yellow-500/10 p-4 bg-yellow-500/5 hover:bg-yellow-500/8 transition-all group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level]}`}>{plan.level}</span>
                          <span className="text-white font-semibold text-sm">{plan.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(plan)} className="p-1 rounded text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm("Remover plano?")) deletePlan.mutate({ id: plan.id }); }} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-emerald-500/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-lg font-mono">{parseFloat(plan.priceCredits).toFixed(2)}</span>
                          <span className="text-gray-500 text-sm">créditos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays}d`}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs mt-2">
                        Com 35% desc → <span className="text-yellow-500">{(parseFloat(plan.priceCredits) * 0.65).toFixed(2)} cr</span>
                        {" · "}50% desc → <span className="text-yellow-500">{(parseFloat(plan.priceCredits) * 0.50).toFixed(2)} cr</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Coluna: Sistema de Porcentagem ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-purple-500/20">
                  <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <Percent className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-purple-400 font-semibold text-sm">Sistema de Porcentagem</h3>
                    <p className="text-gray-600 text-xs">Preços em R$ para resellers do tipo Porcentagem</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {app.plans.map((plan: any) => (
                    <div key={plan.id} className="rounded-xl border border-purple-500/10 p-4 bg-purple-500/5 hover:bg-purple-500/8 transition-all group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level]}`}>{plan.level}</span>
                          <span className="text-white font-semibold text-sm">{plan.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(plan)} className="p-1 rounded text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm("Remover plano?")) deletePlan.mutate({ id: plan.id }); }} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-emerald-500/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-400 font-bold text-sm">R$</span>
                          <span className="text-purple-400 font-bold text-lg font-mono">{parseFloat(plan.pricePercentage ?? "0").toFixed(2)}</span>
                          <span className="text-gray-500 text-sm">preço base</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays}d`}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs mt-2">
                        Com 35% desc → <span className="text-purple-400">R$ {(parseFloat(plan.pricePercentage ?? "0") * 0.65).toFixed(2)}</span>
                        {" · "}50% desc → <span className="text-purple-400">R$ {(parseFloat(plan.pricePercentage ?? "0") * 0.50).toFixed(2)}</span>
                      </p>
                      <p className="text-emerald-400 text-xs mt-1">
                        Preço final de venda: <span className="font-bold">R$ {parseFloat(plan.resellerSellingPrice ?? "0").toFixed(2)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </TabsContent>

        {/* ── Resellers Tab ── */}
        <TabsContent value="resellers" className="mt-4 space-y-4">
          <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Atribuir App a Reseller
            </h3>
            <div className="flex gap-3">
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white flex-1">
                  <SelectValue placeholder="Selecionar reseller..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/[0.06]">
                  {resellers.length === 0 && (
                    <SelectItem value="_none" disabled className="text-gray-500">Nenhum reseller cadastrado</SelectItem>
                  )}
                  {creditResellers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-yellow-500 font-semibold flex items-center gap-1">
                        <Coins className="w-3 h-3" /> Resellers de Créditos
                      </div>
                      {creditResellers.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)} className="text-white pl-4">{r.username}</SelectItem>
                      ))}
                    </>
                  )}
                  {percentageResellers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-purple-400 font-semibold flex items-center gap-1 mt-1">
                        <Percent className="w-3 h-3" /> Resellers de Porcentagem
                      </div>
                      {percentageResellers.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)} className="text-white pl-4">{r.username}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={() => { if (selectedReseller) assignApp.mutate({ resellerId: parseInt(selectedReseller), appId: id }); }}
                disabled={!selectedReseller || assignApp.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {assignApp.isPending ? "Atribuindo..." : "Atribuir"}
              </Button>
            </div>
            <p className="text-gray-600 text-xs mt-3">O reseller selecionado terá acesso a este app no painel dele.</p>
          </div>
        </TabsContent>

        {/* ── Features Tab ── */}
        <TabsContent value="features" className="mt-4">
          <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Features do App
            </h3>
            {app.features ? (
              <div className="space-y-2">
                {app.features.split("\n").filter(Boolean).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600 text-sm">Nenhuma feature cadastrada. Edite o app para adicionar.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create / Edit Plan Modal ── */}
      <Dialog open={showPlan || !!editingPlan} onOpenChange={(open) => { if (!open) { setShowPlan(false); setEditingPlan(null); } }}>
        <DialogContent className="bg-[#0d0d14] border-white/[0.06] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPlan ? "Editar Plano" : "Novo Plano de Assinatura"}</DialogTitle>
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
            className="space-y-5 mt-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm">Nome do Plano *</Label>
                <Input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Daily, Weekly, Monthly" className="bg-white/[0.03] border-white/[0.06] text-white mt-1" required />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Duração (dias) *</Label>
                <Input type="number" value={planForm.durationDays} onChange={e => setPlanForm(f => ({ ...f, durationDays: e.target.value }))} className="bg-white/[0.03] border-white/[0.06] text-white mt-1" required />
                <p className="text-gray-600 text-xs mt-0.5">Use 9999 para Lifetime</p>
              </div>
            </div>

            {/* Separação visual dos dois sistemas */}
            <div className="rounded-xl border border-yellow-500/20 p-4 bg-yellow-500/5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">Sistema de Créditos</span>
                <span className="text-gray-600 text-xs ml-auto">Para resellers de créditos</span>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Preço em Créditos *</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={planForm.priceCredits}
                  onChange={e => setPlanForm(f => ({ ...f, priceCredits: e.target.value }))}
                  placeholder="Ex: 10.00"
                  className="bg-black/30 border-yellow-500/20 text-white mt-1 focus:border-yellow-500/50"
                  required
                />

              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 p-4 bg-purple-500/5 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold text-sm">Sistema de Porcentagem</span>
                <span className="text-gray-600 text-xs ml-auto">Para resellers de porcentagem</span>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Preço em R$ (base)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={planForm.pricePercentage}
                  onChange={e => setPlanForm(f => ({ ...f, pricePercentage: e.target.value }))}
                  placeholder="Ex: 25.00"
                  className="bg-black/30 border-purple-500/20 text-white mt-1 focus:border-purple-500/50"
                />
                {planForm.pricePercentage && (
                  <p className="text-purple-400 text-xs mt-1">
                    35% desc → R$ {(parseFloat(planForm.pricePercentage) * 0.65).toFixed(2)} · 50% desc → R$ {(parseFloat(planForm.pricePercentage) * 0.50).toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Preço final de venda (R$)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={planForm.resellerSellingPrice}
                  onChange={e => setPlanForm(f => ({ ...f, resellerSellingPrice: e.target.value }))}
                  placeholder="Ex: 50.00"
                  className="bg-black/30 border-emerald-500/20 text-white mt-1 focus:border-emerald-500/50"
                />
                <p className="text-emerald-400 text-xs mt-1">
                  Valor que os resellers devem cobrar do cliente final
                </p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">Nível</Label>
              <Select value={planForm.level} onValueChange={v => setPlanForm(f => ({ ...f, level: v as any }))}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/[0.06]">
                  <SelectItem value="basic" className="text-white">Basic</SelectItem>
                  <SelectItem value="premium" className="text-white">Premium</SelectItem>
                  <SelectItem value="lifetime" className="text-white">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowPlan(false); setEditingPlan(null); }} className="flex-1 border-white/[0.06] text-gray-300">Cancelar</Button>
              <Button type="submit" disabled={createPlan.isPending || updatePlan.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                {(createPlan.isPending || updatePlan.isPending) ? "Salvando..." : editingPlan ? "Salvar Alterações" : "Criar Plano"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
