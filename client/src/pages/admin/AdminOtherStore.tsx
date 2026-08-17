import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AdminOtherStore() {
  const [location, navigate] = useLocation();
  const { data: list, refetch } = trpc.admin.listOtherStoreResellers.useQuery();
  const { data: resellers } = trpc.admin.listResellers.useQuery();
  const create = trpc.admin.createOtherStoreReseller.useMutation({ onSuccess: () => { toast.success("Criado"); refetch(); } });
  const update = trpc.admin.updateOtherStoreReseller.useMutation({ onSuccess: () => { toast.success("Atualizado"); refetch(); } });
  const del = trpc.admin.deleteOtherStoreReseller.useMutation({ onSuccess: () => { toast.success("Removido"); refetch(); } });
  const addIp = trpc.admin.addOtherStoreIp.useMutation({ onSuccess: () => { toast.success("IP adicionado"); refetch(); } });
  const remIp = trpc.admin.removeOtherStoreIp.useMutation({ onSuccess: () => { toast.success("IP removido"); refetch(); } });

  const [form, setForm] = useState({
    resellerId: "",
    label: "",
    purinApiKey: "",
    recipientEmail: "",
    splitPercent: "45",
    newIp: "",
  });
  const [editing, setEditing] = useState<number | null>(null);

  function handleCreate() {
    create.mutate({
      resellerId: Number(form.resellerId),
      label: form.label,
      purinApiKey: form.purinApiKey,
      recipientEmail: form.recipientEmail,
      splitPercent: Number(form.splitPercent),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin"><ArrowLeft className="w-5 h-5 text-gray-400 cursor-pointer" /></Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-emerald-500" /> Other Store
        </h1>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-white">Novo Other Store</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400 text-xs uppercase">Reseller</Label>
              <select
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-white px-3 outline-none focus:border-emerald-500"
                value={form.resellerId}
                onChange={e => setForm({ ...form, resellerId: e.target.value })}
              >
                <option value="">Selecione</option>
                {resellers?.map(r => (
                  <option key={r.id} value={r.id}>{r.username}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Label</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Purin API Key</Label>
              <Input value={form.purinApiKey} onChange={e => setForm({ ...form, purinApiKey: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Email destinatário split</Label>
              <Input value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase">Split % para destinatário</Label>
              <Input type="number" value={form.splitPercent} onChange={e => setForm({ ...form, splitPercent: e.target.value })} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-500"><Plus className="w-4 h-4 mr-2" /> Criar</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {list?.map(item => (
          <Card key={item.id} className="glass-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{item.label || `#${item.id}`}</p>
                  <p className="text-sm text-gray-400">Reseller: {resellers?.find(r => r.id === item.resellerId)?.username} | Split: {item.splitPercent}%</p>
                  <p className="text-xs text-gray-500">{item.recipientEmail}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: item.id })} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">IPs autorizados:</p>
                <div className="flex flex-wrap gap-2">
                  {(item.ips as any[])?.map((ip: any) => (
                    <span key={ip.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center gap-2">
                      {ip.ip}
                      <Trash2 className="w-3 h-3 cursor-pointer text-red-400" onClick={() => remIp.mutate({ id: ip.id })} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input placeholder="Novo IP" className="bg-white/5 border-white/10 h-9 w-48" value={editing === item.id ? form.newIp : ""} onChange={e => { setEditing(item.id); setForm({ ...form, newIp: e.target.value }); }} />
                  <Button size="sm" onClick={() => { addIp.mutate({ otherStoreResellerId: item.id, ip: form.newIp }); setForm({ ...form, newIp: "" }); }} className="bg-emerald-600 hover:bg-emerald-500"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
