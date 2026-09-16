import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Percent,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Clock,
  User,
  Mail,
  BarChart3,
  Package,
  DollarSign,
  Key,
  LayoutDashboard,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Layers,
} from "lucide-react";
import SubResellersSection from "./SubResellersSection";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const chartTooltipStyle = {
  backgroundColor: "rgba(6, 12, 9, 0.95)",
  border: "1px solid rgba(52, 211, 153, 0.3)",
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
  color: "#fff",
  padding: "10px 14px",
};

function formatDate(d: Date | null | undefined, lang: "pt" | "en") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PercentageProfile({
  profile,
  otherStore,
}: {
  profile: any;
  otherStore?: boolean;
}) {
  const { t, language } = useLanguage();
  const { data: dashboard, isLoading: dashLoading } = trpc.reseller.dashboard.useQuery();
  const [activeTab, setActiveTab] = useState<"overview" | "discount" | "subresellers">("overview");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const purchases = profile.totalPurchases ?? 0;
  const discount = parseFloat(String(profile.discountPercent ?? 0));

  const years = useMemo(() => {
    const y = new Set<string>();
    dashboard?.monthly?.forEach((m: any) => y.add(m.month.slice(0, 4)));
    const list = Array.from(y).sort().reverse();
    return list.length ? list : [new Date().getFullYear().toString()];
  }, [dashboard?.monthly]);

  const monthlyData = useMemo(() => {
    const filtered = (dashboard?.monthly || []).filter((m: any) => m.month.startsWith(selectedYear));
    return months.map((label, idx) => {
      const key = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
      const found = filtered.find((m: any) => m.month === key);
      return { month: key, label, count: found ? Number(found.count) : 0 };
    });
  }, [dashboard?.monthly, selectedYear]);

  // Year analytics stats
  const yearStats = useMemo(() => {
    const total = monthlyData.reduce((acc, cur) => acc + cur.count, 0);
    const maxItem = [...monthlyData].sort((a, b) => b.count - a.count)[0];
    const activeMonths = monthlyData.filter(m => m.count > 0).length || 1;
    const avg = (total / activeMonths).toFixed(1);
    return { total, maxMonth: maxItem?.count > 0 ? `${maxItem.label.toUpperCase()} (${maxItem.count})` : "—", avg };
  }, [monthlyData]);

  const levels = [
    { label: language === "en" ? "Starter" : "Iniciante", discount: 35, from: 0, to: 10, color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
    { label: language === "en" ? "Advanced" : "Avançado", discount: 40, from: 10, to: 20, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/35" },
    { label: language === "en" ? "Elite" : "Elite Partner", discount: 50, from: 20, to: Infinity, color: "text-emerald-200", bg: "bg-emerald-400/20", border: "border-emerald-400/40" },
  ];

  const currentLevelIdx = purchases >= 20 ? 2 : purchases >= 10 ? 1 : 0;
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = currentLevelIdx < 2 ? levels[currentLevelIdx + 1] : null;
  const progressInLevel = purchases >= 20 ? 10 : purchases >= 10 ? purchases - 10 : purchases;
  const progressPct = nextLevel ? Math.min(100, (progressInLevel / 10) * 100) : 100;

  const counts = dashboard?.counts || { totalKeys: 0, totalSpent: "0.00", activeKeys: 0, usedKeys: 0 };

  const summaryCards = [
    {
      label: language === "en" ? "Total Licenses" : "Total de Licenças",
      value: counts.totalKeys,
      sub: language === "en" ? "Lifetime generated keys" : "Histórico acumulado de chaves",
      tag: language === "en" ? "Delivered" : "Entregues",
      icon: Key,
    },
    {
      label: language === "en" ? "Total Volume" : "Volume Total Faturado",
      value: `R$ ${Number(counts.totalSpent).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: language === "en" ? "Gross key volume (credits)" : "Valor bruto faturado em chaves",
      tag: language === "en" ? "Gross Volume" : "Volume Real",
      icon: DollarSign,
    },
    {
      label: language === "en" ? "Active Stock" : "Licenças em Estoque",
      value: counts.activeKeys,
      sub: language === "en" ? "Available for client delivery" : "Chaves ativas prontas para entrega",
      tag: language === "en" ? "Ready" : "Disponíveis",
      icon: ShoppingBag,
    },
    {
      label: language === "en" ? "Used Keys" : "Licenças Ativadas",
      value: counts.usedKeys,
      sub: language === "en" ? "Consumed by end users" : "Chaves resgatadas pelos clientes",
      tag: language === "en" ? "Consumed" : "Em Uso",
      icon: BarChart3,
    },
  ];

  const topApps = (dashboard?.byApp || []).map((a: any) => ({ region: a.appName, value: a.count }));

  const tabButton = (id: "overview" | "discount" | "subresellers", label: string, icon: any) => {
    const Icon = icon;
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
          active
            ? "text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
            : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Executive Reseller Header ─── */}
      <div
        className="p-6 sm:p-7 rounded-3xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(8, 16, 12, 0.85) 0%, rgba(4, 8, 6, 0.95) 100%)",
          border: "1px solid rgba(52, 211, 153, 0.22)",
          boxShadow: "0 20px 50px -15px rgba(0, 0, 0, 0.7), 0 0 30px -8px rgba(16, 185, 129, 0.12)",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          {/* Left: Avatar + Identity */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Avatar Monogram */}
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl text-white uppercase"
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.15) 100%)",
                  border: "1px solid rgba(52, 211, 153, 0.45)",
                  boxShadow: "0 0 24px -4px rgba(16, 185, 129, 0.35)",
                }}
              >
                {String(profile.username || "R")[0]}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#040806]"
                title="Online"
              />
            </div>

            {/* Texts */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profile.username}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "VERIFIED PARTNER" : "PARCEIRO VERIFICADO"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  {otherStore ? "Other Store" : `Contrato Porcentagem (${discount}% OFF)`}
                </span>
                {profile.email && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    {profile.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {language === "en" ? "Partner since" : "Membro desde"} {formatDate(profile.createdAt, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/reseller/apps">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{language === "en" ? "Purchase Keys" : "Adquirir Keys"}</span>
              </button>
            </Link>

            <Link href="/reseller/keys">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.1] text-xs font-bold transition-all hover:scale-[1.02]"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                <span>{language === "en" ? "My Licenses" : "Minhas Licenças"}</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Segmented Tabs Bar ─── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] w-fit">
        {tabButton("overview", language === "en" ? "Overview" : "Visão Geral", LayoutDashboard)}
        {tabButton("discount", language === "en" ? "My Discount & Tiers" : "Meu Desconto & Níveis", Award)}
        {profile.canCreateSubResellers && tabButton("subresellers", language === "en" ? "Sub Resellers" : "Sub Resellers", Users)}
      </div>

      {/* ─── TAB: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, sub, tag, icon: Icon }) => (
              <div
                key={label}
                className="p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-3px]"
                style={{
                  background: "linear-gradient(135deg, rgba(8, 16, 12, 0.75) 0%, rgba(4, 8, 6, 0.9) 100%)",
                  border: "1px solid rgba(52, 211, 153, 0.18)",
                  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
                }}
              >
                {/* Top highlight shine */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.5), transparent)" }}
                />

                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                    }}
                  >
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {tag}
                  </span>
                </div>

                <p className="text-white text-2xl font-black tracking-tight leading-none font-mono">
                  {value}
                </p>
                <p className="text-gray-200 text-xs font-semibold mt-2">{label}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Partner Standing & Security Grid (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Identity & Security */}
            <div
              className="p-5 rounded-2xl flex flex-col justify-between"
              style={{
                background: "rgba(6, 12, 9, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">
                    {language === "en" ? "Security & Status" : "Segurança & Conta"}
                  </span>
                </div>
                <p className="text-white text-sm font-bold">{profile.username}</p>
                <p className="text-gray-400 text-xs mt-1">{profile.email || "—"}</p>
              </div>

              <div className="pt-3 mt-4 border-t border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sessão Criptografada AES-256</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Proteção de HWID & Anti-Leak</span>
                </div>
              </div>
            </div>

            {/* Card 2: Tier & Discount */}
            <div
              className="p-5 rounded-2xl flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 12, 9, 0.7) 100%)",
                border: "1px solid rgba(52, 211, 153, 0.25)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    {language === "en" ? "Current Tier" : "Nível & Margem"}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentLevel.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white font-mono">{discount}%</span>
                  <span className="text-xs text-gray-400 font-medium">desconto em chaves</span>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-white/[0.06]">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>{purchases} compras registradas</span>
                  {nextLevel ? (
                    <span className="text-emerald-400 font-semibold">Próximo: {nextLevel.discount}%</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Nível Máximo</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Timestamps & Network Status */}
            <div
              className="p-5 rounded-2xl flex flex-col justify-between"
              style={{
                background: "rgba(6, 12, 9, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">
                    {language === "en" ? "Audit & Activity" : "Auditoria & Sessão"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Último Acesso:</p>
                <p className="text-white text-sm font-semibold mt-0.5">{formatDate(profile.lastLoginAt, language)}</p>
              </div>

              <div className="pt-3 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Status Operacional:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online • &lt; 14ms
                </span>
              </div>
            </div>
          </div>

          {/* ─── Monthly License Analytics Chart ─── */}
          <div
            className="p-6 rounded-3xl"
            style={{
              background: "rgba(6, 12, 9, 0.6)",
              border: "1px solid rgba(52, 211, 153, 0.16)",
              boxShadow: "0 16px 40px -15px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header + year selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-white font-bold text-base tracking-tight">
                    {language === "en" ? "Monthly License Volume" : "Volume Mensal de Licenças"}
                  </h2>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  {language === "en"
                    ? "Tracking license acquisitions across your reseller account"
                    : "Acompanhamento do volume mensal de chaves geradas em sua conta"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {years.map((y: string) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      selectedYear === y
                        ? "text-black bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Chart Analytics Strip */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] mb-5 text-center">
              <div>
                <p className="text-[10px] font-mono uppercase text-gray-500">Total no Ano</p>
                <p className="text-white text-base font-bold font-mono mt-0.5">{yearStats.total} keys</p>
              </div>
              <div className="border-x border-white/[0.06]">
                <p className="text-[10px] font-mono uppercase text-gray-500">Pico Mensal</p>
                <p className="text-emerald-400 text-base font-bold font-mono mt-0.5">{yearStats.maxMonth}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-gray-500">Média Ativa</p>
                <p className="text-white text-base font-bold font-mono mt-0.5">{yearStats.avg} keys/mês</p>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-64 sm:h-72">
              {dashLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  {language === "en" ? "Loading telemetry..." : "Carregando dados..."}
                </div>
              ) : monthlyData.every((d) => d.count === 0) ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  {language === "en" ? "No licenses recorded in this year" : "Nenhuma key registrada neste ano"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#4b5563"
                      fontSize={11}
                      tick={{ fill: "#9ca3af" }}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#4b5563"
                      fontSize={11}
                      tick={{ fill: "#9ca3af" }}
                      allowDecimals={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#34d399"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCount3)"
                      dot={{ r: 3, fill: "#34d399", strokeWidth: 2, stroke: "#040806" }}
                      activeDot={{ r: 6, fill: "#ffffff", stroke: "#34d399", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ─── Bottom 2 Cards: Top Apps & Level Roadmap ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Apps BarChart */}
            <div
              className="p-6 rounded-3xl"
              style={{
                background: "rgba(6, 12, 9, 0.6)",
                border: "1px solid rgba(52, 211, 153, 0.16)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-bold text-sm tracking-tight">
                  {language === "en" ? "Distribution by Software" : "Distribuição por Software"}
                </h2>
              </div>
              <div className="h-60">
                {topApps.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    {language === "en" ? "No software data recorded" : "Nenhum dado registrado"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topApps} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" stroke="#6b7280" fontSize={11} tick={{ fill: "#9ca3af" }} axisLine={false} />
                      <YAxis type="category" dataKey="region" stroke="#9ca3af" fontSize={11} width={90} axisLine={false} />
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

            {/* Next Level Progression Guide */}
            <div
              className="p-6 rounded-3xl flex flex-col justify-between"
              style={{
                background: "rgba(6, 12, 9, 0.6)",
                border: "1px solid rgba(52, 211, 153, 0.16)",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-white font-bold text-sm tracking-tight">
                    {language === "en" ? "Progression Roadmap" : "Roadmap de Desconto"}
                  </h2>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {language === "en"
                    ? "Your discount scales automatically with your completed purchases. Higher tiers unlock greater margin and priority fulfillment."
                    : "Seu desconto aumenta automaticamente conforme você acumula vendas no painel. Níveis superiores garantem margens maiores de lucro."}
                </p>

                <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">{currentLevel.label}</p>
                      <p className="text-gray-400 text-[11px]">{purchases} compras concluídas</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-400 font-mono">{discount}% OFF</span>
                </div>
              </div>

              {nextLevel ? (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-300 text-xs font-bold">
                      {language === "en" ? "Next Milestone:" : "Próxima Meta:"} {nextLevel.discount}% OFF
                    </p>
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      Faltam <strong className="text-white">{10 - progressInLevel} compras</strong> para desbloquear.
                    </p>
                  </div>
                  <Link href="/reseller/apps">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-emerald-400 text-black font-bold text-xs hover:bg-emerald-300 transition-all"
                    >
                      Comprar
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <p className="text-emerald-300 text-xs font-bold">Nível Máximo Atingido (Elite Partner)</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">Você já desfruta da margem máxima de 50% de desconto em todas as chaves.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: DISCOUNT TIERS ─── */}
      {activeTab === "discount" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Big discount hero */}
          <div
            className="p-8 sm:p-10 rounded-3xl text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 12, 9, 0.9) 70%)",
              border: "1px solid rgba(52, 211, 153, 0.35)",
              boxShadow: "0 20px 60px -20px rgba(16, 185, 129, 0.25)",
            }}
          >
            <p className="text-emerald-300 text-xs font-mono uppercase tracking-widest font-bold mb-3">
              {t.profile_current_discount}
            </p>
            <p className="text-white text-6xl sm:text-7xl font-black tracking-tight font-mono">
              {discount}
              <span className="text-3xl sm:text-4xl text-emerald-400 font-semibold">%</span>
            </p>
            <div className="mt-4">
              <span className="text-xs px-4 py-1.5 rounded-full border font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/35">
                {currentLevel.label}
              </span>
            </div>
          </div>

          {/* Progress to next level */}
          <div
            className="p-6 rounded-3xl"
            style={{
              background: "rgba(6, 12, 9, 0.6)",
              border: "1px solid rgba(52, 211, 153, 0.16)",
            }}
          >
            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{language === "en" ? "Progress to next tier" : "Progresso para o próximo nível"}</span>
            </h2>
            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 font-medium">
                    {progressInLevel} / 10 {language === "en" ? "purchases completed" : "compras concluídas"}
                  </span>
                  <span className="text-emerald-400 font-bold">{nextLevel.discount}% {language === "en" ? "next" : "próximo"}</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  Faltam <strong className="text-emerald-400">{10 - progressInLevel} compras</strong> para liberar a margem de {nextLevel.discount}%.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-emerald-300 text-sm font-bold">Nível Máximo Atingido (50% OFF)</p>
                <p className="text-gray-400 text-xs mt-1">Parabéns! Sua conta atingiu o patamar mais alto de revenda oficial da VG SELLERS.</p>
              </div>
            )}
          </div>

          {/* Levels Breakdown */}
          <div
            className="p-6 rounded-3xl"
            style={{
              background: "rgba(6, 12, 9, 0.6)",
              border: "1px solid rgba(52, 211, 153, 0.16)",
            }}
          >
            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{language === "en" ? "Discount Tiers" : "Tabela Oficial de Níveis"}</span>
            </h2>
            <div className="space-y-3">
              {levels.map((level, idx) => {
                const isUnlocked = currentLevelIdx >= idx;
                const isCurrent = currentLevelIdx === idx;
                return (
                  <div
                    key={level.label}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                      isCurrent
                        ? "border border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : isUnlocked
                        ? "border border-white/10 bg-white/[0.02]"
                        : "border border-white/5 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold ${
                          isUnlocked ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-gray-600"
                        }`}
                      >
                        {level.discount}%
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{level.label}</p>
                        <p className="text-gray-400 text-xs">
                          {level.from === 0 ? "Disponível no cadastro" : `Após ${level.from} compras realizadas`}
                        </p>
                      </div>
                    </div>
                    <div>
                      {isCurrent ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-400 text-black">
                          ● Nível Atual
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Desbloqueado
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">Bloqueado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: SUB RESELLERS ─── */}
      {activeTab === "subresellers" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <SubResellersSection />
        </div>
      )}
    </div>
  );
}
