import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Store, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
    >
      {children}
    </div>
  );
}

export default function AdminOtherStore() {
  const { data: list, refetch } = trpc.admin.listOtherStoreResellers.useQuery();
  const { data: resellers } = trpc.admin.listResellers.useQuery();
  const create = trpc.admin.createOtherStoreReseller.useMutation({ onSuccess: () => { toast.success("Criado"); refetch(); } });
  const del = trpc.admin.deleteOtherStoreReseller.useMutation({ onSuccess: () => { toast.success("Removido"); refetch(); } });
  const addHwid = trpc.admin.addOtherStoreHwid.useMutation({ onSuccess: () => { toast.success("HWID adicionado"); refetch(); } });
  const remHwid = trpc.admin.removeOtherStoreHwid.useMutation({ onSuccess: () => { toast.success("HWID removido"); refetch(); } });

  const [form, setForm] = useState({
    resellerId: "",
    label: "",
    purinApiKey: "",
    recipientEmail: "",
    discordId: "",
    splitPercent: "45",
    newHwid: "",
  });
  const [editing, setEditing] = useState<number | null>(null);

  function handleCreate() {
    create.mutate({
      resellerId: Number(form.resellerId),
      label: form.label,
      purinApiKey: form.purinApiKey,
      recipientEmail: form.recipientEmail,
      discordId: form.discordId || undefined,
      splitPercent: Number(form.splitPercent),
    });
  }

  const inputClass = "h-11 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin"><ArrowLeft className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" /></Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-emerald-500" /> Other Store
        </h1>
      </div>

      <GlassCard>
        <h2 className="text-lg font-semibold text-white mb-4">Novo Other Store</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Reseller</Label>
            <Select
              value={form.resellerId}
              onValueChange={v => setForm({ ...form, resellerId: v })}
            >
              <SelectTrigger className={inputClass} data-slot="select-trigger">
                <SelectValue placeholder="Selecione o reseller" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f13] border-white/10 text-white">
                {resellers?.map(r => (
                  <SelectItem key={r.id} value={String(r.id)} className="hover:bg-emerald-500/20 focus:bg-emerald-500/20">
                    {r.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Label</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={inputClass} placeholder="Ex: Loja parceiro" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Purin API Key</Label>
            <Input value={form.purinApiKey} onChange={e => setForm({ ...form, purinApiKey: e.target.value })} className={inputClass} placeholder="ps_live_..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Email destinatario split</Label>
            <Input value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} className={inputClass} placeholder="parceiro@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Discord ID</Label>
            <Input value={form.discordId} onChange={e => setForm({ ...form, discordId: e.target.value })} className={inputClass} placeholder="123456789012345678" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs uppercase">Split % para destinatario</Label>
            <Input type="number" value={form.splitPercent} onChange={e => setForm({ ...form, splitPercent: e.target.value })} className={inputClass} placeholder="45" />
          </div>
        </div>
        <div className="mt-5">
          <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-500 h-11 px-5">
            <Save className="w-4 h-4 mr-2" /> Criar
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {list?.map(item => (
          <GlassCard key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-lg">{item.label || `Other Store #${item.id}`}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Reseller: <span className="text-emerald-400">{resellers?.find(r => r.id === item.resellerId)?.username || item.resellerId}</span>
                  {" | "} Split: <span className="text-emerald-400">{item.splitPercent}%</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.recipientEmail}</p>
                {item.discordId && <p className="text-xs text-blue-400 mt-0.5 font-mono">Discord: {item.discordId}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: item.id })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-sm text-gray-400 mb-3">HWIDs autorizados:</p>
              <div className="flex flex-wrap gap-2">
                {(item.hwids as any[])?.map((h: any) => (
                  <span key={h.id} className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 font-mono break-all">
                    {h.hwid}
                    <Trash2 className="w-3 h-3 cursor-pointer text-red-400 hover:text-red-300 flex-shrink-0" onClick={() => remHwid.mutate({ id: h.id })} />
                  </span>
                ))}
                {!(item.hwids as any[])?.length && (
                  <span className="text-xs text-gray-500">Nenhum HWID autorizado</span>
                )}
              </div>
              <div className="flex gap-2 mt-4 items-start">
                <Input
                  placeholder="Adicionar HWID"
                  className={`${inputClass} h-9 w-96`}
                  value={editing === item.id ? form.newHwid : ""}
                  onChange={e => { setEditing(item.id); setForm({ ...form, newHwid: e.target.value }); }}
                  onKeyDown={e => { if (e.key === "Enter" && form.newHwid) { addHwid.mutate({ otherStoreResellerId: item.id, hwid: form.newHwid }); setForm({ ...form, newHwid: "" }); } }}
                />
                <Button size="sm" onClick={() => { addHwid.mutate({ otherStoreResellerId: item.id, hwid: form.newHwid }); setForm({ ...form, newHwid: "" }); }} className="bg-emerald-600 hover:bg-emerald-500 h-9">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
