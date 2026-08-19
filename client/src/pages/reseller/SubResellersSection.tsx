import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
          <Button onClick={() => setOpen(true)} className="gap-2 h-9 text-xs bg-emerald-600 hover:bg-emerald-500" size="sm">
            <Plus className="w-3.5 h-3.5" /> Criar
          </Button>
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
        <DialogContent className="text-white border-0" style={{ background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)", boxShadow: "0 0 0 1px rgba(16,185,129,0.2), 0 25px 60px rgba(0,0,0,0.7)" }}>
          <h3 className="text-lg font-bold text-white mb-4">Criar Reseller</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs uppercase">Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 text-white border-white/10 bg-white/5" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Senha</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 text-white border-white/10 bg-white/5" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Email (opcional)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 text-white border-white/10 bg-white/5" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Desconto</Label>
              <select
                value={discount}
                onChange={(e) => setDiscount(e.target.value as "35" | "40" | "50")}
                className="w-full h-10 mt-1.5 rounded-md px-3 text-white border-white/10 bg-white/5 focus:outline-none focus:border-emerald-500"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <option value="35" className="bg-[#0a0a0c] text-white">35%</option>
                <option value="40" className="bg-[#0a0a0c] text-white">40%</option>
                <option value="50" className="bg-[#0a0a0c] text-white">50%</option>
              </select>
            </div>
            <Button type="submit" disabled={create.isPending} className="w-full bg-emerald-600 hover:bg-emerald-500">
              {create.isPending ? "Criando..." : "Criar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
