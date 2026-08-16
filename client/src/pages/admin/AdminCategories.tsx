import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Tag, Layers } from "lucide-react";
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
        <Button
          onClick={() => { setShowCreate(true); setForm({ name: "", description: "" }); }}
          className="relative overflow-hidden gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #10b981, #047857)",
            boxShadow: "0 0 20px rgba(16,185,129,0.35), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
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
          <div key={cat.id} className="rounded-3xl border border-white/[0.06] p-5 hover:border-purple-500/20 transition-all group" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), oklch(0.45 0.25 270 / 0.15))", border: "1px solid rgba(16,185,129,0.25)" }}>
                <Tag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditCat(cat); setForm({ name: cat.name, description: cat.description || "" }); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-500/20"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(`Remover "${cat.name}"?`)) del.mutate({ id: cat.id }); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.2))", border: "1px solid rgba(16,185,129,0.3)" }}>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <DialogTitle className="text-white text-lg font-semibold">{editCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="h-px w-full my-1" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)" }} />

          <form onSubmit={e => { e.preventDefault(); if (editCat) update.mutate({ id: editCat.id, ...form }); else create.mutate(form); }} className="space-y-4 mt-3">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="mt-1.5 text-white border-white/[0.06] focus:border-emerald-500/60 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
                required
                autoFocus
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Descrição</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                className="mt-1.5 text-white border-white/[0.06] focus:border-emerald-500/60 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={() => { setShowCreate(false); setEditCat(null); }}
                className="flex-1 font-medium text-gray-300 rounded-xl transition-all duration-200 active:scale-[0.97] hover:text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 font-semibold text-white rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #10b981, #047857)",
                  boxShadow: "0 0 20px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {create.isPending || update.isPending ? "Salvando..." : editCat ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
