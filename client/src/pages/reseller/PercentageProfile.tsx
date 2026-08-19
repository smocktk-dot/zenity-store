import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Percent, TrendingUp, ShoppingBag, Calendar, MapPin, Clock,
  User, Mail, BarChart3, Package, DollarSign, Key, LayoutDashboard, Award, Users,
} from "lucide-react";
import SubResellersSection from "./SubResellersSection";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const chartTooltipStyle = {
  backgroundColor: "rgba(8,8,10,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
};

function formatDate(d: Date | null | undefined, lang: "pt" | "en") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function PercentageProfile({ profile, otherStore }: { profile: any; otherStore?: boolean }) {
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
    { label: language === "en" ? "Starter" : "Iniciante", discount: 35, from: 0, to: 10, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    { label: language === "en" ? "Advanced" : "Avançado", discount: 40, from: 10, to: 20, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    { label: language === "en" ? "Elite" : "Elite", discount: 50, from: 20, to: Infinity, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  ];

  const currentLevelIdx = purchases >= 20 ? 2 : purchases >= 10 ? 1 : 0;
  const currentLevel = levels[currentLevelIdx];
  const nextLevel = currentLevelIdx < 2 ? levels[currentLevelIdx + 1] : null;
  const progressInLevel = purchases >= 20 ? 10 : purchases >= 10 ? purchases - 10 : purchases;
  const progressPct = nextLevel ? Math.min(100, (progressInLevel / 10) * 100) : 100;

  const counts = dashboard?.counts || { totalKeys: 0, totalSpent: "0.00", activeKeys: 0, usedKeys: 0 };

  const summaryCards = [
    { label: "Total Keys", value: counts.totalKeys, sub: "compradas", icon: Key },
    { label: "Gasto Total", value: `R$ ${Number(counts.totalSpent).toFixed(2)}`, sub: "créditos", icon: DollarSign },
    { label: "Ativas", value: counts.activeKeys, sub: "disponíveis", icon: ShoppingBag },
    { label: "Usadas", value: counts.usedKeys, sub: "consumidas", icon: BarChart3 },
  ];

  const topApps = (dashboard?.byApp || []).map((a: any) => ({ region: a.appName, value: a.count }));

  const tabButton = (id: "overview" | "discount" | "subresellers", label: string, icon: any) => {
    const Icon = icon;
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.profile_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{otherStore ? "Reseller Other Store" : t.profile_type_percentage}</p>
        </div>
        <span className="self-start sm:self-auto text-xs px-3 py-2 rounded-full border font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-2">
          <Percent className="w-3.5 h-3.5" />
          {otherStore ? "Other Store" : (language === "en" ? "Percentage Reseller" : "Reseller Porcentagem")}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        {tabButton("overview", language === "en" ? "Overview" : "Visão Geral", LayoutDashboard)}
        {tabButton("discount", language === "en" ? "My Discount" : "Meu Desconto", Award)}
        {profile.canCreateSubResellers && tabButton("subresellers", language === "en" ? "Sub Resellers" : "Sub Resellers", Users)}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(16,185,129,0.20)" }}>
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-white text-xl font-bold leading-none">{value}</p>
                <p className="text-white/80 text-xs mt-1">{label}</p>
                <p className="text-emerald-400/80 text-[10px]">{sub}</p>
              </div>
            ))}
          </div>

          {/* Account + info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><User className="w-4 h-4 text-emerald-400" /></div>
                <div><p className="text-gray-500 text-xs">Username</p><p className="text-white text-sm font-semibold">{profile.username}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Mail className="w-4 h-4 text-blue-400" /></div>
                <div><p className="text-gray-500 text-xs">{t.profile_email}</p><p className="text-white text-sm font-semibold">{profile.email || "—"}</p></div>
              </div>
            </div>
            {[
              { label: t.profile_total_purchases, value: purchases, icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: language === "en" ? "Member since" : "Membro desde", value: formatDate(profile.createdAt, language), icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { label: language === "en" ? "Last access" : "Último acesso", value: formatDate(profile.lastLoginAt, language), icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`rounded-3xl p-5 ${bg} border ${border}`}>
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-4">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-gray-500 text-xs">{label}</p>
                <p className="text-white text-lg font-semibold mt-1 truncate">{String(value)}</p>
              </div>
            ))}
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

          {/* Area chart */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-white font-semibold text-sm">Keys por Mês</h2>
            </div>
            <div className="h-64">
              {dashLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">Carregando...</div>
              ) : monthlyData.every((d) => d.count === 0) ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">Nenhuma key neste ano</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount3" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorCount3)"
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

            {/* Next level hint */}
            <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-white font-semibold text-sm">Próximo Nível</h2>
              </div>
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">{language === "en" ? "Complete more purchases to unlock higher discounts." : "Complete mais compras para desbloquear descontos maiores."}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{currentLevel.label}</p>
                    <p className="text-gray-500 text-xs">{purchases} {language === "en" ? "purchases" : "compras"}</p>
                  </div>
                </div>
                {nextLevel && (
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-emerald-400 text-sm font-semibold mb-1">{nextLevel.discount}% {language === "en" ? "next" : "próximo"}</p>
                    <p className="text-gray-500 text-xs">{language === "en" ? "Need" : "Faltam"} <span className="text-white font-semibold">{10 - progressInLevel} {language === "en" ? "purchases" : "compras"}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "discount" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Big discount card */}
          <div className="rounded-3xl p-8 text-center" style={{ background: "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(8,8,10,0.75) 55%)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <p className="text-emerald-400/80 text-sm font-medium mb-4">{t.profile_current_discount}</p>
            <p className="text-white text-6xl sm:text-7xl font-bold tracking-tighter">{discount}<span className="text-2xl sm:text-3xl text-emerald-400 font-semibold">%</span></p>
            <div className="mt-4">
              <span className={`text-sm px-4 py-1.5 rounded-full border font-semibold ${currentLevel.border} ${currentLevel.color}`} style={{ background: "rgba(16,185,129,0.08)" }}>
                {currentLevel.label}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> {language === "en" ? "Progress to next level" : "Progresso para o próximo nível"}
            </h2>
            {nextLevel ? (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">{progressInLevel} / 10 {language === "en" ? "purchases" : "compras"}</span>
                  <span className="text-emerald-400 font-semibold">{nextLevel.discount}% {language === "en" ? "next" : "próximo"}</span>
                </div>
                <div className="h-4 rounded-full bg-white/5 overflow-hidden border border-white/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #10b981, #34d399)" }} />
                </div>
                <p className="text-gray-500 text-sm mt-3">
                  {language === "en" ? "Need" : "Faltam"} <span className="text-emerald-400 font-semibold">{10 - progressInLevel} {language === "en" ? "more purchases" : "compras"}</span> {language === "en" ? `to unlock ${nextLevel.discount}%` : `para liberar ${nextLevel.discount}%`}
                </p>
              </div>
            ) : (
              <div>
                <div className="h-4 rounded-full overflow-hidden border border-yellow-500/20" style={{ background: "rgba(234,179,8,0.08)" }}>
                  <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #ca8a04, #eab308)" }} />
                </div>
                <p className="text-yellow-400/90 text-sm font-semibold mt-3 uppercase tracking-wide">{language === "en" ? "Maximum level reached" : "Nível máximo atingido"}</p>
              </div>
            )}
          </div>

          {/* Levels */}
          <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> {language === "en" ? "Discount Tiers" : "Níveis de Desconto"}
            </h2>
            <div className="space-y-3">
              {levels.map((level, idx) => {
                const isUnlocked = currentLevelIdx >= idx;
                const isCurrent = currentLevelIdx === idx;
                return (
                  <div key={level.label} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isCurrent ? `border ${level.border} ${level.bg}` : isUnlocked ? `border border-white/10 bg-white/[0.02]` : `border border-white/5 opacity-40`}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlocked ? level.bg : "bg-white/5"}`}>
                        <Percent className={`w-4 h-4 ${isUnlocked ? level.color : "text-gray-600"}`} />
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${isUnlocked ? level.color : "text-gray-600"}`}>{level.discount}%</p>
                        <p className="text-white text-sm">{level.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">{level.from === 0 ? "Inicial" : `Após ${level.from} compras`}</p>
                      {isCurrent && <span className="text-xs text-emerald-400 font-semibold mt-1 block">● Atual</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "subresellers" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <SubResellersSection />
        </div>
      )}
    </div>
  );
}
