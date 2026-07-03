import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.admin.listCategories.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const create = trpc.admin.createCategory.useMutation({ onSuccess: () => { toast.success("Categoria criada!"); utils.admin.listCategories.invalidate(); setShowCreate(false); setForm({ name: "", description: "" }); }, onError: e => toast.error(e.message) });
  const update = trpc.admin.updateCategory.useMutation({ onSuccess: () => { toast.success("Categoria atualizada!"); utils.admin.listCategories.invalidate(); setEditCat(null); }, onError: e => toast.error(e.message) });
  const del = trpc.admin.deleteCategory.useMutation({ onSuccess: () => { toast.success("Categoria removida!"); utils.admin.listCategories.invalidate(); }, onError: e => toast.error(e.message) });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Categorias</h1>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setForm({ name: "", description: "" }); }} className="bg-red-600 hover:bg-red-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-gray-600 col-span-3 text-center py-8">Carregando...</p>
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <Tag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma categoria criada</p>
            <p className="text-gray-700 text-sm mt-1">Crie categorias para organizar seus apps</p>
          </div>
        ) : categories.map((cat: any) => (
          <div key={cat.id} className="rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Tag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditCat(cat); setForm({ name: cat.name, description: cat.description || "" }); }} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Remover "${cat.name}"?`)) del.mutate({ id: cat.id }); }} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="text-white font-semibold">{cat.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{cat.description || <span className="text-gray-700 italic">Sem descrição</span>}</p>
            <p className="text-gray-700 text-xs mt-3">{new Date(cat.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate || !!editCat} onOpenChange={() => { setShowCreate(false); setEditCat(null); }}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (editCat) update.mutate({ id: editCat.id, ...form }); else create.mutate(form); }} className="space-y-4 mt-2">
            <div><Label className="text-gray-300 text-sm">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
            <div><Label className="text-gray-300 text-sm">Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditCat(null); }} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
              <Button type="submit" disabled={create.isPending || update.isPending} className="flex-1 bg-red-600 hover:bg-red-500 text-white">{create.isPending || update.isPending ? "Salvando..." : editCat ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
