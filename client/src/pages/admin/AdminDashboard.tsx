import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users, AppWindow, Key, TrendingUp, ShoppingBag, DollarSign,
  BarChart3, MapPin, User, Filter, Package
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

function formatCurrency(val: string | number) {
  const n = Number(val || 0);
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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

  const counts = stats?.counts ?? { resellers: resellers.length, activeResellers: resellers.filter((r: any) => r.status === "active").length, apps: apps.length, keys: keys.length, activeKeys: keys.filter((k: any) => k.status === "active").length, usedKeys: keys.filter((k: any) => k.status === "used").length, totalCredits: "0.00" };

  // Products from real apps
  const productOptions = useMemo(() => apps.map((a: any) => a.name).slice(0, 6), [apps]);
  const [selectedProduct, setSelectedProduct] = useState(productOptions[0] || "Todos");

  // Years from real keys
  const years = useMemo(() => {
    const y = new Set<string>();
    keys.forEach((k: any) => { if (k.createdAt) y.add(new Date(k.createdAt).getFullYear().toString()); });
    const list = Array.from(y).sort().reverse();
    return list.length ? list : [new Date().getFullYear().toString()];
  }, [keys]);
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // Monthly data from real stats, filtered by year
  const monthlyData = useMemo(() => {
    const filtered = (stats?.months || []).filter((m: any) => m.month.startsWith(selectedYear));
    const data = months.map((label, idx) => {
      const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
      const found = filtered.find((m: any) => m.month === key);
      return { month: key, label, count: found ? Number(found.count) : 0, total: found ? Number(found.total) : 0 };
    });
    return data;
  }, [stats?.months, selectedYear]);

  // Top apps as regions (since we don't have real regions)
  const regionData = useMemo(() => (stats?.topApps || []).map((a: any) => ({ region: a.appName, value: Number(a.total || 0) })).slice(0, 5), [stats?.topApps]);

  // Real seller data
  const allSellers = useMemo(() => {
    const data: any[] = [];
    if (resellerStats?.credits) data.push(...resellerStats.credits);
    if (resellerStats?.percentage) data.push(...resellerStats.percentage);
    if (resellerStats?.other) data.push(...resellerStats.other);
    return data
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((r) => ({ name: r.username, value: Number(r.total || 0) }));
  }, [resellerStats]);

  // Best seller
  const bestSeller = allSellers[0];

  const summaryCards = [
    { label: "Quantidade Total", value: counts.keys, sub: "keys no sistema", icon: Key, color: "text-white" },
    { label: "Faturamento Total", value: formatCurrency(counts.totalCredits), sub: "créditos movimentados", icon: DollarSign, color: "text-white" },
    { label: "Resellers Ativos", value: counts.activeResellers, sub: "de " + counts.resellers, icon: Users, color: "text-white" },
    { label: "Apps Cadastrados", value: counts.apps, sub: "disponíveis", icon: AppWindow, color: "text-white" },
    { label: "Keys Usadas", value: counts.usedKeys, sub: "consumidas", icon: ShoppingBag, color: "text-white" },
  ];

  const topResellers = [
    { label: "Créditos", data: resellerStats?.credits || [] },
    { label: "Porcentagem", data: resellerStats?.percentage || [] },
    { label: "Other Store", data: resellerStats?.other || [] },
  ];

  return (
    <div className="min-h-screen p-6 pl-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-[260px_1fr] gap-6">
        {/* Sidebar filters */}
        <aside className="rounded-3xl p-5 space-y-8 h-fit" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Filter className="w-4 h-4 text-emerald-400" /> Filtros
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Produto</p>
            <div className="space-y-2">
              {productOptions.length === 0 && <p className="text-gray-600 text-xs">Nenhum app</p>}
              {productOptions.map((p: string) => (
                <button
                  key={p}
                  onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProduct === p ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Ano</p>
            <div className="space-y-2">
              {years.map((y: string) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedYear === y ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                {y}
              </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Melhores Vendedores</p>
            <div className="space-y-3">
              {[
                { type: "Créditos", data: resellerStats?.credits || [], color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                { type: "Porcentagem", data: resellerStats?.percentage || [], color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                { type: "Other Store", data: resellerStats?.other || [], color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              ].map(({ type, data, color, bg, border }) => {
                const top = data[0];
                return (
                  <div key={type} className={`p-4 rounded-2xl border ${border} ${bg}`}>
                    <p className={`text-xs font-semibold mb-2 ${color}`}>{type}</p>
                    {top ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white text-xs font-bold">
                            {top.username[0].toUpperCase()}
                          </div>
                          <p className="text-white text-sm font-semibold">{top.username}</p>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Keys</span>
                          <span className="text-white font-semibold">{top.count}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Total</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(top.total)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">Sem dados</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main dashboard */}
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium">Sistema Online</span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {summaryCards.map(({ label, value, sub, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(16,185,129,0.20)" }}
              >
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-white text-xl font-bold leading-none">{value}</p>
                  <p className="text-white/80 text-xs mt-1">{label}</p>
                  <p className="text-emerald-400/80 text-[10px]">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Line chart */}
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
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorCount)"
                      dot={{ r: 3, fill: "#34d399" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top apps */}
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold text-sm">Faturamento por App</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} />
                    <YAxis type="category" dataKey="region" stroke="#9ca3af" fontSize={10} width={90} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {regionData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#34d399" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seller vertical bar */}
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold text-sm">Faturamento por Vendedor</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allSellers} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tick={{ fill: "#9ca3af" }} interval={0} />
                    <YAxis stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} hide />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {allSellers.map((_, i) => (
                        <Cell key={`cell2-${i}`} fill={i % 2 === 0 ? "#34d399" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top resellers small */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {topResellers.map(({ label, data }) => (
              <div key={label} className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-white font-semibold text-sm mb-4">Top {label}</h2>
                <div className="space-y-2">
                  {data.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">Nenhuma compra</p>
                  ) : data.slice(0, 5).map((r: any, idx: number) => (
                    <div key={r.resellerId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-5">#{idx + 1}</span>
                        <span className="text-gray-300 text-sm">{r.username}</span>
                      </div>
                      <span className="text-emerald-400 text-xs font-semibold">{r.count} keys</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
