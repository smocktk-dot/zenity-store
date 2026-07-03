import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye, AppWindow, Users } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", description: "", version: "v1.0", categoryId: "" as string, maxUsers: "5000", features: "" });

  const create = trpc.admin.createApp.useMutation({
    onSuccess: () => { toast.success("App criado!"); utils.admin.listApps.invalidate(); setShowCreate(false); resetForm(); },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateApp.useMutation({
    onSuccess: () => { toast.success("App atualizado!"); utils.admin.listApps.invalidate(); setEditApp(null); },
    onError: e => toast.error(e.message),
  });
  const del = trpc.admin.deleteApp.useMutation({
    onSuccess: () => { toast.success("App removido!"); utils.admin.listApps.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", description: "", version: "v1.0", categoryId: "", maxUsers: "5000", features: "" });

  const filtered = apps.filter((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description, version: form.version,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      maxUsers: parseInt(form.maxUsers) || 5000, features: form.features,
    };
    if (editApp) update.mutate({ id: editApp.id, ...payload });
    else create.mutate(payload);
  };

  const openEdit = (app: any) => {
    setEditApp(app);
    setForm({ name: app.name, description: app.description || "", version: app.version || "v1.0", categoryId: app.categoryId ? String(app.categoryId) : "", maxUsers: String(app.maxUsers || 5000), features: app.features || "" });
  };

  const getCategoryName = (id: number | null) => categories.find((c: any) => c.id === id)?.name || "—";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Apps / Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">{apps.length} apps cadastrados</p>
        </div>
        <Button onClick={() => { setShowCreate(true); resetForm(); }} className="bg-red-600 hover:bg-red-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Novo App
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar app..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-gray-600 col-span-3 text-center py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <AppWindow className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum app encontrado</p>
          </div>
        ) : filtered.map((app: any) => (
          <div key={app.id} className="rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all group" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 border border-purple-500/20 flex items-center justify-center">
                  <AppWindow className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{app.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">{app.version}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{getCategoryName(app.categoryId)}</span>
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${app.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>{app.status}</span>
            </div>
            <p className="text-gray-500 text-xs mb-4 line-clamp-2">{app.description || <span className="text-gray-700 italic">Sem descrição</span>}</p>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
              <Users className="w-3 h-3" />
              <span>Max {app.maxUsers?.toLocaleString()} usuários</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/admin/apps/${app.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-all">
                <Eye className="w-3.5 h-3.5" /> Ver Detalhes
              </button>
              <button onClick={() => openEdit(app)} className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 transition-all"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (confirm(`Remover "${app.name}"?`)) del.mutate({ id: app.id }); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate || !!editApp} onOpenChange={() => { setShowCreate(false); setEditApp(null); }}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-white">{editApp ? `Editar: ${editApp.name}` : "Novo App"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-gray-300 text-sm">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
              <div><Label className="text-gray-300 text-sm">Versão</Label><Input value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
              <div>
                <Label className="text-gray-300 text-sm">Categoria</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({...f, categoryId: v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent className="bg-[#0d0d14] border-white/10">
                    {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-gray-300 text-sm">Max Usuários</Label><Input type="number" value={form.maxUsers} onChange={e => setForm(f => ({...f, maxUsers: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            </div>
            <div><Label className="text-gray-300 text-sm">Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-gray-300 text-sm">Features (uma por linha)</Label><textarea value={form.features} onChange={e => setForm(f => ({...f, features: e.target.value}))} rows={3} placeholder="[+] Feature 1&#10;[+] Feature 2" className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:border-red-500/50" /></div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditApp(null); }} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1 bg-red-600 hover:bg-red-500 text-white">{create.isPending || update.isPending ? "Salvando..." : editApp ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
