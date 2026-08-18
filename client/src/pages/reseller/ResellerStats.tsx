import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Key, TrendingUp, User } from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ResellerStats() {
  const { data, isLoading } = trpc.reseller.subResellerStats.useQuery();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm animate-pulse">Carregando...</div>
      </div>
    );
  }

  const stats = data?.stats || [];
  const logs = data?.logs || [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Estatísticas</h1>
          <p className="text-gray-500 text-sm">Acompanhe as compras dos seus resellers.</p>
        </div>
      </div>

      {stats.length === 0 && (
        <div className="rounded-3xl border border-white/[0.06] p-8 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-gray-400">Nenhuma compra registrada ainda.</p>
        </div>
      )}

      {stats.length > 0 && (
        <div className="rounded-3xl border p-6" style={{ background: "rgba(8,8,10,0.6)", borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Resellers que mais compram</h2>
          <div className="space-y-3">
            {stats.map((r: any, idx: number) => (
              <div key={r.resellerId} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xs font-bold">#{idx + 1}</div>
                  <div>
                    <p className="text-white font-medium">{r.username}</p>
                    <p className="text-gray-500 text-xs">{Number(r.count || 0)} keys compradas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-mono text-sm">{Number(r.total || 0).toFixed(2)} cr</p>
                  <p className="text-gray-500 text-xs">gasto total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="rounded-3xl border p-6" style={{ background: "rgba(8,8,10,0.6)", borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-emerald-400" /> Log de compras</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                  <th className="pb-3 pl-2">Reseller</th>
                  <th className="pb-3">App/Plano</th>
                  <th className="pb-3">Key</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log: any) => (
                  <tr key={log.id} className="text-gray-300">
                    <td className="py-3 pl-2 flex items-center gap-2"><User className="w-3 h-3 text-gray-500" /> {log.resellerName}</td>
                    <td className="py-3 text-gray-400">App #{log.appId} · Plano #{log.planId}</td>
                    <td className="py-3 font-mono text-xs text-emerald-400 truncate max-w-[200px]">{log.keyValue}</td>
                    <td className="py-3">{parseFloat(log.creditsSpent).toFixed(2)} cr</td>
                    <td className="py-3 text-gray-500 text-xs">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
