import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, Edit2, UserCheck, UserX, PlusCircle, Package,
  CreditCard, Percent, Eye, Users, Store, Check, Key, Eraser, Infinity as InfinityIcon, CalendarClock,
  Globe, Trash2
} from "lucide-react";
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
  subscriptionExpiresAt?: Date | string | null;
};

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
      isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-gray-500/10 text-gray-400 border-gray-500/30"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
      {isActive ? "Ativo" : status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === "credits") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-300 font-medium flex items-center gap-1 w-fit">
        <CreditCard className="w-3 h-3" /> Créditos
      </span>
    );
  }
  if (type === "other") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium flex items-center gap-1 w-fit">
        <Store className="w-3 h-3" /> Other Store
      </span>
    );
  }
  if (type === "unlimited") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md border border-violet-500/25 bg-violet-500/10 text-violet-300 font-medium flex items-center gap-1 w-fit">
        <InfinityIcon className="w-3 h-3" /> Unlimited
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-medium flex items-center gap-1 w-fit">
      <Percent className="w-3 h-3" /> Porcentagem
    </span>
  );
}

const emptyCreate = { username: "", password: "", email: "", location: "", resellerType: "credits" as "credits" | "percentage" | "other" | "unlimited", canCreateSubResellers: false, subscriptionMonths: "1" };
const emptyEdit = { email: "", location: "", status: "active" as string, password: "", resellerType: "credits" as "credits" | "percentage" | "other" | "unlimited", discountPercent: "0", canCreateSubResellers: false, renewMonths: "1" };

