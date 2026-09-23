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
    { label: "Quantidade Total", value: counts.keys, sub: "keys no sistema", icon: Key },
    { label: "Faturamento Total", value: formatCurrency(counts.totalCredits), sub: "créditos movimentados", icon: DollarSign },
    { label: "Resellers Ativos", value: `${counts.activeResellers} / ${counts.resellers}`, sub: "revendedores em operação", icon: Users },
    { label: "Apps Cadastrados", value: counts.apps, sub: "softwares disponíveis", icon: AppWindow },
    { label: "Keys Usadas", value: counts.usedKeys, sub: "licenças consumidas", icon: ShoppingBag },
  ];

  const topResellers = [
    { label: "Créditos", data: resellerStats?.credits || [], badge: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
    { label: "Porcentagem", data: resellerStats?.percentage || [], badge: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
    { label: "Other Store", data: resellerStats?.other || [], badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar filters */}
        <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 space-y-6 h-fit">
          <div className="flex items-center gap-2 text-white font-semibold pb-3 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm">Filtros & Métricas</span>
          </div>

          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider mb-2 font-medium">Produto / App</p>
            <div className="space-y-1">
              {productOptions.length === 0 && <p className="text-zinc-600 text-xs">Nenhum software cadastrado</p>}
              {productOptions.map((p: string) => {
                const active = selectedProduct === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider mb-2 font-medium">Ano Contábil</p>
            <div className="grid grid-cols-3 gap-1.5">
              {years.map((y: string) => {
                const active = selectedYear === y;
                return (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all text-center ${
                      active
                        ? "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-white/[0.04]"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-wider mb-3 font-medium">Melhores Vendedores</p>
            <div className="space-y-2.5">
              {[
                { type: "Créditos", data: resellerStats?.credits || [], badge: "bg-amber-500/10 text-amber-300 border-amber-500/25" },
                { type: "Porcentagem", data: resellerStats?.percentage || [], badge: "bg-violet-500/10 text-violet-300 border-violet-500/25" },
                { type: "Other Store", data: resellerStats?.other || [], badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
              ].map(({ type, data, badge }) => {
                const top = data[0];
                return (
                  <div key={type} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.015]">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge}`}>
                        {type}
                      </span>
                      {top && <span className="text-[10px] text-zinc-500 font-mono font-medium">Top 1</span>}
                    </div>
                    {top ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white text-[11px] font-bold uppercase">
                            {top.username[0]?.toUpperCase()}
                          </div>
                          <p className="text-white text-xs font-semibold truncate">{top.username}</p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
                          <span className="text-zinc-500">{top.count} keys</span>
                          <span className="text-emerald-400 font-mono font-bold">{formatCurrency(top.total)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-xs py-1">Sem movimentações</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main dashboard */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Executivo</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.08] font-mono">
                  {selectedYear}
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-1">Métricas consolidadas de vendas, estoque e atividade de revendedores</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Sistema Online (100%)</span>
            </div>
          </div>

          {/* Metric cards (Clean corporate cards matching Reseller panel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {summaryCards.map(({ label, value, sub, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.015] hover:bg-white/[0.03] hover:border-white/[0.14] p-4 flex items-center gap-3.5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider truncate">{label}</p>
                  <p className="text-white font-bold font-mono text-lg leading-tight mt-0.5 truncate">{value}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Area chart */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Volume de Keys por Mês</h2>
                  <p className="text-zinc-500 text-[11px]">Distribuição de chaves emitidas no ano contábil {selectedYear}</p>
                </div>
              </div>
            </div>
            <div className="h-72">
              {monthlyData.every((d) => d.count === 0) ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                  Nenhuma key gerada neste ano
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label" stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} allowDecimals={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top apps */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Faturamento por Software</h2>
                  <p className="text-zinc-500 text-[11px]">Top aplicações com maior movimentação</p>
                </div>
              </div>
              <div className="h-72">
                {regionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    Sem dados de faturamento por software
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} axisLine={false} />
                      <YAxis type="category" dataKey="region" stroke="#71717a" fontSize={10} width={90} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {regionData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={i % 2 === 0 ? "#10b981" : "#059669"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Seller vertical bar */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Faturamento por Revendedor</h2>
                  <p className="text-zinc-500 text-[11px]">Líderes de receita no ecossistema</p>
                </div>
              </div>
              <div className="h-72">
                {allSellers.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    Sem revendedores cadastrados com vendas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allSellers} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" fontSize={10} tick={{ fill: "#71717a" }} interval={0} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} hide />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {allSellers.map((_, i) => (
                          <Cell key={`cell2-${i}`} fill={i % 2 === 0 ? "#10b981" : "#059669"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top resellers small cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {topResellers.map(({ label, data, badge }) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <h2 className="text-white font-semibold text-xs tracking-wide">Top Revendedores</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge}`}>
                    {label}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.length === 0 ? (
                    <p className="text-zinc-500 text-xs text-center py-6">Nenhuma compra registrada</p>
                  ) : data.slice(0, 5).map((r: any, idx: number) => (
                    <div key={r.resellerId} className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-zinc-500 w-5">#{idx + 1}</span>
                        <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                          {r.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-zinc-200 text-xs font-medium truncate">{r.username}</span>
                      </div>
                      <span className="text-emerald-400 text-xs font-mono font-bold shrink-0">{r.count} keys</span>
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
