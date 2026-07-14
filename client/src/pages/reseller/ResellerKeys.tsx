import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Key, Search, Copy, Check, RefreshCw, XCircle, Eye } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [viewKey, setViewKey] = useState<any>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const resetHwid = trpc.reseller.resetHwid.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "HWID reset successfully!" : "HWID resetado com sucesso!");
      utils.reseller.myKeys.invalidate();
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
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">{t.keys_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.keys_subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: language === "en" ? "Total" : "Total", value: stats.total, color: "text-white" },
            { label: language === "en" ? "Active" : "Ativas", value: stats.active, color: "text-green-400" },
            { label: language === "en" ? "Used" : "Usadas", value: stats.used, color: "text-blue-400" },
            { label: language === "en" ? "Revoked" : "Revogadas", value: stats.revoked, color: "text-orange-400" },
          ].map(s => (
            <div key={s.label} className="text-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-600 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={language === "en" ? "Search key or plan..." : "Buscar key ou plano..."}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-1">
          {["all", "active", "used", "revoked", "expired"].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}
            >
              {filterLabels[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {tableHeaders.map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-600">{t.keys_loading}</td></tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Key className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">{t.keys_no_keys}</p>
                  <p className="text-gray-700 text-sm mt-1">{language === "en" ? "Go to Apps and generate your first keys" : "Vá em Apps e gere suas primeiras keys"}</p>
                </td>
              </tr>
            ) : paginated.map((k: any) => (
              <tr key={k.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-xs font-mono">{k.keyValue}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-300 text-sm">{k.appName || `App #${k.appId}`}</p>
                  <p className="text-gray-600 text-xs">{k.planName}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                <td className="px-4 py-3 text-yellow-400 text-sm font-mono">{parseFloat(k.creditsSpent).toFixed(2)} cr</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(k.createdAt).toLocaleDateString(language === "en" ? "en-US" : "pt-BR")}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {k.expiresAt
                    ? new Date(k.expiresAt).toLocaleDateString(language === "en" ? "en-US" : "pt-BR")
                    : k.durationDays >= 9000
                      ? <span className="text-gray-700">Lifetime</span>
                      : <span className="text-blue-400/70 text-xs">{language === "en" ? "Starts on first use" : "Conta após uso"}</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyKey(k.id, k.keyValue)} title={t.keys_copy} className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all">
                      {copied === k.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setViewKey(k)} title={language === "en" ? "View details" : "Ver detalhes"} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {k.status === "active" && (
                      <button
                        onClick={() => { if (confirm(language === "en" ? "Reset HWID for this key?" : "Resetar HWID desta key?")) resetHwid.mutate({ keyId: k.id }); }}
                        title={t.keys_reset_hwid}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(k.status === "active" || k.status === "used") && (
                      <button
                        onClick={() => { if (confirm(language === "en" ? "Revoke this key? This action cannot be undone." : "Revogar esta key? Esta ação não pode ser desfeita.")) revokeKey.mutate({ keyId: k.id }); }}
                        title={t.keys_revoke}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
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
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${p === page ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 text-sm transition-all">→</button>
          </div>
        </div>
      )}

      {/* Key Detail Modal */}
      <Dialog open={!!viewKey} onOpenChange={() => setViewKey(null)}>
        <DialogContent className="bg-[#0d0d14] border-white/10 text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Key className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-sm font-mono">{viewKey?.keyValue}</DialogTitle>
                <p className="text-gray-500 text-xs">{language === "en" ? "Key Details & Management" : "Detalhes & Gerenciamento"}</p>
              </div>
            </div>
          </DialogHeader>
          {viewKey && (
            <div className="space-y-3 mt-2">
              <div className={`rounded-lg p-3 border ${viewKey.status === "active" ? "bg-green-500/10 border-green-500/20" : viewKey.status === "used" ? "bg-blue-500/10 border-blue-500/20" : "bg-gray-500/10 border-gray-500/20"}`}>
                <p className="text-sm font-medium text-white">Status: <StatusBadge status={viewKey.status} /></p>
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
                  <div key={label} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className="text-white text-sm font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {viewKey.hwid && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-gray-500 text-xs">Hardware ID (HWID)</p>
                  <p className="text-white text-xs font-mono mt-0.5 break-all">{viewKey.hwid}</p>
                </div>
              )}
              {viewKey.note && (
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-gray-500 text-xs">{t.general_note}</p>
                  <p className="text-gray-300 text-sm mt-0.5">{viewKey.note}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => copyKey(viewKey.id, viewKey.keyValue)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-all">
                  <Copy className="w-3.5 h-3.5" /> {t.keys_copy}
                </button>
                {viewKey.status === "active" && (
                  <button onClick={() => resetHwid.mutate({ keyId: viewKey.id })} disabled={resetHwid.isPending} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> {t.keys_reset_hwid}
                  </button>
                )}
                {(viewKey.status === "active" || viewKey.status === "used") && (
                  <button onClick={() => { if (confirm(language === "en" ? "Revoke this key?" : "Revogar esta key?")) revokeKey.mutate({ keyId: viewKey.id }); }} disabled={revokeKey.isPending} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-all">
                    <XCircle className="w-3.5 h-3.5" /> {t.keys_revoke}
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
