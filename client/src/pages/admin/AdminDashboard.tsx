import { trpc } from "@/lib/trpc";
import { Users, AppWindow, Key, Tag, TrendingUp, Activity, Crown, CreditCard, Percent } from "lucide-react";

export default function AdminDashboard() {
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const { data: apps = [] } = trpc.admin.listApps.useQuery();
  const { data: keys = [] } = trpc.admin.listAllKeys.useQuery();
  const { data: categories = [] } = trpc.admin.listCategories.useQuery();
  const { data: resellerStats } = trpc.admin.resellerStats.useQuery();

  const activeResellers = resellers.filter((r: any) => r.status === "active").length;
  const activeKeys = keys.filter((k: any) => k.status === "active").length;
  const usedKeys = keys.filter((k: any) => k.status === "used").length;

  const stats = [
    { label: "Total Resellers", value: resellers.length, sub: `${activeResellers} ativos`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Apps Cadastrados", value: apps.length, sub: `${apps.filter((a: any) => a.status === "active").length} ativos`, icon: AppWindow, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Keys Geradas", value: keys.length, sub: `${activeKeys} ativas / ${usedKeys} usadas`, icon: Key, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Categorias", value: categories.length, sub: "categorias de apps", icon: Tag, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  ];

  const recentKeys = keys.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral do sistema CV STORE</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium">Sistema Online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-5 ${bg}`} style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-white text-sm font-medium mt-0.5">{label}</p>
            <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Keys + Resellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Keys */}
        <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Keys Recentes</h2>
          </div>
          <div className="space-y-2">
            {recentKeys.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Nenhuma key gerada ainda</p>
            ) : recentKeys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-gray-300 text-xs font-mono truncate max-w-[180px]">{k.keyValue}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  k.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                  k.status === "used" ? "bg-blue-500/20 text-blue-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resellers */}
        <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm">Resellers Recentes</h2>
          </div>
          <div className="space-y-2">
            {resellers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Nenhum reseller cadastrado</p>
            ) : resellers.slice(0, 8).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 flex items-center justify-center text-red-400 text-xs font-bold uppercase">
                    {r.username[0]}
                  </div>
                  <span className="text-gray-300 text-sm">{r.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-mono">{parseFloat(r.credits).toFixed(2)} cr</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Resellers by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { type: "credits", label: "Top Créditos", icon: CreditCard, color: "text-yellow-400", data: resellerStats?.credits || [] },
          { type: "percentage", label: "Top Porcentagem", icon: Percent, color: "text-purple-400", data: resellerStats?.percentage || [] },
          { type: "other", label: "Top Other Store", icon: Crown, color: "text-emerald-400", data: resellerStats?.other || [] },
        ].map(({ label, icon: Icon, color, data }) => (
          <div key={label} className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-4 h-4 ${color}`} />
              <h2 className="text-white font-semibold text-sm">{label}</h2>
            </div>
            <div className="space-y-2">
              {data.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">Nenhuma compra</p>
              ) : data.map((r: any, idx: number) => (
                <div key={r.resellerId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-5">#{idx + 1}</span>
                    <span className="text-gray-300 text-sm">{r.username}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${color}`}>{r.count} keys</p>
                    <p className="text-gray-600 text-xs">{Number(r.total || 0).toFixed(2)} cr</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