export default function AdminResellers() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: resellers = [], isLoading } = trpc.admin.listResellers.useQuery();
  const { data: otherStores = [] } = trpc.admin.listOtherStoreResellers.useQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editReseller, setEditReseller] = useState<Reseller | null>(null);
  const [creditReseller, setCreditReseller] = useState<Reseller | null>(null);
  const [ipReseller, setIpReseller] = useState<Reseller | null>(null);
  const [newIp, setNewIp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cf, setCf] = useState(emptyCreate);
  const [ef, setEf] = useState(emptyEdit);
  const [creditAmount, setCreditAmount] = useState("");

  const create = trpc.admin.createReseller.useMutation({
    onSuccess: () => { toast.success("Reseller cadastrado com sucesso!"); utils.admin.listResellers.invalidate(); setShowCreate(false); setCf(emptyCreate); },
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
  const { data: whitelist = [] } = trpc.admin.listIpWhitelist.useQuery(undefined, { enabled: !!ipReseller });
  const addIp = trpc.admin.addIp.useMutation({
    onSuccess: () => { toast.success("IP autorizado!"); utils.admin.listIpWhitelist.invalidate(); setNewIp(""); },
    onError: e => toast.error(e.message),
  });
  const removeIp = trpc.admin.removeIp.useMutation({
    onSuccess: () => { toast.success("IP removido"); utils.admin.listIpWhitelist.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const purge = trpc.admin.purgeResellerPurchases.useMutation({
    onSuccess: d => {
      toast.success(`${d.keysDeleted} keys apagadas, ${d.transactionsDeleted} logs removidos — faturamento recalculado`);
      utils.admin.listResellers.invalidate();
      utils.admin.listAllKeys.invalidate();
      utils.admin.dashboardStats.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const filtered = (resellers as Reseller[]).filter(r =>
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );
  const creditsResellers = filtered.filter(r => r.resellerType === "credits");
  const percentageResellers = filtered.filter(r => r.resellerType === "percentage");
  const otherResellers = filtered.filter(r => r.resellerType === "other");
  const unlimitedResellers = filtered.filter(r => r.resellerType === "unlimited");

  const openEdit = (r: Reseller) => {
    setEditReseller(r);
    setEf({
      email: r.email || "",
      location: r.location || "",
      status: r.status,
      password: "",
      resellerType: (r.resellerType as "credits" | "percentage" | "other" | "unlimited") || "credits",
      discountPercent: String(parseFloat(String(r.discountPercent ?? 0))),
      canCreateSubResellers: (r as any).canCreateSubResellers === true,
      renewMonths: "1",
    });
  };

  const ResellerTable = ({ list, type }: { list: Reseller[]; type: "credits" | "percentage" | "other" | "unlimited" }) => (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-5 py-3">Usuário</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">{type === "credits" ? "Créditos" : type === "unlimited" ? "Assinatura" : "Desconto Atual"}</th>
              <th className="px-4 py-3 text-center">Compras</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Carregando revendedores...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhum reseller encontrado nesta categoria.</td></tr>
            ) : list.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                      {r.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-xs">{r.username}</p>
                      {r.location && <p className="text-[10px] text-gray-500">{r.location}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                  {r.email || "—"}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-bold">
                  {type === "credits" ? (
                    <span className="text-amber-300">{parseFloat(r.credits).toFixed(2)} cr</span>
                  ) : type === "unlimited" ? (
                    (() => {
                      const exp = r.subscriptionExpiresAt ? new Date(r.subscriptionExpiresAt) : null;
                      const expired = !exp || exp < new Date();
                      return (
                        <span className={expired ? "text-red-400" : "text-emerald-400"}>
                          {exp ? exp.toLocaleDateString("pt-BR") : "—"}
                          {expired && <span className="block text-[9px] font-normal">EXPIRADA</span>}
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-emerald-400">{parseFloat(r.discountPercent).toFixed(0)}% OFF</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-300 font-mono">
                  {r.totalPurchases}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {type === "credits" && (
                      <button
                        onClick={() => setCreditReseller(r)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                        title="Adicionar Créditos"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {type === "unlimited" && (
                      <>
                        <button
                          onClick={() => update.mutate({ id: r.id, renewMonths: 1 })}
                          className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all"
                          title="Renovar +1 mês"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setIpReseller(r); setNewIp(""); }}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                          title="IPs Autorizados (whitelist)"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/admin/resellers/${r.id}`)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-emerald-400 transition-all"
                      title="Gerenciar Softwares"
                    >
                      <Package className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => update.mutate({ id: r.id, status: r.status === "active" ? "inactive" : "active" })}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-amber-400 transition-all"
                      title={r.status === "active" ? "Desativar" : "Ativar"}
                    >
                      {r.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        const c = prompt(`Apagar TODAS as keys de "${r.username}"?\nIsso remove as keys, os logs de compra e corrige o faturamento.\n\nDigite o username para confirmar:`);
                        if (c) purge.mutate({ resellerId: r.id, confirmUsername: c });
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      title="Apagar todas as keys + logs de compra"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Gestão de Resellers</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              {resellers.length} cadastrados
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Gerencie revendedores de créditos, porcentagem e acesso externo</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar revendedor..."
              className="pl-9 h-9 text-xs rounded-xl bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 text-xs font-semibold rounded-xl border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Reseller
          </Button>
        </div>
      </div>

      {/* Metric Cards Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Resellers de Créditos</p>
            <p className="text-white font-bold font-mono text-xl leading-tight mt-0.5">
              {(resellers as Reseller[]).filter(r => r.resellerType === "credits").length}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Compram saldo de créditos</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Resellers de Porcentagem</p>
            <p className="text-white font-bold font-mono text-xl leading-tight mt-0.5">
              {(resellers as Reseller[]).filter(r => r.resellerType === "percentage").length}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Desconto progressivo por volume</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Other Store</p>
            <p className="text-white font-bold font-mono text-xl leading-tight mt-0.5">
              {(resellers as Reseller[]).filter(r => r.resellerType === "other").length}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Integração por IP e split automático</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <InfinityIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Unlimited</p>
            <p className="text-white font-bold font-mono text-xl leading-tight mt-0.5">
              {(resellers as Reseller[]).filter(r => r.resellerType === "unlimited").length}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Keys ilimitadas por assinatura mensal</p>
          </div>
        </div>
      </div>

      {/* Tabs por Tipo */}
      <Tabs defaultValue="credits" className="w-full">
        <div className="border-b border-white/[0.06] pb-3 mb-4">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl flex gap-1 h-auto w-fit">
            <TabsTrigger
              value="credits"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              Créditos ({creditsResellers.length})
            </TabsTrigger>
            <TabsTrigger
              value="percentage"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              Porcentagem ({percentageResellers.length})
            </TabsTrigger>
            <TabsTrigger
              value="other"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              Other Store ({otherResellers.length})
            </TabsTrigger>
            <TabsTrigger
              value="unlimited"
              className="data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-gray-400 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all flex items-center gap-1.5"
            >
              <InfinityIcon className="w-3.5 h-3.5 text-violet-400" />
              Unlimited ({unlimitedResellers.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="credits">
          <ResellerTable list={creditsResellers} type="credits" />
        </TabsContent>
        <TabsContent value="percentage">
          <ResellerTable list={percentageResellers} type="percentage" />
        </TabsContent>
        <TabsContent value="other">
          <ResellerTable list={otherResellers} type="other" />
        </TabsContent>
        <TabsContent value="unlimited">
          <ResellerTable list={unlimitedResellers} type="unlimited" />
        </TabsContent>
      </Tabs>

      {/* Modal Criar Reseller */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-md rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">Cadastrar Novo Reseller</DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Crie as credenciais de acesso para o revendedor</p>
          </DialogHeader>

          <form onSubmit={e => { e.preventDefault(); create.mutate({ ...cf, subscriptionMonths: parseInt(cf.subscriptionMonths) || 1 }); }} className="space-y-4">
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Username *</Label>
              <Input
                value={cf.username}
                onChange={e => setCf(f => ({ ...f, username: e.target.value }))}
                placeholder="Ex: revendedor_top"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Senha de Acesso *</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={cf.password}
                  onChange={e => setCf(f => ({ ...f, password: e.target.value }))}
                  placeholder="Senha forte..."
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Email</Label>
                <Input
                  type="email"
                  value={cf.email}
                  onChange={e => setCf(f => ({ ...f, email: e.target.value }))}
                  placeholder="contato@..."
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Localização</Label>
                <Input
                  value={cf.location}
                  onChange={e => setCf(f => ({ ...f, location: e.target.value }))}
                  placeholder="Ex: São Paulo, SP"
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Modalidade do Reseller *</Label>
              <Select value={cf.resellerType} onValueChange={v => setCf(f => ({ ...f, resellerType: v as any }))}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  <SelectItem value="credits" className="text-xs">Créditos (Gera keys com saldo em créditos)</SelectItem>
                  <SelectItem value="percentage" className="text-xs">Porcentagem (Desconto progressivo 35% a 50%)</SelectItem>
                  <SelectItem value="other" className="text-xs">Other Store (Acesso externo por IP e Split)</SelectItem>
                  <SelectItem value="unlimited" className="text-xs">Unlimited (Keys grátis por assinatura mensal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cf.resellerType === "unlimited" && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 space-y-2">
                <Label className="text-violet-300 text-xs font-medium block">Duração da Assinatura (meses) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={cf.subscriptionMonths}
                  onChange={e => setCf(f => ({ ...f, subscriptionMonths: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
                <p className="text-[10px] text-gray-500">
                  Gera keys de qualquer plano sem custo. Login bloqueado após a expiração + exige IP na whitelist.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="canCreateSubResellers"
                type="checkbox"
                checked={cf.canCreateSubResellers}
                onChange={e => setCf(f => ({ ...f, canCreateSubResellers: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="canCreateSubResellers" className="text-gray-300 text-xs cursor-pointer select-none">
                Permitir que este reseller crie sub-resellers
              </label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={create.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {create.isPending ? "Criando..." : "Cadastrar Reseller"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Reseller */}
      <Dialog open={!!editReseller} onOpenChange={() => setEditReseller(null)}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-md rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">Editar Reseller: {editReseller?.username}</DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Atualize dados, status e modalidade de revenda</p>
          </DialogHeader>

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
                canCreateSubResellers: ef.canCreateSubResellers,
                renewMonths: ef.resellerType === "unlimited" && parseInt(ef.renewMonths) > 0 ? parseInt(ef.renewMonths) : undefined,
              });
            }
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Email</Label>
                <Input
                  type="email"
                  value={ef.email}
                  onChange={e => setEf(f => ({ ...f, email: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Localização</Label>
                <Input
                  value={ef.location}
                  onChange={e => setEf(f => ({ ...f, location: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Tipo de Reseller</Label>
                <Select value={ef.resellerType} onValueChange={v => setEf(f => ({ ...f, resellerType: v as any }))}>
                  <SelectTrigger className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                    <SelectItem value="credits" className="text-xs">Créditos</SelectItem>
                    <SelectItem value="percentage" className="text-xs">Porcentagem</SelectItem>
                    <SelectItem value="other" className="text-xs">Other Store</SelectItem>
                    <SelectItem value="unlimited" className="text-xs">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Status</Label>
                <Select value={ef.status} onValueChange={v => setEf(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                    <SelectItem value="active" className="text-xs">Ativo</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inativo</SelectItem>
                    <SelectItem value="banned" className="text-xs">Banido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {ef.resellerType === "unlimited" && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 space-y-2">
                <Label className="text-violet-300 text-xs font-medium block">Renovar Assinatura (meses)</Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={ef.renewMonths}
                  onChange={e => setEf(f => ({ ...f, renewMonths: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
                <p className="text-[10px] text-gray-500">
                  {editReseller?.subscriptionExpiresAt
                    ? `Expira em: ${new Date(editReseller.subscriptionExpiresAt).toLocaleString("pt-BR")}`
                    : "Sem assinatura ativa — definir meses ativa o login."}
                  {" "}0 = não renovar agora.
                </p>
              </div>
            )}

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Nova Senha (Deixe em branco para não alterar)</Label>
              <Input
                type="password"
                value={ef.password}
                onChange={e => setEf(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="editCanCreateSubResellers"
                type="checkbox"
                checked={ef.canCreateSubResellers}
                onChange={e => setEf(f => ({ ...f, canCreateSubResellers: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="editCanCreateSubResellers" className="text-gray-300 text-xs cursor-pointer select-none">
                Permitir que este reseller crie sub-resellers
              </label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => setEditReseller(null)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={update.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {update.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Créditos */}
      <Dialog open={!!creditReseller} onOpenChange={() => setCreditReseller(null)}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">Adicionar Créditos</DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Reseller: {creditReseller?.username}</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-gray-400">Saldo Atual:</span>
              <span className="text-amber-300 font-mono font-bold text-sm">{creditReseller ? parseFloat(creditReseller.credits).toFixed(2) : "0.00"} cr</span>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Quantidade de Créditos</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                placeholder="Ex: 50.00"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs font-mono"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => setCreditReseller(null)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (creditReseller && creditAmount) {
                    addCredits.mutate({ resellerId: creditReseller.id, amount: parseFloat(creditAmount) });
                  }
                }}
                disabled={addCredits.isPending || !creditAmount}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {addCredits.isPending ? "Adicionando..." : "Confirmar Créditos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal IPs Autorizados (Unlimited) */}
      <Dialog open={!!ipReseller} onOpenChange={() => setIpReseller(null)}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> IPs Autorizados
            </DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">
              Reseller: {ipReseller?.username} — somente esses IPs conseguem acessar a conta
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl bg-black/40 border border-white/[0.06] divide-y divide-white/[0.04] max-h-44 overflow-y-auto">
              {(whitelist as any[]).filter(w => w.userType === "reseller" && w.userId === ipReseller?.id).length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-5">
                  Nenhum IP autorizado — o reseller não consegue logar até você adicionar um
                </p>
              ) : (
                (whitelist as any[])
                  .filter(w => w.userType === "reseller" && w.userId === ipReseller?.id)
                  .map(w => (
                    <div key={w.id} className="flex items-center justify-between px-3.5 py-2.5">
                      <div>
                        <p className="text-white text-xs font-mono">{w.ip}</p>
                        {w.label && <p className="text-[10px] text-gray-500">{w.label}</p>}
                      </div>
                      <button
                        onClick={() => removeIp.mutate({ id: w.id })}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remover IP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Autorizar novo IP</Label>
              <Input
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                placeholder="Ex: 177.74.234.137"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs font-mono"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => setIpReseller(null)}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (ipReseller && newIp.trim()) {
                    addIp.mutate({ ip: newIp.trim(), label: ipReseller.username, userType: "reseller", userId: ipReseller.id });
                  }
                }}
                disabled={addIp.isPending || !newIp.trim()}
                className="flex-1 h-9 rounded-lg font-semibold bg-blue-500 hover:bg-blue-400 text-black text-xs border-0"
              >
                {addIp.isPending ? "Autorizando..." : "Autorizar IP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
