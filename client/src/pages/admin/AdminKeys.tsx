import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Key, Copy, Check, CreditCard, Percent, User, Infinity as InfinityIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    used: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    revoked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? map.expired}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  if (type === "unlimited")
    return <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-violet-500/20 text-violet-300 border-violet-500/30 flex items-center gap-1 w-fit"><InfinityIcon className="w-3 h-3" /> ∞</span>;
  return type === "percentage"
    ? <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1 w-fit"><Percent className="w-3 h-3" /> %</span>
    : <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 w-fit"><CreditCard className="w-3 h-3" /> cr</span>;
}

export default function AdminKeys() {
  const { data: keys = [], isLoading } = trpc.admin.listAllKeys.useQuery();
  const { data: unlimitedKeys = [], isLoading: isLoadingUnlimited } = trpc.admin.unlimitedKeysLog.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"all" | "unlimited">("all");
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">License Keys</h1>
          <p className="text-gray-500 text-sm mt-1">{view === "all" ? `${keys.length} keys no sistema` : `${unlimitedKeys.length} keys geradas por resellers Unlimited`}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => { setView("all"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "all" ? "bg-emerald-600 text-white" : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10"}`}
          >
            Todas
          </button>
          <button
            onClick={() => { setView("unlimited"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${view === "unlimited" ? "bg-violet-600 text-white" : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10"}`}
          >
            <InfinityIcon className="w-3 h-3" /> Unlimited
          </button>
          {view === "all" && ["all", "active", "used", "revoked", "expired"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-emerald-600 text-white" : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10"}`}>
              {s === "all" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar key, usuário ou reseller..." className="pl-9 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600" />
      </div>

      {view === "unlimited" ? (
        <div className="rounded-3xl border border-violet-500/[0.15] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Key", "App", "Plano", "Reseller", "Status", "Usado Por", "Criado em", "Ações"].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-gray-400 text-xs font-semibold uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingUnlimited ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-600">Carregando...</td></tr>
              ) : (unlimitedKeys as any[]).filter((k: any) =>
                  k.keyValue?.toLowerCase().includes(search.toLowerCase()) ||
                  k.usedBy?.toLowerCase().includes(search.toLowerCase()) ||
                  k.resellerName?.toLowerCase().includes(search.toLowerCase())
                ).slice((page - 1) * perPage, page * perPage).map((k: any) => (
                <tr key={k.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4"><span className="text-gray-300 text-xs font-mono">{k.keyValue}</span></td>
                  <td className="px-5 py-4 text-gray-400 text-sm">App #{k.appId}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{k.planName || "—"}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-1.5 text-violet-300"><User className="w-3 h-3 text-violet-400/60" /> {k.resellerName || "—"}</div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={k.status} /></td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{k.usedBy || <span className="text-gray-600">—</span>}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{new Date(k.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => copyKey(k.id, k.keyValue)} className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
                      {copied === k.id ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoadingUnlimited && unlimitedKeys.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12">
                  <InfinityIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma key gerada por resellers Unlimited ainda</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="rounded-3xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Key", "App", "Plano", "Reseller", "Tipo", "Status", "Usado Por", "Valor", "Saldo Após", "Origem", "Criado em", "Ações"].map(h => (
                <th key={h} className="text-left px-5 py-4 text-gray-400 text-xs font-semibold uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={12} className="text-center py-8 text-gray-600">Carregando...</td></tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12">
                  <Key className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma key encontrada</p>
                </td>
              </tr>
            ) : paginated.map((k: any) => (
              <tr key={k.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <span className="text-gray-300 text-xs font-mono">{k.keyValue}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-sm">App #{k.appId}</td>
                <td className="px-5 py-4 text-gray-400 text-sm">{k.planName || "—"}</td>
                <td className="px-5 py-4 text-gray-300 text-sm flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-gray-500" /> {k.resellerName || "—"}</div>
                  {k.parentResellerName && <div className="text-[10px] text-emerald-500/70 pl-4">Owner: {k.parentResellerName}</div>}
                </td>
                <td className="px-5 py-4"><TypeBadge type={k.resellerType} /></td>
                <td className="px-5 py-4"><StatusBadge status={k.status} /></td>
                <td className="px-5 py-4 text-gray-400 text-sm">{k.usedBy || <span className="text-gray-600">—</span>}</td>
                <td className="px-5 py-4 text-sm font-mono">
                  {(() => {
                    if (k.source === "manual") {
                      return <span className="text-[10px] px-2 py-1 rounded-full border font-semibold uppercase bg-amber-500/10 text-amber-400 border-amber-500/25">Entrega manual</span>;
                    }
                    if (k.source === "unlimited") {
                      return <span className="text-[10px] px-2 py-1 rounded-full border font-semibold uppercase bg-violet-500/10 text-violet-400 border-violet-500/25">Grátis</span>;
                    }
                    const spent = parseFloat(k.creditsSpent) || 0;
                    const discount = parseFloat(k.resellerDiscount) || 0;
                    if (k.resellerType === "credits") {
                      const val = spent > 0 ? spent : parseFloat(k.planCredits) || 0;
                      return <span className="text-yellow-400">{val.toFixed(2)} cr</span>;
                    }
                    const base = k.resellerType === "other"
                      ? parseFloat(k.planPrice) || 0
                      : parseFloat(k.planPercentage) || 0;
                    const val = spent > 0 ? spent : base * (1 - discount / 100);
                    return (
                      <span className={k.resellerType === "other" ? "text-violet-400" : "text-blue-400"}>
                        R$ {val.toFixed(2)}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-5 py-4 text-sm font-mono">
                  {k.resellerType === "credits" ? (
                    <span className="text-emerald-400">{k.resellerCredits ? parseFloat(k.resellerCredits).toFixed(2) + " cr" : "—"}</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {(() => {
                    const sourceConfig: Record<string, { label: string; className: string }> = {
                      api: { label: "API", className: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
                      "other-store": { label: "Other Store", className: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
                      manual: { label: "Manual", className: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
                      unlimited: { label: "Unlimited", className: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
                    };
                    const cfg = sourceConfig[k.source || ""] || { label: "Painel", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" };
                    return (
                      <span className={`text-[10px] px-2 py-1 rounded-full border font-medium uppercase ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{new Date(k.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-5 py-4">
                  <button onClick={() => copyKey(k.id, k.keyValue)} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                    {copied === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {(() => {
        const list = view === "unlimited"
          ? (unlimitedKeys as any[]).filter((k: any) =>
              k.keyValue?.toLowerCase().includes(search.toLowerCase()) ||
              k.usedBy?.toLowerCase().includes(search.toLowerCase()) ||
              k.resellerName?.toLowerCase().includes(search.toLowerCase()))
          : filtered;
        const tp = Math.ceil(list.length / perPage);
        if (tp <= 1) return null;
        return (
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, list.length)} de {list.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">←</button>
              {Array.from({ length: Math.min(5, tp) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, tp - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${p === page ? "bg-emerald-600 text-white" : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10"}`}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page === tp} className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">→</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
