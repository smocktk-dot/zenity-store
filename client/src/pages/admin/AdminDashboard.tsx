import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users, AppWindow, Key, TrendingUp, ShoppingBag, DollarSign,
  BarChart3, MapPin, User, Filter
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

function formatCurrency(val: string | number) {
  const n = Number(val || 0);
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const chartTooltipStyle = {
  backgroundColor: "rgba(8,8,10,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
};

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.dashboardStats.useQuery();
  const { data: resellerStats } = trpc.admin.resellerStats.useQuery();
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const { data: keys = [] } = trpc.admin.listAllKeys.useQuery();

  const counts = stats?.counts ?? { resellers: resellers.length, activeResellers: 0, keys: keys.length, activeKeys: 0, usedKeys: 0, totalCredits: "0.00" };
  const topApps = stats?.topApps ?? [];

  // Mock monthly data inspired by the reference; in real use it would come from API
  const monthlyData = (stats?.months ?? [
    { month: "01", count: 12 },
    { month: "02", count: 17 },
    { month: "03", count: 15 },
    { month: "04", count: 15 },
    { month: "05", count: 18 },
    { month: "06", count: 16 },
    { month: "07", count: 20 },
    { month: "08", count: 19 },
    { month: "09", count: 17 },
    { month: "10", count: 22 },
    { month: "11", count: 21 },
    { month: "12", count: 23 },
  ]).map((m) => ({ ...m, label: months[Number(m.month) - 1] || m.month }));

  const regionData = [
    { region: "Norte", value: 24500 },
    { region: "Nordeste", value: 18200 },
    { region: "Centro-Oeste", value: 33100 },
    { region: "Sudeste", value: 28700 },
    { region: "Sul", value: 15600 },
  ];

  const sellerData = (resellerStats?.credits || []).slice(0, 6).map((r: any, i: number) => ({
    name: r.username,
    value: Number(r.total || 0) + i * 1200,
  }));

  const summaryCards = [
    { label: "Quantidade Total", value: counts.keys, icon: Key, color: "text-white", bg: "#1e40af" },
    { label: "Faturamento Total", value: formatCurrency(counts.totalCredits), icon: DollarSign, color: "text-white", bg: "#1d4ed8" },
    { label: "Boleto Bancário", value: "R$ 0,00", icon: BarChart3, color: "text-white", bg: "#2563eb" },
    { label: "Cartão de Crédito", value: "R$ 0,00", icon: ShoppingBag, color: "text-white", bg: "#3b82f6" },
    { label: "Cartão de Débito", value: "R$ 0,00", icon: TrendingUp, color: "text-white", bg: "#60a5fa" },
  ];

  const [selectedProduct, setSelectedProduct] = useState("Power BI");
  const [selectedYear, setSelectedYear] = useState("2024");

  return (
    <div className="min-h-screen p-6 pl-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-[240px_1fr] gap-6">
        {/* Sidebar filters */}
        <aside className="rounded-3xl p-5 space-y-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 750 }}>
          <div className="flex items-center gap-2 text-white font-semibold">
            <Filter className="w-4 h-4 text-emerald-400" /> Filtros
          </div>

          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Produto</p>
            <div className="space-y-2">
              {["Power BI", "Excel", "Python", "VBA"].map((p) => (
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
              {["2022", "2023", "2024"].map((y) => (
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
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Melhor Vendedor</p>
            <div className="flex flex-col items-center p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                JM
              </div>
              <p className="text-white text-sm font-semibold mt-3">João Martins</p>
              <div className="w-full mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500"><span>S</span><span>R$ 4.050</span></div>
                <div className="flex justify-between text-gray-500"><span>SE</span><span>R$ 3.900</span></div>
                <div className="flex justify-between text-gray-500"><span>CO</span><span>R$ 6.650</span></div>
                <div className="flex justify-between text-gray-500"><span>CD</span><span>R$ 2.000</span></div>
                <div className="flex justify-between text-gray-500"><span>NE</span><span>R$ 3.850</span></div>
                <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-1 mt-1"><span>Total</span><span>R$ 20.450</span></div>
              </div>
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
            {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: bg, border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-white text-xl font-bold leading-none">{value}</p>
                  <p className="text-white/80 text-xs mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Line chart */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white font-semibold text-sm">Faturamento por Mês</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} />
                  <YAxis stroke="#6b7280" fontSize={12} tick={{ fill: "#9ca3af" }} hide />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#34d399" }}
                    activeDot={{ r: 6 }}
                    label={{ position: "top", fill: "#fff", fontSize: 10, formatter: (v: number) => `R$ ${v}.000` }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Region horizontal bar */}
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold text-sm">Faturamento por Região</h2>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} />
                    <YAxis type="category" dataKey="region" stroke="#9ca3af" fontSize={12} width={80} />
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
                  <BarChart data={sellerData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tick={{ fill: "#9ca3af" }} interval={0} />
                    <YAxis stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} hide />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {sellerData.map((_, i) => (
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
            {[
              { label: "Créditos", data: resellerStats?.credits || [] },
              { label: "Porcentagem", data: resellerStats?.percentage || [] },
              { label: "Other Store", data: resellerStats?.other || [] },
            ].map(({ label, data }) => (
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
