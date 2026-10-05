import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Key, Copy, Check, CreditCard, Percent, User, Infinity as InfinityIcon, Eye, RefreshCw, Ban, Trash2, MonitorSmartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const isEmuPubKey = (k: any) => {
  const n = (k.appName || "").toUpperCase();
  return n === "PUB EMU" || n === "PUBEMU" || n === "EMULATOR PUBLIC";
};

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
  const utils = trpc.useUtils();
  const { data: keys = [], isLoading } = trpc.admin.listAllKeys.useQuery();
  const { data: unlimitedKeys = [], isLoading: isLoadingUnlimited } = trpc.admin.unlimitedKeysLog.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"all" | "unlimited">("all");
  const [infoKey, setInfoKey] = useState<any>(null);
  const perPage = 20;

  const { data: emuInfo } = trpc.admin.emuKeyInfo.useQuery(
    { keyId: infoKey?.id ?? 0 },
    { enabled: !!infoKey, retry: false }
  );
  const invalidateKeys = () => {
    utils.admin.listAllKeys.invalidate();
    utils.admin.unlimitedKeysLog.invalidate();
  };
  const emuResetHwid = trpc.admin.emuResetHwid.useMutation({
    onSuccess: () => { toast.success("HWID resetado"); invalidateKeys(); },
    onError: e => toast.error(e.message),
  });
  const emuBanKey = trpc.admin.emuBanKey.useMutation({
    onSuccess: () => { toast.success("Key banida na API PUB EMU"); invalidateKeys(); },
    onError: e => toast.error(e.message),
  });
  const emuDeleteKey = trpc.admin.emuDeleteKey.useMutation({
    onSuccess: () => { toast.success("Key deletada"); invalidateKeys(); },
    onError: e => toast.error(e.message),
  });

  const filtered = keys.filter((k: any) => {
    const matchSearch =
      k.keyValue?.toLowerCase().includes(search.toLowerCase()) ||
      k.usedBy?.toLowerCase().includes(search.toLowerCase()) ||
      k.appName?.toLowerCase().includes(search.toLowerCase()) ||
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

  const keyActions = (k: any) => (
    <div className="flex items-center gap-1">
      <button onClick={() => copyKey(k.id, k.keyValue)} title="Copiar" className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
        {copied === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <button onClick={() => setInfoKey(k)} title="Ver HWID / IP / uso" className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
        <Eye className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => { if (confirm("Resetar HWID desta key?")) emuResetHwid.mutate({ keyId: k.id }); }}
        disabled={emuResetHwid.isPending}
        title="Reset HWID"
        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-40"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${emuResetHwid.isPending ? "animate-spin" : ""}`} />
      </button>
      {isEmuPubKey(k) && (
        <>
          <button
            onClick={() => {
              const reason = prompt("Motivo do ban (opcional):", "Banned by admin");
              if (reason !== null) emuBanKey.mutate({ keyId: k.id, reason: reason || undefined });
            }}
            disabled={emuBanKey.isPending}
            title="Banir key (API PUB EMU)"
            className="p-1.5 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all disabled:opacity-40"
          >
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { if (confirm("Deletar esta key? Remove no painel PUB EMU e do sistema. Ação irreversível.")) emuDeleteKey.mutate({ keyId: k.id }); }}
            disabled={emuDeleteKey.isPending}
            title="Deletar key (API PUB EMU)"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );

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
                  <td className="px-5 py-4 text-gray-400 text-sm">{k.appName || `App #${k.appId}`}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{k.planName || "—"}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="flex items-center gap-1.5 text-violet-300"><User className="w-3 h-3 text-violet-400/60" /> {k.resellerName || "—"}</div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={k.status} /></td>
                  <td className="px-5 py-4 text-gray-400 text-sm">{k.usedBy || <span className="text-gray-600">—</span>}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{new Date(k.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4">{keyActions(k)}</td>
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
                <td className="px-5 py-4 text-gray-400 text-sm">{k.appName || `App #${k.appId}`}</td>
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
                <td className="px-5 py-4">{keyActions(k)}</td>
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

      {/* Modal de detalhes da key (HWID / IP / uso) */}
      <Dialog open={!!infoKey} onOpenChange={() => setInfoKey(null)}>
        <DialogContent className="bg-[#080808] border-white/[0.08] text-white max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="p-6 space-y-5" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(8,8,8,0.9) 120px)" }}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <MonitorSmartphone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-sm font-mono break-all">{infoKey?.keyValue}</DialogTitle>
                  <p className="text-gray-500 text-xs">{infoKey?.appName || `App #${infoKey?.appId}`} · HWID, IP e uso</p>
                </div>
              </div>
            </DialogHeader>
            {infoKey && (
              <div className="space-y-4">
                <div className="rounded-2xl p-3 border border-white/[0.06] bg-white/[0.03]">
                  <p className="text-sm font-medium text-white flex items-center gap-2">Status: <StatusBadge status={infoKey.status} /></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Usada por", value: emuInfo?.local?.usedBy ?? infoKey.usedBy ?? "—" },
                    { label: "HWID (local)", value: emuInfo?.local?.hwid ?? infoKey.hwid ?? "—" },
                    { label: "Ativada em", value: (emuInfo?.local?.activatedAt ?? infoKey.activatedAt) ? new Date(emuInfo?.local?.activatedAt ?? infoKey.activatedAt).toLocaleString("pt-BR") : "—" },
                    { label: "Expira em", value: (emuInfo?.local?.expiresAt ?? infoKey.expiresAt) ? new Date(emuInfo?.local?.expiresAt ?? infoKey.expiresAt).toLocaleString("pt-BR") : (infoKey.durationDays >= 9000 ? "Lifetime" : "—") },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="text-white text-xs font-medium mt-1 break-all">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {!emuInfo && (
                  <p className="text-gray-600 text-xs">Consultando painel remoto (KeyAuth)...</p>
                )}
                {emuInfo?.remote && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">Licença (Seller API)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">Uso</p>
                        <p className={`text-xs font-semibold mt-0.5 ${emuInfo.remote.used ? "text-blue-400" : "text-gray-300"}`}>
                          {emuInfo.remote.used ? "Usada" : "Ainda não usada"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">Usada por</p>
                        <p className="text-white text-xs font-semibold mt-0.5 break-all">{emuInfo.remote.usedBy || "—"}</p>
                      </div>
                      {emuInfo.remote.expiry ? (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">Expiração real</p>
                          <p className="text-white text-xs font-semibold mt-0.5">{new Date(emuInfo.remote.expiry * 1000).toLocaleString("pt-BR")}</p>
                        </div>
                      ) : null}
                      {emuInfo.remote.banned && (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">Ban</p>
                          <p className="text-red-400 text-xs font-semibold mt-0.5">Banida</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {emuInfo?.user && (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80">Usuário (painel)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">IP</p>
                        <p className="text-white text-xs font-semibold mt-0.5 break-all">{emuInfo.user.ip || "—"}</p>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">HWID</p>
                        <p className="text-white text-xs font-semibold mt-0.5 break-all">{emuInfo.user.hwid || "—"}</p>
                      </div>
                      {emuInfo.user.lastlogin ? (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">Último login</p>
                          <p className="text-white text-xs font-semibold mt-0.5">{new Date(emuInfo.user.lastlogin * 1000).toLocaleString("pt-BR")}</p>
                        </div>
                      ) : null}
                      {emuInfo.user.banned && (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">Ban</p>
                          <p className="text-red-400 text-xs font-semibold mt-0.5">Banido</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => copyKey(infoKey.id, infoKey.keyValue)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm transition-all border border-white/[0.06]">
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                  <button onClick={() => { if (confirm("Resetar HWID desta key?")) emuResetHwid.mutate({ keyId: infoKey.id }); }} disabled={emuResetHwid.isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm transition-all border border-emerald-500/20">
                    <RefreshCw className="w-3.5 h-3.5" /> Reset HWID
                  </button>
                  {isEmuPubKey(infoKey) && (
                    <button onClick={() => {
                      const reason = prompt("Motivo do ban (opcional):", "Banned by admin");
                      if (reason !== null) emuBanKey.mutate({ keyId: infoKey.id, reason: reason || undefined });
                    }} disabled={emuBanKey.isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm transition-all border border-orange-500/20">
                      <Ban className="w-3.5 h-3.5" /> Banir
                    </button>
                  )}
                </div>
                {isEmuPubKey(infoKey) && (
                  <button onClick={() => {
                    if (confirm("Deletar esta key? Remove no painel PUB EMU e do sistema. Ação irreversível.")) {
                      emuDeleteKey.mutate({ keyId: infoKey.id });
                      setInfoKey(null);
                    }
                  }} disabled={emuDeleteKey.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-all border border-red-500/20">
                    <Trash2 className="w-3.5 h-3.5" /> Deletar key
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
