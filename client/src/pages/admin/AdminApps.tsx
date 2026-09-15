import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, Eye, AppWindow, Users, Box, Tag, Key, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminApps() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: apps = [], isLoading } = trpc.admin.listApps.useQuery();
  const { data: categories = [] } = trpc.admin.listCategories.useQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editApp, setEditApp] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", version: "v1.0", categoryId: "" as string, maxUsers: "5000", features: "", keyauthSellerKey: "", keyMask: "" });

  const create = trpc.admin.createApp.useMutation({
    onSuccess: () => { toast.success("Aplicativo cadastrado com sucesso!"); utils.admin.listApps.invalidate(); setShowCreate(false); resetForm(); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateApp.useMutation({
    onSuccess: () => { toast.success("Aplicativo atualizado com sucesso!"); utils.admin.listApps.invalidate(); setEditApp(null); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.admin.deleteApp.useMutation({
    onSuccess: () => { toast.success("Aplicativo removido!"); utils.admin.listApps.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", description: "", version: "v1.0", categoryId: "", maxUsers: "5000", features: "", keyauthSellerKey: "", keyMask: "" });

  const filtered = apps.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyauthSellerKey = form.keyauthSellerKey.trim() || undefined;
    const keyMask = form.keyMask.trim() || undefined;
    const payload = {
      name: form.name, description: form.description, version: form.version,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      maxUsers: parseInt(form.maxUsers) || 5000, features: form.features,
      keyauthSellerKey, keyMask,
    };
    if (editApp) update.mutate({ id: editApp.id, ...payload });
    else create.mutate(payload);
  };

  const openEdit = (app: any) => {
    setEditApp(app);
    setForm({
      name: app.name,
      description: app.description || "",
      version: app.version || "v1.0",
      categoryId: app.categoryId ? String(app.categoryId) : "",
      maxUsers: String(app.maxUsers || 5000),
      features: app.features || "",
      keyauthSellerKey: app.keyauthSellerKey || "",
      keyMask: app.keyMask || "",
    });
  };

  const getCategoryName = (id: number | null) => categories.find((c: any) => c.id === id)?.name || "Geral";

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Catálogo de Aplicações</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              {apps.length} cadastrados
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Gerencie os produtos, planos de assinatura e integração com KeyAuth</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar software..."
              className="pl-9 h-9 text-xs rounded-xl bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <Button
            onClick={() => { setShowCreate(true); resetForm(); }}
            className="h-9 px-4 text-xs font-semibold rounded-xl border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo App
          </Button>
        </div>
      </div>

      {/* Grid de Aplicativos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <Box className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white text-sm font-semibold">Nenhum aplicativo encontrado</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Novo App" para cadastrar seu primeiro software</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app: any) => (
            <div
              key={app.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-emerald-500/30 transition-all p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <AppWindow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{app.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-400 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                          {app.version || "v1.0"}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                          {getCategoryName(app.categoryId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
                    app.status === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${app.status === "active" ? "bg-emerald-400" : "bg-gray-400"}`} />
                    {app.status === "active" ? "Ativo" : app.status}
                  </span>
                </div>

                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed min-h-[32px] mb-4">
                  {app.description || "Sem descrição informada."}
                </p>

                <div className="py-2 px-3 rounded-lg bg-black/30 border border-white/[0.04] mb-4 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Capacidade: {app.maxUsers ? Number(app.maxUsers).toLocaleString() : "5.000"}</span>
                  </span>
                  {app.keyauthSellerKey && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> KeyAuth Vinculado
                    </span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/apps/${app.id}`)}
                  className="flex-1 h-8 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Gerenciar Planos
                </Button>
                <button
                  onClick={() => openEdit(app)}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.08] transition-all"
                  title="Editar Informações"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(`Remover "${app.name}" permanentemente?`)) del.mutate({ id: app.id }); }}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar App */}
      <Dialog open={showCreate || !!editApp} onOpenChange={() => { setShowCreate(false); setEditApp(null); }}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-lg rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">
              {editApp ? `Editar: ${editApp.name}` : "Cadastrar Novo Aplicativo"}
            </DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Defina as informações básicas e integração do software</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-gray-300 text-xs font-medium block mb-1">Nome do Aplicativo *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: EMULATOR PUBLIC"
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Versão</Label>
                <Input
                  value={form.version}
                  onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                  placeholder="v1.0"
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Categoria</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white">
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-gray-300 text-xs font-medium block mb-1">Seller Key do KeyAuth (Opcional - 32 caracteres)</Label>
                <Input
                  value={form.keyauthSellerKey}
                  onChange={e => setForm(f => ({ ...f, keyauthSellerKey: e.target.value }))}
                  maxLength={32}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="bg-black/30 border-white/[0.1] text-white font-mono rounded-lg h-9 text-xs"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-gray-300 text-xs font-medium block mb-1">Máscara das Keys (Opcional - * = caractere aleatório)</Label>
                <Input
                  value={form.keyMask}
                  onChange={e => setForm(f => ({ ...f, keyMask: e.target.value }))}
                  maxLength={64}
                  placeholder="KEY-******-******"
                  className="bg-black/30 border-white/[0.1] text-white font-mono rounded-lg h-9 text-xs"
                />
                <p className="text-[11px] text-gray-500 mt-1">Formato das keys geradas via Seller API. Ex: <code className="text-emerald-400/80">KEY-******-******</code> gera <code className="text-emerald-400/80">KEY-a1b2c3-d4e5f6</code></p>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Descrição</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve resumo da ferramenta..."
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Recursos / Features (um por linha)</Label>
              <textarea
                value={form.features}
                onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                rows={3}
                placeholder="Aimbot com ajuste suave&#10;Visual ESP Box&#10;Bypass Vanguard"
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => { setShowCreate(false); setEditApp(null); }}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {create.isPending || update.isPending ? "Salvando..." : editApp ? "Salvar Alterações" : "Cadastrar App"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
