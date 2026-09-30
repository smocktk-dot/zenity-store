import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Users, UserPlus, User, Lock, Mail, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SubResellersSection() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [discount, setDiscount] = useState<"35" | "40" | "50">("35");
  const { data, refetch } = trpc.reseller.listSubResellers.useQuery();
  const create = trpc.reseller.createSubReseller.useMutation({
    onSuccess: () => { toast.success("Reseller criado"); setOpen(false); setUsername(""); setPassword(""); setEmail(""); setDiscount("35"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.reseller.deleteSubReseller.useMutation({
    onSuccess: () => { toast.success("Reseller removido"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    create.mutate({ username, password, email: email.trim() || undefined, discountPercent: discount });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Meus Resellers</h2>
            <p className="text-gray-500 text-xs">Crie logins de resellers para seu time.</p>
          </div>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 transition-all">
            <Plus className="w-3.5 h-3.5" /> Criar
          </button>
        </div>

        {data?.length === 0 && <p className="text-gray-500 text-sm">Nenhum reseller criado ainda.</p>}
        <div className="space-y-2">
          {data?.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">{r.username[0].toUpperCase()}</div>
                <div>
                  <p className="text-white text-sm font-medium">{r.username}</p>
                  <p className="text-gray-500 text-xs">{r.email || "sem email"} · {r.discountPercent}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{r.status}</span>
                <button
                  onClick={() => remove.mutate({ id: r.id })}
                  disabled={remove.isPending}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#080808] border-white/[0.08] text-white max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="p-6 space-y-5" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(8,8,8,0.9) 120px)" }}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-base font-semibold">Criar Reseller</DialogTitle>
                  <p className="text-gray-500 text-xs">Novo login de sub-reseller para o seu time</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Usuário</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-gray-600 focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-gray-600 focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Email (opcional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-gray-600 focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">Desconto</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value as "35" | "40" | "50")}
                    className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm text-white border border-white/[0.06] bg-white/[0.03] focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                  >
                    <option value="35" className="bg-[#0a0a0c] text-white">35% de desconto</option>
                    <option value="40" className="bg-[#0a0a0c] text-white">40% de desconto</option>
                    <option value="50" className="bg-[#0a0a0c] text-white">50% de desconto</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm transition-all border border-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-semibold transition-all border border-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {create.isPending ? "Criando..." : "Criar Reseller"}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
