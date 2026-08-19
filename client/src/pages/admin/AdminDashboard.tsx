import { trpc } from "@/lib/trpc";
import {
  Users, AppWindow, Key, Tag, TrendingUp, Activity,
  CreditCard, Percent, Crown, BarChart3, ShoppingBag, DollarSign
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

function formatCurrency(val: string | number) {
  const n = Number(val || 0);
  return `R$ ${n.toFixed(2)}`;
}

const chartTooltipStyle = {
  backgroundColor: "rgba(8,8,10,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
};

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.dashboardStats.useQuery();
  const { data: resellerStats } = trpc.admin.resellerStats.useQuery();
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const { data: apps = [] } = trpc.admin.listApps.useQuery();
  const { data: keys = [] } = trpc.admin.listAllKeys.useQuery();

  const counts = stats?.counts ?? { resellers: resellers.length, activeResellers: 0, apps: apps.length, keys: keys.length, activeKeys: 0, usedKeys: 0, totalCredits: "0.00" };
  const months = stats?.months ?? [];
  const topApps = stats?.topApps ?? [];

  const summaryCards = [
    { label: "Total Resellers", value: counts.resellers, sub: `${counts.activeResellers} ativos`, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Apps Cadastrados", value: counts.apps, sub: "ativos", icon: AppWindow, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Keys Geradas", value: counts.keys, sub: `${counts.activeKeys} ativas`, icon: Key, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Keys Usadas", value: counts.usedKeys, sub: "consumidas", icon: ShoppingBag, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Faturamento Total", value: formatCurrency(counts.totalCredits), sub: "créditos movimentados", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  const topResellers = [
    { type: "credits", label: "Créditos", icon: CreditCard, color: "#fbbf24", data: resellerStats?.credits || [] },
    { type: "percentage", label: "Porcentagem", icon: Percent, color: "#a78bfa", data: resellerStats?.percentage || [] },
    { type: "other", label: "Other Store", icon: Crown, color: "#34d399", data: resellerStats?.other || [] },
  ];

  const recentKeys = keys.slice(0, 6);

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-2xl border p-5 ${bg} ${border}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-black/20`}>
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly keys chart */}
        <div className="lg:col-span-2 rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Keys por Mês</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: "#34d399" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top apps */}
        <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-white font-semibold text-sm">Top Apps</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topApps} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis type="category" dataKey="appName" stroke="#9ca3af" fontSize={10} width={80} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topApps.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#34d399" : "#10b981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top resellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {topResellers.map(({ label, icon: Icon, color, data }) => (
          <div key={label} className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4" style={{ color }} />
              <h2 className="text-white font-semibold text-sm">Top {label}</h2>
            </div>
            <div className="space-y-3">
              {data.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">Nenhuma compra</p>
              ) : data.map((r: any, idx: number) => (
                <div key={r.resellerId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-5">#{idx + 1}</span>
                    <span className="text-gray-300 text-sm font-medium">{r.username}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-semibold" style={{ color }}>{r.count} keys</p>
                    <p className="text-gray-600 text-xs">{Number(r.total || 0).toFixed(2)} cr</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                <span className="text-gray-300 text-xs font-mono truncate max-w-[220px]">{k.keyValue}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  k.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                  k.status === "used" ? "bg-blue-500/20 text-blue-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm">Resellers Recentes</h2>
          </div>
          <div className="space-y-2">
            {resellers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Nenhum reseller cadastrado</p>
            ) : resellers.slice(0, 6).map((r: any) => (
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
    </div>
  );
}
