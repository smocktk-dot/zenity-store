import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Search, Edit, UserCheck, UserX, PlusCircle, Package, CreditCard, Percent, Eye, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Reseller = {
  id: number; username: string; email: string | null; credits: string;
  totalPurchases: number; discountPercent: string; status: string;
  location: string | null; resellerType: string; createdAt: Date; lastLoginAt: Date | null;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    banned: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? map.inactive}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  return type === "credits"
    ? <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 w-fit"><CreditCard className="w-3 h-3" />Créditos</span>
    : <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1 w-fit"><Percent className="w-3 h-3" />Porcentagem</span>;
}

const emptyCreate = { username: "", password: "", email: "", location: "", resellerType: "credits" as "credits" | "percentage" };
const emptyEdit = { email: "", location: "", status: "active" as string, password: "", resellerType: "credits" as "credits" | "percentage", discountPercent: "0" };

export default function AdminResellers() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: resellers = [], isLoading } = trpc.admin.listResellers.useQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editReseller, setEditReseller] = useState<Reseller | null>(null);
  const [creditReseller, setCreditReseller] = useState<Reseller | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [cf, setCf] = useState(emptyCreate);
  const [ef, setEf] = useState(emptyEdit);
  const [creditAmount, setCreditAmount] = useState("");

  const create = trpc.admin.createReseller.useMutation({
    onSuccess: () => { toast.success("Reseller criado!"); utils.admin.listResellers.invalidate(); setShowCreate(false); setCf(emptyCreate); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateReseller.useMutation({
    onSuccess: () => { toast.success("Reseller atualizado!"); utils.admin.listResellers.invalidate(); setEditReseller(null); },
    onError: e => toast.error(e.message),
  });
  const addCredits = trpc.admin.addCredits.useMutation({
    onSuccess: () => { toast.success("Créditos adicionados!"); utils.admin.listResellers.invalidate(); setCreditReseller(null); setCreditAmount(""); },
    onError: e => toast.error(e.message),
  });

  const filtered = (resellers as Reseller[]).filter(r =>
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );
  const creditsResellers = filtered.filter(r => r.resellerType === "credits");
  const percentageResellers = filtered.filter(r => r.resellerType === "percentage");

  const openEdit = (r: Reseller) => {
    setEditReseller(r);
    setEf({
      email: r.email || "",
      location: r.location || "",
      status: r.status,
      password: "",
      resellerType: (r.resellerType as "credits" | "percentage") || "credits",
      discountPercent: String(parseFloat(String(r.discountPercent ?? 0))),
    });
  };

  const ResellerTable = ({ list, type }: { list: Reseller[]; type: "credits" | "percentage" }) => (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {["Usuário", "Email", type === "credits" ? "Créditos" : "Desconto Atual", type === "credits" ? "Compras" : "Compras (progresso)", "Status", "Ações"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={6} className="text-center py-8 text-gray-600">Carregando...</td></tr>
          ) : list.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-gray-600">Nenhum reseller encontrado</td></tr>
          ) : list.map(r => (
            <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase ${type === "credits" ? "bg-yellow-600/30 text-yellow-400" : "bg-purple-600/30 text-purple-400"}`}>
                    {r.username[0]}
                  </div>
                  <span className="text-white text-sm font-medium">{r.username}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 text-sm">{r.email || <span className="text-gray-600">—</span>}</td>
              {type === "credits" ? (
                <td className="px-4 py-3 text-yellow-400 text-sm font-mono font-medium">{parseFloat(r.credits).toFixed(2)}</td>
              ) : (
                <td className="px-4 py-3 text-purple-400 text-sm font-medium">{parseFloat(r.discountPercent).toFixed(0)}%</td>
              )}
              {type === "credits" ? (
                <td className="px-4 py-3 text-gray-400 text-sm">{r.totalPurchases}</td>
              ) : (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">{r.totalPurchases}</span>
                    <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${Math.min(100, (r.totalPurchases % 10) * 10)}%` }}
                      />
                    </div>
                    <span className="text-gray-600 text-xs">{r.totalPurchases < 10 ? `${r.totalPurchases}/10` : r.totalPurchases < 20 ? `${r.totalPurchases}/20` : "MAX"}</span>
                  </div>
                </td>
              )}
              <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                  {type === "credits" && (
                    <button onClick={() => setCreditReseller(r)} className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all" title="Adicionar créditos"><PlusCircle className="w-3.5 h-3.5" /></button>
                  )}
                  <button
                    onClick={() => navigate(`/admin/resellers/${r.id}`)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                    title="Gerenciar Apps"
                  >
                    <Package className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => update.mutate({ id: r.id, status: r.status === "active" ? "inactive" : "active" })}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                    title={r.status === "active" ? "Desativar" : "Ativar"}
                  >
                    {r.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Resellers</h1>
          <p className="text-gray-500 text-sm mt-1">{resellers.length} resellers cadastrados</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="relative overflow-hidden gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.28 290), oklch(0.45 0.25 270))",
            boxShadow: "0 0 20px oklch(0.55 0.28 290 / 0.35), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <Plus className="w-4 h-4" /> Novo Reseller
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-yellow-500/20 p-4" style={{ background: "rgba(234,179,8,0.05)" }}>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Resellers de Créditos</span>
          </div>
          <p className="text-white text-2xl font-bold">{(resellers as Reseller[]).filter(r => r.resellerType === "credits").length}</p>
          <p className="text-gray-500 text-xs mt-1">Compram keys usando saldo de créditos</p>
        </div>
        <div className="rounded-xl border border-purple-500/20 p-4" style={{ background: "rgba(168,85,247,0.05)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">Resellers de Porcentagem</span>
          </div>
          <p className="text-white text-2xl font-bold">{(resellers as Reseller[]).filter(r => r.resellerType === "percentage").length}</p>
          <p className="text-gray-500 text-xs mt-1">Compram keys com desconto progressivo</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar reseller..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
      </div>

      {/* Tabs por tipo */}
      <Tabs defaultValue="credits">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="credits" className="data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-400 text-gray-400 gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Créditos ({creditsResellers.length})
          </TabsTrigger>
          <TabsTrigger value="percentage" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 text-gray-400 gap-1.5">
            <Percent className="w-3.5 h-3.5" /> Porcentagem ({percentageResellers.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="credits" className="mt-4">
          <ResellerTable list={creditsResellers} type="credits" />
        </TabsContent>
        <TabsContent value="percentage" className="mt-4">
          <ResellerTable list={percentageResellers} type="percentage" />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          className="text-white max-w-md border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 290 / 0.3), oklch(0.45 0.25 270 / 0.2))", border: "1px solid oklch(0.55 0.28 290 / 0.3)" }}>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">Criar Reseller</DialogTitle>
            </div>
          </DialogHeader>
          <div className="h-px w-full my-1" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
          <form onSubmit={e => { e.preventDefault(); create.mutate(cf); }} className="space-y-4 mt-3">
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Username *</Label><Input value={cf.username} onChange={e => setCf(f => ({...f, username: e.target.value}))} className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} required /></div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Senha *</Label>
              <div className="relative mt-1.5">
                <Input type={showPass ? "text" : "password"} value={cf.password} onChange={e => setCf(f => ({...f, password: e.target.value}))} className="text-white border-white/10 focus:border-purple-500/60 transition-colors pr-10" style={{ background: "rgba(255,255,255,0.05)" }} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"><Eye className="w-4 h-4" /></button>
              </div>
            </div>
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Email</Label><Input type="email" value={cf.email} onChange={e => setCf(f => ({...f, email: e.target.value}))} className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} /></div>
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Localização</Label><Input value={cf.location} onChange={e => setCf(f => ({...f, location: e.target.value}))} placeholder="Ex: São Paulo, SP" className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} /></div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tipo de Reseller *</Label>
              <Select value={cf.resellerType} onValueChange={v => setCf(f => ({...f, resellerType: v as "credits" | "percentage"}))}>
                <SelectTrigger className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "rgba(18,12,35,0.98)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <SelectItem value="credits" className="text-white focus:bg-purple-500/20">
                    <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-yellow-400" /><div><div className="font-medium">Créditos</div><div className="text-xs text-gray-400">Compra keys usando saldo de créditos</div></div></div>
                  </SelectItem>
                  <SelectItem value="percentage" className="text-white focus:bg-purple-500/20">
                    <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-purple-400" /><div><div className="font-medium">Porcentagem</div><div className="text-xs text-gray-400">Desconto progressivo 35% → 40% → 50%</div></div></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cf.resellerType === "credits" && (
              <div className="rounded-lg border border-yellow-500/20 p-3 text-xs text-yellow-400/80" style={{ background: "rgba(234,179,8,0.05)" }}>
                O reseller poderá comprar créditos e usar o saldo para gerar license keys.
              </div>
            )}
            {cf.resellerType === "percentage" && (
              <div className="rounded-lg border border-purple-500/20 p-3 text-xs text-purple-400/80" style={{ background: "rgba(168,85,247,0.05)" }}>
                O reseller terá desconto progressivo: 35% inicial → 40% após 10 compras → 50% após 20 compras (máximo).
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShowCreate(false)} className="flex-1 font-medium text-gray-300 rounded-xl transition-all duration-200 active:scale-[0.97] hover:text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</Button>
              <Button type="submit" disabled={create.isPending} className="flex-1 font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50" style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 290), oklch(0.45 0.25 270))", boxShadow: "0 0 20px oklch(0.55 0.28 290 / 0.3), 0 4px 12px rgba(0,0,0,0.3)" }}>{create.isPending ? "Criando..." : "Criar Reseller"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editReseller} onOpenChange={() => setEditReseller(null)}>
        <DialogContent
          className="text-white max-w-md border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 290 / 0.3), oklch(0.45 0.25 270 / 0.2))", border: "1px solid oklch(0.55 0.28 290 / 0.3)" }}>
                <Edit className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold">Editar Reseller</DialogTitle>
                <div className="mt-0.5"><TypeBadge type={editReseller?.resellerType ?? "credits"} /></div>
              </div>
            </div>
          </DialogHeader>
          <div className="h-px w-full my-1" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />
          <form onSubmit={e => {
            e.preventDefault();
            if (editReseller) {
              const discount = parseFloat(ef.discountPercent);
              update.mutate({
                id: editReseller.id,
                email: ef.email || undefined,
                location: ef.location || undefined,
                status: ef.status as "active" | "inactive" | "banned",
                password: ef.password || undefined,
                resellerType: ef.resellerType,
                discountPercent: !isNaN(discount) && discount >= 0 && discount <= 100 ? discount : undefined,
              });
            }
          }} className="space-y-4 mt-3">
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Email</Label><Input type="email" value={ef.email} onChange={e => setEf(f => ({...f, email: e.target.value}))} className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} /></div>
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Localização</Label><Input value={ef.location} onChange={e => setEf(f => ({...f, location: e.target.value}))} className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} /></div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tipo de Reseller</Label>
              <Select value={ef.resellerType} onValueChange={v => setEf(f => ({...f, resellerType: v as "credits" | "percentage"}))}>
                <SelectTrigger className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "rgba(18,12,35,0.98)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <SelectItem value="credits" className="text-white focus:bg-purple-500/20">Créditos</SelectItem>
                  <SelectItem value="percentage" className="text-white focus:bg-purple-500/20">Porcentagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Status</Label>
              <Select value={ef.status} onValueChange={v => setEf(f => ({...f, status: v}))}>
                <SelectTrigger className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "rgba(18,12,35,0.98)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <SelectItem value="active" className="text-white focus:bg-purple-500/20">Ativo</SelectItem>
                  <SelectItem value="inactive" className="text-white focus:bg-purple-500/20">Inativo</SelectItem>
                  <SelectItem value="banned" className="text-white focus:bg-purple-500/20">Banido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Desconto (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={ef.discountPercent}
                onChange={e => setEf(f => ({...f, discountPercent: e.target.value}))}
                className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <p className="text-gray-600 text-xs mt-1">Ex: 35, 40, 50. Usado para resellers de porcentagem e progressão de créditos.</p>
            </div>
            <div><Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Nova Senha (opcional)</Label><Input type="password" value={ef.password} onChange={e => setEf(f => ({...f, password: e.target.value}))} placeholder="Deixe vazio para manter" className="mt-1.5 text-white border-white/10 focus:border-purple-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setEditReseller(null)} className="flex-1 font-medium text-gray-300 rounded-xl transition-all duration-200 active:scale-[0.97] hover:text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</Button>
              <Button type="submit" disabled={update.isPending} className="flex-1 font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50" style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 290), oklch(0.45 0.25 270))", boxShadow: "0 0 20px oklch(0.55 0.28 290 / 0.3), 0 4px 12px rgba(0,0,0,0.3)" }}>{update.isPending ? "Salvando..." : "Salvar Alterações"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Credits Modal (apenas para resellers de créditos) */}
      <Dialog open={!!creditReseller} onOpenChange={() => setCreditReseller(null)}>
        <DialogContent
          className="text-white max-w-sm border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.25), rgba(234,179,8,0.1))", border: "1px solid rgba(234,179,8,0.3)" }}>
                <CreditCard className="w-4 h-4 text-yellow-400" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">Adicionar Créditos</DialogTitle>
            </div>
          </DialogHeader>
          <div className="h-px w-full my-1" style={{ background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.3), transparent)" }} />
          <div className="space-y-4 mt-3">
            <div className="rounded-xl p-3.5" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
              <p className="text-gray-400 text-sm">Reseller: <span className="text-white font-semibold">{creditReseller?.username}</span></p>
              <p className="text-gray-400 text-sm mt-1">Saldo atual: <span className="text-yellow-400 font-mono font-semibold">{parseFloat(creditReseller?.credits ?? "0").toFixed(2)} créditos</span></p>
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Quantidade de Créditos</Label>
              <Input type="number" min="0.01" step="0.01" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Ex: 100.00" className="mt-1.5 text-white border-white/10 focus:border-yellow-500/60 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setCreditReseller(null)} className="flex-1 font-medium text-gray-300 rounded-xl transition-all duration-200 active:scale-[0.97] hover:text-white" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>Cancelar</Button>
              <Button onClick={() => { if (creditReseller && creditAmount) addCredits.mutate({ resellerId: creditReseller.id, amount: parseFloat(creditAmount) }); }} disabled={addCredits.isPending || !creditAmount} className="flex-1 font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50" style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.9), rgba(16,122,55,0.9))", boxShadow: "0 0 20px rgba(22,163,74,0.25), 0 4px 12px rgba(0,0,0,0.3)" }}>{addCredits.isPending ? "Adicionando..." : "Adicionar Créditos"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
