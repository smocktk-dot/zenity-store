import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Users, DollarSign, Clock, Star } from "lucide-react";
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
  const { data: resellerApps } = trpc.admin.getResellerApps.useQuery({ resellerId: 0 }, { enabled: false });

  const [showPlan, setShowPlan] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", durationDays: "30", priceCredits: "", level: "basic" as "basic" | "premium" | "lifetime" });
  const [selectedReseller, setSelectedReseller] = useState("");

  const createPlan = trpc.admin.createPlan.useMutation({ onSuccess: () => { toast.success("Plano criado!"); utils.admin.getApp.invalidate({ id }); setShowPlan(false); }, onError: e => toast.error(e.message) });
  const deletePlan = trpc.admin.deletePlan.useMutation({ onSuccess: () => { toast.success("Plano removido!"); utils.admin.getApp.invalidate({ id }); }, onError: e => toast.error(e.message) });
  const assignApp = trpc.admin.assignApp.useMutation({ onSuccess: () => { toast.success("App atribuído!"); setSelectedReseller(""); }, onError: e => toast.error(e.message) });

  if (isLoading) return <div className="p-6 text-gray-500">Carregando...</div>;
  if (!app) return <div className="p-6 text-gray-500">App não encontrado</div>;

  const levelColors: Record<string, string> = { basic: "text-blue-400 bg-blue-500/20 border-blue-500/30", premium: "text-purple-400 bg-purple-500/20 border-purple-500/30", lifetime: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/apps")} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-white text-2xl font-bold">{app.name}</h1>
          <p className="text-gray-500 text-sm">{app.description || "Sem descrição"}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 font-mono">{app.version}</span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${app.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{app.status}</span>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="plans" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Planos de Assinatura</TabsTrigger>
          <TabsTrigger value="resellers" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Atribuir Resellers</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Features</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">{app.plans?.length || 0} planos configurados</p>
            <Button onClick={() => setShowPlan(true)} className="bg-red-600 hover:bg-red-500 text-white gap-2 h-8 text-sm">
              <Plus className="w-3.5 h-3.5" /> Novo Plano
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {!app.plans?.length ? (
              <p className="text-gray-600 col-span-4 text-center py-8">Nenhum plano criado</p>
            ) : app.plans.map((plan: any) => (
              <div key={plan.id} className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelColors[plan.level]}`}>{plan.level}</span>
                  <button onClick={() => { if (confirm("Remover plano?")) deletePlan.mutate({ id: plan.id }); }} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <h3 className="text-white font-semibold">{plan.name}</h3>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold font-mono">{parseFloat(plan.priceCredits).toFixed(2)}</span>
                    <span className="text-gray-600">créditos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-gray-400">{plan.durationDays >= 9000 ? "Lifetime" : `${plan.durationDays} dias`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Resellers Tab */}
        <TabsContent value="resellers" className="mt-4 space-y-4">
          <div className="rounded-xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Atribuir App a Reseller</h3>
            <div className="flex gap-3">
              <Select value={selectedReseller} onValueChange={setSelectedReseller}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1"><SelectValue placeholder="Selecionar reseller..." /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  {resellers.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-white">{r.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => { if (selectedReseller) assignApp.mutate({ resellerId: parseInt(selectedReseller), appId: id }); }} disabled={!selectedReseller || assignApp.isPending} className="bg-green-600 hover:bg-green-500 text-white">
                {assignApp.isPending ? "Atribuindo..." : "Atribuir"}
              </Button>
            </div>
            <p className="text-gray-600 text-xs mt-3">O reseller selecionado terá acesso a este app no painel dele.</p>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-4">
          <div className="rounded-xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Features do App</h3>
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

      {/* Create Plan Modal */}
      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Novo Plano de Assinatura</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createPlan.mutate({ appId: id, name: planForm.name, durationDays: parseInt(planForm.durationDays), priceCredits: parseFloat(planForm.priceCredits), level: planForm.level }); }} className="space-y-4 mt-2">
            <div><Label className="text-gray-300 text-sm">Nome *</Label><Input value={planForm.name} onChange={e => setPlanForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Daily, Weekly, Monthly" className="bg-white/5 border-white/10 text-white mt-1" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-gray-300 text-sm">Duração (dias) *</Label><Input type="number" value={planForm.durationDays} onChange={e => setPlanForm(f => ({...f, durationDays: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
              <div><Label className="text-gray-300 text-sm">Preço (créditos) *</Label><Input type="number" step="0.01" value={planForm.priceCredits} onChange={e => setPlanForm(f => ({...f, priceCredits: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Nível</Label>
              <Select value={planForm.level} onValueChange={v => setPlanForm(f => ({...f, level: v as any}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d0d14] border-white/10">
                  <SelectItem value="basic" className="text-white">Basic</SelectItem>
                  <SelectItem value="premium" className="text-white">Premium</SelectItem>
                  <SelectItem value="lifetime" className="text-white">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPlan(false)} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
              <Button type="submit" disabled={createPlan.isPending} className="flex-1 bg-red-600 hover:bg-red-500 text-white">{createPlan.isPending ? "Criando..." : "Criar Plano"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
