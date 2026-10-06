import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Key, Search, Copy, Check, RefreshCw, XCircle, Eye, MonitorSmartphone, ShieldCheck, Ban, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    used: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    revoked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[status] ?? map.expired}`}>{status}</span>;
}

export default function ResellerKeys() {
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();
  const utils = trpc.useUtils();
  const { data: keys = [], isLoading } = trpc.reseller.myKeys.useQuery();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const canBanDelete = profile?.resellerType === "percentage" && (profile as any)?.canBanDeleteKeys === true;
  const [viewKeyId, setViewKeyId] = useState<number | null>(null);
  const { data: keyInfo } = trpc.reseller.keyInfo.useQuery(
    { keyId: viewKeyId ?? 0 },
    { enabled: viewKeyId !== null, retry: false }
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [viewKey, setViewKey] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetKeyValue, setResetKeyValue] = useState("");
  const perPage = 15;

  const resetHwidByKey = trpc.reseller.resetHwidByKey.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "HWID reset successfully!" : "HWID resetado com sucesso!");
      setResetModalOpen(false);
      setResetKeyValue("");
      utils.reseller.myKeys.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const resetHwid = trpc.reseller.resetHwid.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "HWID reset successfully!" : "HWID resetado com sucesso!");
      utils.reseller.myKeys.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const banKey = trpc.reseller.banKey.useMutation({
    onSuccess: (d) => {
      if (d?.remote === "failed") {
        toast.warning((language === "en" ? "Key banned locally — remote API failed: " : "Key banida localmente — falha na API remota: ") + (d.remoteError || ""));
      } else {
        toast.success(language === "en" ? "Key banned!" : "Key banida!");
      }
      utils.reseller.myKeys.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const deleteKey = trpc.reseller.deleteKey.useMutation({
    onSuccess: (d) => {
      if (d?.remote === "failed") {
        toast.warning((language === "en" ? "Key deleted locally — remote API failed: " : "Key deletada localmente — falha na API remota: ") + (d.remoteError || ""));
      } else {
        toast.success(language === "en" ? "Key deleted!" : "Key deletada!");
      }
      utils.reseller.myKeys.invalidate();
      setViewKey(null);
      setViewKeyId(null);
    },
    onError: e => toast.error(e.message),
  });

  const revokeKey = trpc.reseller.revokeKey.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Key revoked!" : "Key revogada!");
      utils.reseller.myKeys.invalidate();
      setViewKey(null);
    },
    onError: e => toast.error(e.message),
  });

  const filtered = keys.filter((k: any) => {
    const matchSearch = k.keyValue?.toLowerCase().includes(search.toLowerCase()) || k.planName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const copyKey = (id: number, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    toast.success(language === "en" ? "Key copied!" : "Key copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const stats = {
    total: keys.length,
    active: keys.filter((k: any) => k.status === "active").length,
    used: keys.filter((k: any) => k.status === "used").length,
    revoked: keys.filter((k: any) => k.status === "revoked").length,
  };

  const filterLabels: Record<string, string> = {
    all: t.keys_filter_all,
    active: language === "en" ? "Active" : "Ativas",
    used: language === "en" ? "Used" : "Usadas",
    revoked: language === "en" ? "Revoked" : "Revogadas",
    expired: language === "en" ? "Expired" : "Expiradas",
  };

  const tableHeaders = language === "en"
    ? ["Key", "App / Plan", "Status", "Credits", "Created", "Expires", "Actions"]
    : ["Key", "App / Plano", "Status", "Créditos", "Criado em", "Expira em", "Ações"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t.keys_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.keys_subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: language === "en" ? "Total" : "Total", value: stats.total, color: "text-white", bg: "bg-white/[0.05]" },
            { label: language === "en" ? "Active" : "Ativas", value: stats.active, color: "text-emerald-400", bg: "bg-emerald-500/15" },
            { label: language === "en" ? "Used" : "Usadas", value: stats.used, color: "text-blue-400", bg: "bg-blue-500/15" },
            { label: language === "en" ? "Revoked" : "Revogadas", value: stats.revoked, color: "text-orange-400", bg: "bg-orange-500/15" },
          ].map(s => (
            <div key={s.label} className={`text-center px-3 py-2 rounded-2xl border border-white/[0.06] ${s.bg}`}>
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reset HWID Action Card */}
      <div className="rounded-2xl border border-white/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MonitorSmartphone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Reset HWID</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {language === "en"
                ? "Reset the hardware ID of a client's key"
                : "Resete o HWID da key de um cliente"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setResetModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-semibold border border-emerald-500/25 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Reset HWID
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={language === "en" ? "Search key or plan..." : "Buscar key ou plano..."}
            className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600 focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "used", "revoked", "expired"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"}`}
            >
              {filterLabels[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]" style={{ background: "rgba(255,255,255,0.01)" }}>
              {tableHeaders.map(h => (
                <th key={h} className="text-left px-5 py-4 text-gray-500 text-[10px] font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600 text-sm">{t.keys_loading}</td></tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium">{t.keys_no_keys}</p>
                  <p className="text-gray-600 text-sm mt-1">{language === "en" ? "Go to Apps and generate your first keys" : "Vá em Apps e gere suas primeiras keys"}</p>
                </td>
              </tr>
            ) : paginated.map((k: any) => (
              <tr key={k.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <span className="text-gray-300 text-xs font-mono bg-white/[0.03] px-2 py-1 rounded-lg border border-white/[0.04]">{k.keyValue}</span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-white text-sm font-medium">{k.appName || `App #${k.appId}`}</p>
                  <p className="text-gray-500 text-xs">{k.planName}</p>
                </td>
                <td className="px-5 py-4"><StatusBadge status={k.status} /></td>
                <td className="px-5 py-4 text-emerald-400/80 text-sm font-mono">{parseFloat(k.creditsSpent).toFixed(2)} cr</td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {new Date(k.createdAt).toLocaleDateString(language === "en" ? "en-US" : "pt-BR")}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {k.expiresAt
                    ? new Date(k.expiresAt).toLocaleDateString(language === "en" ? "en-US" : "pt-BR")
                    : k.durationDays >= 9000
                      ? <span className="text-gray-600">Lifetime</span>
                      : <span className="text-blue-400/70 text-xs">{language === "en" ? "Starts on first use" : "Conta após uso"}</span>
                  }
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyKey(k.id, k.keyValue)} title={t.keys_copy} className="p-2 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                      {copied === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => { setViewKey(k); setViewKeyId(k.id); }} title={language === "en" ? "View details" : "Ver detalhes"} className="p-2 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {k.status === "active" && (
                      <button
                        onClick={() => { if (confirm(language === "en" ? "Reset HWID for this key?" : "Resetar HWID desta key?")) resetHwid.mutate({ keyId: k.id }); }}
                        title={t.keys_reset_hwid}
                        className="p-2 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(k.status === "active" || k.status === "used") && (
                      <button
                        onClick={() => { if (confirm(language === "en" ? "Revoke this key? This action cannot be undone." : "Revogar esta key? Esta ação não pode ser desfeita.")) revokeKey.mutate({ keyId: k.id }); }}
                        title={t.keys_revoke}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canBanDelete && (
                      <>
                        <button
                          onClick={() => {
                            const reason = prompt(language === "en" ? "Ban reason (optional):" : "Motivo do ban (opcional):", "Banned by reseller");
                            if (reason !== null) banKey.mutate({ keyId: k.id, reason: reason || undefined });
                          }}
                          disabled={banKey.isPending}
                          title={language === "en" ? "Ban key" : "Banir key"}
                          className="p-2 rounded-xl text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all disabled:opacity-40"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(language === "en" ? "Delete this key? This action cannot be undone." : "Deletar esta key? Esta ação não pode ser desfeita.")) deleteKey.mutate({ keyId: k.id }); }}
                          disabled={deleteKey.isPending}
                          title={language === "en" ? "Delete key" : "Deletar key"}
                          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            {language === "en"
              ? `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} of ${filtered.length}`
              : `Mostrando ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} de ${filtered.length}`
            }
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-40 text-sm transition-all">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm transition-all ${p === page ? "bg-emerald-600 text-white" : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]"}`}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-40 text-sm transition-all">→</button>
          </div>
        </div>
      )}

      {/* Key Detail Modal */}
      <Dialog open={!!viewKey} onOpenChange={() => { setViewKey(null); setViewKeyId(null); }}>
        <DialogContent className="bg-[#080808] border-white/[0.08] text-white max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="p-6 space-y-5" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(8,8,8,0.9) 120px)" }}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-sm font-mono break-all">{viewKey?.keyValue}</DialogTitle>
                  <p className="text-gray-500 text-xs">{language === "en" ? "Key Details & Management" : "Detalhes & Gerenciamento"}</p>
                </div>
              </div>
            </DialogHeader>
            {viewKey && (
              <div className="space-y-4 mt-2">
                <div className={`rounded-2xl p-3 border ${viewKey.status === "active" ? "bg-emerald-500/10 border-emerald-500/20" : viewKey.status === "used" ? "bg-blue-500/10 border-blue-500/20" : "bg-gray-500/10 border-gray-500/20"}`}>
                  <p className="text-sm font-medium text-white flex items-center gap-2">Status: <StatusBadge status={viewKey.status} /></p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: language === "en" ? "App" : "App", value: viewKey.appName || `App #${viewKey.appId}` },
                    { label: language === "en" ? "Plan" : "Plano", value: viewKey.planName },
                    { label: language === "en" ? "Credits Spent" : "Créditos Gastos", value: `${parseFloat(viewKey.creditsSpent).toFixed(2)} cr` },
                    { label: language === "en" ? "Duration" : "Duração", value: viewKey.durationDays >= 9000 ? "Lifetime" : `${viewKey.durationDays} ${language === "en" ? "days" : "dias"}` },
                    { label: language === "en" ? "Created at" : "Criado em", value: new Date(viewKey.createdAt).toLocaleString(language === "en" ? "en-US" : "pt-BR") },
                    { label: language === "en" ? "Expires at" : "Expira em", value: viewKey.expiresAt ? new Date(viewKey.expiresAt).toLocaleString(language === "en" ? "en-US" : "pt-BR") : viewKey.durationDays >= 9000 ? "Lifetime" : (language === "en" ? "Starts on first use" : "Conta a partir do primeiro uso") },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="text-white text-sm font-medium mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                {/* Status em tempo real na KeyAuth (apps com Seller API) */}
                {keyInfo?.remote && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5 space-y-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" /> {language === "en" ? "Live status (Seller API)" : "Status em tempo real (Seller API)"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">{language === "en" ? "Activation" : "Ativação"}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${keyInfo.remote.used ? "text-blue-400" : "text-gray-300"}`}>
                          {keyInfo.remote.used
                            ? (language === "en" ? "Used" : "Usada")
                            : (language === "en" ? "Not used yet" : "Ainda não usada")}
                        </p>
                      </div>
                      <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                        <p className="text-gray-500 text-[10px]">{language === "en" ? "Activated by" : "Usada por"}</p>
                        <p className="text-white text-xs font-semibold mt-0.5 break-all">{keyInfo.remote.usedBy || "—"}</p>
                      </div>
                      {keyInfo.remote.expiry ? (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">{language === "en" ? "Real expiry" : "Expiração real"}</p>
                          <p className="text-white text-xs font-semibold mt-0.5">
                            {new Date(keyInfo.remote.expiry * 1000).toLocaleString(language === "en" ? "en-US" : "pt-BR")}
                          </p>
                        </div>
                      ) : null}
                      {keyInfo.remote.status && (
                        <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2.5">
                          <p className="text-gray-500 text-[10px]">Status KeyAuth</p>
                          <p className="text-white text-xs font-semibold mt-0.5">{keyInfo.remote.status}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {viewKey.hwid && (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-gray-500 text-xs">Hardware ID (HWID)</p>
                    <p className="text-white text-xs font-mono mt-1 break-all">{viewKey.hwid}</p>
                  </div>
                )}
                {viewKey.note && !/^(pix|ltc|other-store):/.test(viewKey.note) && (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-gray-500 text-xs">{t.general_note}</p>
                    <p className="text-gray-300 text-sm mt-1">{viewKey.note}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => copyKey(viewKey.id, viewKey.keyValue)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm transition-all border border-white/[0.06]">
                    <Copy className="w-3.5 h-3.5" /> {t.keys_copy}
                  </button>
                  {viewKey.status === "active" && (
                    <button onClick={() => resetHwid.mutate({ keyId: viewKey.id })} disabled={resetHwid.isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm transition-all border border-emerald-500/20">
                      <RefreshCw className="w-3.5 h-3.5" /> {t.keys_reset_hwid}
                    </button>
                  )}
                  {(viewKey.status === "active" || viewKey.status === "used") && (
                    <button onClick={() => { if (confirm(language === "en" ? "Revoke this key?" : "Revogar esta key?")) revokeKey.mutate({ keyId: viewKey.id }); }} disabled={revokeKey.isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-all border border-red-500/20">
                      <XCircle className="w-3.5 h-3.5" /> {t.keys_revoke}
                    </button>
                  )}
                </div>
                {canBanDelete && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const reason = prompt(language === "en" ? "Ban reason (optional):" : "Motivo do ban (opcional):", "Banned by reseller");
                        if (reason !== null) banKey.mutate({ keyId: viewKey.id, reason: reason || undefined });
                      }}
                      disabled={banKey.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm transition-all border border-orange-500/20"
                    >
                      <Ban className="w-3.5 h-3.5" /> {language === "en" ? "Ban" : "Banir"}
                    </button>
                    <button
                      onClick={() => { if (confirm(language === "en" ? "Delete this key? This action cannot be undone." : "Deletar esta key? Esta ação não pode ser desfeita.")) deleteKey.mutate({ keyId: viewKey.id }); }}
                      disabled={deleteKey.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-all border border-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {language === "en" ? "Delete" : "Deletar"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset HWID Modal */}
      <Dialog open={resetModalOpen} onOpenChange={(open) => { setResetModalOpen(open); if (!open) setResetKeyValue(""); }}>
        <DialogContent className="bg-[#080808] border-white/[0.08] text-white max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="p-6 space-y-5" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(8,8,8,0.9) 120px)" }}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <MonitorSmartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-base font-semibold">Reset HWID</DialogTitle>
                  <p className="text-gray-500 text-xs">
                    {language === "en" ? "Reset the hardware ID linked to a key" : "Resete o hardware vinculado a uma key"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                  {language === "en" ? "Client Key" : "Key do Cliente"}
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={resetKeyValue}
                    onChange={e => setResetKeyValue(e.target.value)}
                    placeholder={language === "en" ? "Paste or type the key..." : "Cole ou digite a key..."}
                    className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white font-mono text-sm placeholder:text-gray-600 focus:border-emerald-500/50"
                    onKeyDown={e => {
                      if (e.key === "Enter" && resetKeyValue.trim() && !resetHwidByKey.isPending) {
                        resetHwidByKey.mutate({ keyValue: resetKeyValue.trim() });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {language === "en"
                    ? "Paste any client key — it works even for keys that don't appear in your panel (gateway sales, sub-resellers, etc). The reset clears the linked HWID locally and on the provider."
                    : "Cole qualquer key de cliente — funciona mesmo para keys que não aparecem no seu painel (vendas via gateway, sub-resellers, etc). O reset limpa o HWID vinculado localmente e no provedor."}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setResetModalOpen(false); setResetKeyValue(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 text-sm transition-all border border-white/[0.06]"
                >
                  {language === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  onClick={() => resetHwidByKey.mutate({ keyValue: resetKeyValue.trim() })}
                  disabled={!resetKeyValue.trim() || resetHwidByKey.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-semibold transition-all border border-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resetHwidByKey.isPending ? "animate-spin" : ""}`} />
                  {resetHwidByKey.isPending
                    ? (language === "en" ? "Resetting..." : "Resetando...")
                    : "Reset HWID"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
