import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag, Layers, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.admin.listCategories.useQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const create = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      utils.admin.listCategories.invalidate();
      setShowCreate(false);
      setForm({ name: "", description: "" });
    },
    onError: e => toast.error(e.message)
  });

  const update = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria atualizada!");
      utils.admin.listCategories.invalidate();
      setEditCat(null);
    },
    onError: e => toast.error(e.message)
  });

  const del = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Categoria removida!");
      utils.admin.listCategories.invalidate();
    },
    onError: e => toast.error(e.message)
  });

  const filtered = categories.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Categorias de Produtos</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              {categories.length} cadastradas
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">Organize os softwares por nicho ou finalidade para facilitar a navegação</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="pl-9 h-9 text-xs rounded-xl bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <Button
            onClick={() => { setShowCreate(true); setForm({ name: "", description: "" }); }}
            className="h-9 px-4 text-xs font-semibold rounded-xl border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Categoria
          </Button>
        </div>
      </div>

      {/* Grid de Categorias */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white text-sm font-semibold">Nenhuma categoria cadastrada</p>
          <p className="text-gray-400 text-xs mt-1">Crie categorias para agrupar e organizar seus aplicativos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat: any) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-emerald-500/30 transition-all p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{cat.name}</h3>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Criada em {new Date(cat.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditCat(cat); setForm({ name: cat.name, description: cat.description || "" }); }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remover categoria "${cat.name}"?`)) del.mutate({ id: cat.id }); }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed min-h-[32px]">
                  {cat.description || "Sem descrição informada para esta categoria."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Categoria */}
      <Dialog open={showCreate || !!editCat} onOpenChange={() => { setShowCreate(false); setEditCat(null); }}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">
              {editCat ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">Defina o nome de identificação da categoria</p>
          </DialogHeader>

          <form
            onSubmit={e => {
              e.preventDefault();
              if (editCat) update.mutate({ id: editCat.id, ...form });
              else create.mutate(form);
            }}
            className="space-y-4"
          >
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Nome da Categoria *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Emuladores, FPS, Web Tools"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                required
                autoFocus
              />
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Descrição (Opcional)</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Softwares voltados para emulação"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={() => { setShowCreate(false); setEditCat(null); }}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
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
