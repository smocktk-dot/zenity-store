import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldAlert, Ban, Trash2, RefreshCw, Globe, User, AlertTriangle } from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  xss: { label: "XSS", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  sqli: { label: "SQL Injection", color: "#fb923c", bg: "rgba(249,115,22,0.12)" },
  idor: { label: "IDOR", color: "#facc15", bg: "rgba(234,179,8,0.12)" },
  bruteforce: { label: "Brute Force", color: "#c084fc", bg: "rgba(168,85,247,0.12)" },
  path_traversal: { label: "Path Traversal", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
};

function typeBadge(t: string) {
  const meta = TYPE_LABELS[t] || { label: t, color: "#a1a1aa", bg: "rgba(255,255,255,0.06)" };
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33` }}
    >
      {meta.label}
    </span>
  );
}

export default function AdminProtect() {
  const utils = trpc.useUtils();
  const { data: events = [], isLoading, refetch, isFetching } = trpc.admin.securityEvents.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: banned = [] } = trpc.admin.bannedIps.useQuery();

  const banIp = trpc.admin.banIp.useMutation({
    onSuccess: () => {
      toast.success("IP banido do site!");
      utils.admin.securityEvents.invalidate();
      utils.admin.bannedIps.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unbanIp = trpc.admin.unbanIp.useMutation({
    onSuccess: () => { toast.success("IP desbanido"); utils.admin.bannedIps.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const bannedSet = new Set(banned.map((b: any) => b.ip));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <ShieldAlert className="w-5 h-5" style={{ color: "#f87171" }} />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Protect Website</h1>
            <p className="text-gray-500 text-sm">Tentativas de invasão, injeção e bypass detectadas no site</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Banned IPs */}
      <div
        className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Ban className="w-4 h-4 text-red-400" />
          <h2 className="text-white font-semibold text-sm">IPs Banidos ({banned.length})</h2>
        </div>
        {banned.length === 0 ? (
          <p className="text-gray-600 text-xs">Nenhum IP banido.</p>
        ) : (
          <div className="space-y-2">
            {banned.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg px-4 py-2.5"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-red-300 font-mono text-sm">{b.ip}</span>
                  <span className="text-gray-500 text-xs">{b.reason || "—"}</span>
                  <span className="text-gray-600 text-[10px]">{new Date(b.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <button
                  onClick={() => unbanIp.mutate({ ip: b.ip })}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-semibold text-gray-300 hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Trash2 className="w-3 h-3" /> Desbanir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events log */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h2 className="text-white font-semibold text-sm">Tentativas Detectadas</h2>
          <span className="text-gray-600 text-xs ml-auto">atualiza a cada 15s</span>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm text-center py-10">Carregando...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">Nenhuma tentativa registrada.</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {events.map((ev: any) => {
              const isBanned = ev.ip && bannedSet.has(ev.ip);
              return (
                <div key={ev.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div className="pt-0.5">{typeBadge(ev.eventType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {ev.ip && (
                        <span className="flex items-center gap-1 text-gray-300 font-mono text-xs">
                          <Globe className="w-3 h-3 text-gray-500" /> {ev.ip}
                        </span>
                      )}
                      {ev.identifier && (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <User className="w-3 h-3 text-gray-600" /> {ev.identifier}
                        </span>
                      )}
                      <span className="text-gray-600 text-[10px]">
                        {new Date(ev.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {ev.detail && (
                      <p className="text-gray-500 text-xs mt-1.5 font-mono break-all leading-relaxed line-clamp-3">
                        {ev.detail}
                      </p>
                    )}
                  </div>
                  {ev.ip && (
                    isBanned ? (
                      <span className="text-[10px] font-bold uppercase text-red-400/70 px-2 py-1">BANIDO</span>
                    ) : (
                      <button
                        onClick={() => banIp.mutate({ ip: ev.ip, reason: ev.detail?.slice(0, 200) || ev.eventType })}
                        disabled={banIp.isPending}
                        className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md text-[11px] font-bold uppercase tracking-wide text-white transition-all hover:brightness-125 disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.85)", border: "1px solid rgba(239,68,68,0.4)" }}
                      >
                        <Ban className="w-3 h-3" /> Banimento
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
