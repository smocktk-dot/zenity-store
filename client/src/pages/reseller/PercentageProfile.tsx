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
  Zap,
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
  backgroundColor: "#0a0a0f",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  color: "#fff",
  padding: "8px 12px",
  fontSize: "12px",
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

  const levels = [
    { label: language === "en" ? "Starter" : "Iniciante", discount: 35, from: 0, to: 10 },
    { label: language === "en" ? "Advanced" : "Avançado", discount: 40, from: 10, to: 20 },
    { label: language === "en" ? "Elite" : "Elite", discount: 50, from: 20, to: Infinity },
  ];

  const currentLevelIdx = purchases >= 20 ? 2 : purchases >= 10 ? 1 : 0;
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = currentLevelIdx < 2 ? levels[currentLevelIdx + 1] : null;
  const progressInLevel = purchases >= 20 ? 10 : purchases >= 10 ? purchases - 10 : purchases;
  const progressPct = nextLevel ? Math.min(100, (progressInLevel / 10) * 100) : 100;

  const counts = dashboard?.counts || { totalKeys: 0, totalSpent: "0.00", activeKeys: 0, usedKeys: 0 };

  const summaryCards = [
    {
      label: language === "en" ? "Total Keys" : "Total de Keys",
      value: counts.totalKeys,
      sub: language === "en" ? "purchased" : "compradas",
      icon: Key,
    },
    {
      label: language === "en" ? "Total Spent" : "Gasto Total",
      value: `R$ ${Number(counts.totalSpent).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: language === "en" ? "credits" : "créditos",
      icon: DollarSign,
    },
    {
      label: language === "en" ? "Active Keys" : "Keys Ativas",
      value: counts.activeKeys,
      sub: language === "en" ? "available" : "disponíveis",
      icon: ShoppingBag,
    },
    {
      label: language === "en" ? "Used Keys" : "Keys Usadas",
      value: counts.usedKeys,
      sub: language === "en" ? "consumed" : "consumidas",
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
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
          active
            ? "text-white bg-white/[0.08] border border-white/[0.12]"
            : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ─── Clean Minimal Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t.profile_title}
            </h1>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300">
              {otherStore ? "Other Store" : `${discount}% ${language === "en" ? "discount" : "desconto"}`}
            </span>
          </div>
          <p className="text-zinc-500 text-xs mt-1">
            {otherStore ? "Reseller Other Store" : t.profile_type_percentage}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/reseller/apps">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Buy Keys" : "Comprar Keys"}</span>
            </button>
          </Link>
          <Link href="/reseller/keys">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-medium transition-all"
            >
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === "en" ? "My Keys" : "Minhas Keys"}</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ─── Clean Tabs ─── */}
      <div className="flex items-center gap-1.5">
        {tabButton("overview", language === "en" ? "Overview" : "Visão Geral", LayoutDashboard)}
        {tabButton("discount", language === "en" ? "My Discount" : "Meu Desconto", Award)}
        {profile.canCreateSubResellers && tabButton("subresellers", language === "en" ? "Sub Resellers" : "Sub Resellers", Users)}
      </div>

      {/* ─── TAB: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 4 Clean Minimal KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {summaryCards.map(({ label, value, sub, icon: Icon }) => (
              <div
                key={label}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs font-medium">{label}</span>
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <p className="text-xl font-bold text-white tracking-tight mt-2 font-mono">
                  {value}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Account & Details (Clean 3 Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: Account */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Conta</p>
                <p className="text-sm font-semibold text-white">{profile.username}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{profile.email || "—"}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Ativo • {otherStore ? "Other Store" : "Porcentagem"}</span>
              </div>
            </div>

            {/* Card 2: Discount */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Desconto Atual</p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-medium border border-white/[0.06]">
                    {currentLevel.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white font-mono mt-1">{discount}%</p>
                <p className="text-xs text-zinc-400 mt-0.5">{purchases} compras realizadas</p>
              </div>
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            {/* Card 3: Session */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Sessão & Registro</p>
                <p className="text-xs text-zinc-400">Membro desde: <span className="text-white font-medium">{formatDate(profile.createdAt, language)}</span></p>
                <p className="text-xs text-zinc-400 mt-1">Último acesso: <span className="text-white font-medium">{formatDate(profile.lastLoginAt, language)}</span></p>
              </div>
              <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <span>Criptografia:</span>
                <span className="text-zinc-300 font-medium">AES-256</span>
              </div>
            </div>
          </div>

          {/* Clean Monthly License Chart */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Keys por Mês</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Histórico de licenças geradas por período</p>
              </div>
              <div className="flex items-center gap-1">
                {years.map((y: string) => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      selectedYear === y
                        ? "text-white bg-white/[0.08] font-semibold border border-white/[0.12]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56">
              {dashLoading ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Carregando...</div>
              ) : monthlyData.every((d) => d.count === 0) ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Nenhuma key neste ano</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCountClean" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="label" stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tick={{ fill: "#71717a" }} allowDecimals={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#34d399"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCountClean)"
                      dot={{ r: 3, fill: "#34d399" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bottom Grid: Apps BarChart */}
          {topApps.length > 0 && (
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-zinc-400" />
                <h2 className="text-white font-semibold text-sm">Keys por App</h2>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topApps} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" stroke="#52525b" fontSize={10} tick={{ fill: "#71717a" }} axisLine={false} />
                    <YAxis type="category" dataKey="region" stroke="#71717a" fontSize={11} width={80} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: DISCOUNT TIERS ─── */}
      {activeTab === "discount" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Big Discount Card */}
          <div className="p-8 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
              {t.profile_current_discount}
            </p>
            <p className="text-5xl font-bold text-white font-mono tracking-tight">
              {discount}
              <span className="text-2xl text-emerald-400 font-semibold">%</span>
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              Nível atual: <span className="text-white font-medium">{currentLevel.label}</span>
            </p>
          </div>

          {/* Progress */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-white font-semibold text-sm mb-3">
              {language === "en" ? "Progress to next tier" : "Progresso para o próximo nível"}
            </h2>
            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>{progressInLevel} / 10 compras</span>
                  <span className="text-white font-medium">{nextLevel.discount}% próximo</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-zinc-500 text-xs mt-2">
                  Faltam <strong className="text-white">{10 - progressInLevel} compras</strong> para liberar {nextLevel.discount}% de desconto.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white/[0.03] text-center text-xs text-zinc-300">
                Nível Máximo Atingido (50% de desconto em todas as chaves).
              </div>
            )}
          </div>

          {/* Tiers List */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-white font-semibold text-sm mb-3">Tabela de Níveis</h2>
            <div className="space-y-2">
              {levels.map((level, idx) => {
                const isUnlocked = currentLevelIdx >= idx;
                const isCurrent = currentLevelIdx === idx;
                return (
                  <div
                    key={level.label}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-colors ${
                      isCurrent
                        ? "border-white/[0.15] bg-white/[0.04]"
                        : isUnlocked
                        ? "border-white/[0.06] bg-white/[0.01]"
                        : "border-white/[0.03] opacity-40"
                    }`}
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">{level.label}</p>
                      <p className="text-zinc-500 text-xs">
                        {level.from === 0 ? "Inicial" : `A partir de ${level.from} compras`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-white">{level.discount}%</span>
                      {isCurrent && <span className="text-[11px] text-emerald-400 block font-medium">● Atual</span>}
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
        <div className="space-y-5 animate-in fade-in duration-200">
          <SubResellersSection />
        </div>
      )}
    </div>
  );
}
