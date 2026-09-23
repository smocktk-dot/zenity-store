import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Key, DollarSign, ShoppingBag, BarChart3, Package, Users, TrendingUp, CalendarClock, Infinity as InfinityIcon
} from "lucide-react";
import { SubscriptionCountdownInline } from "@/components/SubscriptionCountdown";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const chartTooltipStyle = {
  backgroundColor: "rgba(8,8,10,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
};

export default function ResellerDashboard() {
  const { data: dashboard } = trpc.reseller.dashboard.useQuery();
  const { data: profile } = trpc.reseller.profile.useQuery();

  const years = useMemo(() => {
    const y = new Set<string>();
    dashboard?.monthly?.forEach((m: any) => y.add(m.month.slice(0, 4)));
    const list = Array.from(y).sort().reverse();
    return list.length ? list : [new Date().getFullYear().toString()];
  }, [dashboard?.monthly]);

  const [selectedYear, setSelectedYear] = useState(years[0]);

  const monthlyData = useMemo(() => {
    const filtered = (dashboard?.monthly || []).filter((m: any) => m.month.startsWith(selectedYear));
    return months.map((label, idx) => {
      const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
      const found = filtered.find((m: any) => m.month === key);
      return { month: key, label, count: found ? Number(found.count) : 0 };
    });
  }, [dashboard?.monthly, selectedYear]);

  const counts = dashboard?.counts || { totalKeys: 0, totalSpent: "0.00", activeKeys: 0, usedKeys: 0 };
  const isUnlimited = (profile as any)?.resellerType === "unlimited";
  const subscriptionExpiresAt = (profile as any)?.subscriptionExpiresAt;

  const summaryCards = [
    { label: "Total Keys", value: counts.totalKeys, sub: "geradas", icon: Key },
    isUnlimited
      ? { label: "Assinatura", value: "", sub: "", icon: CalendarClock, countdown: true }
      : { label: "Gasto Total", value: `R$ ${Number(counts.totalSpent).toFixed(2)}`, sub: "créditos", icon: DollarSign },
    { label: "Ativas", value: counts.activeKeys, sub: "keys disponíveis", icon: ShoppingBag },
    { label: "Usadas", value: counts.usedKeys, sub: "consumidas", icon: BarChart3 },
  ];

  const topApps = (dashboard?.byApp || []).map((a: any) => ({ region: a.appName, value: a.count }));

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral da sua conta</p>
        </div>
        {isUnlimited ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25">
            <InfinityIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-violet-300 text-xs font-medium">
              <SubscriptionCountdownInline expiresAt={subscriptionExpiresAt} />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">{profile?.discountPercent?.toFixed?.(0) || profile?.discountPercent}% desconto</span>
          </div>
        )}
      </div>

      {/* Year filter */}
      <div className="flex items-center gap-2">
        {years.map((y: string) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedYear === y ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, countdown }: any) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={countdown
              ? { background: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.05) 100%)", border: "1px solid rgba(139,92,246,0.30)" }
              : { background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(16,185,129,0.20)" }}
          >
            <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center mb-3">
              <Icon className={`w-4 h-4 ${countdown ? "text-violet-400" : "text-emerald-400"}`} />
            </div>
            {countdown ? (
              <>
                <p className="text-white text-base font-bold leading-none">
                  <SubscriptionCountdownInline expiresAt={subscriptionExpiresAt} />
                </p>
                <p className="text-white/80 text-xs mt-1.5">{label}</p>
                <p className="text-violet-300/80 text-[10px]">restante até a renovação</p>
              </>
            ) : (
              <>
                <p className="text-white text-xl font-bold leading-none">{value}</p>
                <p className="text-white/80 text-xs mt-1">{label}</p>
                <p className="text-emerald-400/80 text-[10px]">{sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-white font-semibold text-sm">Keys por Mês</h2>
        </div>
        <div className="h-72">
          {monthlyData.every((d) => d.count === 0) ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">Nenhuma key neste ano</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} />
                <YAxis stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#34d399"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount2)"
                  dot={{ r: 3, fill: "#34d399" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Apps */}
        <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Keys por App</h2>
          </div>
          <div className="h-64">
            {topApps.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topApps} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} />
                  <YAxis type="category" dataKey="region" stroke="#9ca3af" fontSize={10} width={80} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {topApps.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#34d399" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sub resellers */}
        <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Sub-Resellers</h2>
          </div>
          <div className="h-64 overflow-y-auto">
            {(dashboard?.subResellers || []).length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">Nenhum sub-reseller</div>
            ) : (
              <div className="space-y-2">
                {(dashboard?.subResellers || []).map((r: any, idx: number) => (
                  <div key={r.resellerId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs w-5">#{idx + 1}</span>
                      <span className="text-gray-300 text-sm">{r.username}</span>
                    </div>
                    <span className="text-emerald-400 text-xs font-semibold">{r.count} keys</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
