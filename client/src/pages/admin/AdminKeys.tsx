import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Key, Copy, Check, CreditCard, Percent, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    used: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    revoked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? map.expired}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  return type === "percentage"
    ? <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1 w-fit"><Percent className="w-3 h-3" /> %</span>
    : <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 w-fit"><CreditCard className="w-3 h-3" /> cr</span>;
}

export default function AdminKeys() {
  const { data: keys = [], isLoading } = trpc.admin.listAllKeys.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = keys.filter((k: any) => {
    const matchSearch =
      k.keyValue?.toLowerCase().includes(search.toLowerCase()) ||
      k.usedBy?.toLowerCase().includes(search.toLowerCase()) ||
      k.resellerName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const copyKey = (id: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    toast.success("Key copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">License Keys</h1>
          <p className="text-gray-500 text-sm mt-1">{keys.length} keys no sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {["all", "active", "used", "revoked", "expired"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar key, usuário ou reseller..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Key", "App", "Plano", "Reseller", "Tipo", "Status", "Usado Por", "Valor", "Saldo Após", "Criado em", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="text-center py-8 text-gray-600">Carregando...</td></tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12">
                  <Key className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma key encontrada</p>
                </td>
              </tr>
            ) : paginated.map((k: any) => (
              <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-xs font-mono">{k.keyValue}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">App #{k.appId}</td>
                <td className="px-4 py-3 text-gray-400 text-sm">{k.planName || "—"}</td>
                <td className="px-4 py-3 text-gray-300 text-sm flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-500" /> {k.resellerName || "—"}
                </td>
                <td className="px-4 py-3"><TypeBadge type={k.resellerType} /></td>
                <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-sm">{k.usedBy || <span className="text-gray-600">—</span>}</td>
                <td className="px-4 py-3 text-yellow-400 text-sm font-mono">{parseFloat(k.creditsSpent).toFixed(2)}</td>
                <td className="px-4 py-3 text-green-400 text-sm font-mono">{k.resellerCredits ? parseFloat(k.resellerCredits).toFixed(2) : "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(k.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => copyKey(k.id, k.keyValue)} className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all">
                    {copied === k.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${p === page ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
