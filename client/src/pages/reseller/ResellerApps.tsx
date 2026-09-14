import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Search, AppWindow, ArrowRight, ShieldCheck, Tag, Zap,
  Layers, ChevronRight, CheckCircle2, Box, Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";

export default function ResellerApps() {
  const [, navigate] = useLocation();
  const { data: apps = [], isLoading } = trpc.reseller.myApps.useQuery();
  const { data: profile } = trpc.reseller.profile.useQuery();
  const [search, setSearch] = useState("");
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();

  const discount = parseFloat(String(profile?.discountPercent ?? "0"));
  const resellerType = profile?.resellerType ?? "credits";

  const filtered = apps.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase()) ||
    a.categoryName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPlans = apps.reduce((acc: number, curr: any) => acc + (curr.plans?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.apps_title || "Aplicações Disponíveis"}
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              {apps.length} {apps.length === 1 ? "aplicação autorizada" : "aplicações autorizadas"}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Selecione um software para emitir licenças, consultar planos e gerenciar downloads
          </p>
        </div>

        {/* Busca Compacta */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou função..."
            className="pl-9 h-9 text-xs rounded-xl bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Barra de Métricas / Status Corporativo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Softwares Vinculados</p>
            <p className="text-white font-bold text-sm leading-tight mt-0.5">{apps.length} disponíveis</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Opções de Duração</p>
            <p className="text-white font-bold text-sm leading-tight mt-0.5">{totalPlans} planos configurados</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status do Sistema</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <p className="text-emerald-400 font-semibold text-xs leading-none">Operacional (100%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Softwares */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3 text-gray-500">
            <AppWindow className="w-6 h-6" />
          </div>
          <p className="text-white text-sm font-semibold">{t.apps_no_apps || "Nenhuma aplicação atribuída"}</p>
          <p className="text-gray-400 text-xs mt-1">
            {language === "en"
              ? "Wait for the administrator to assign applications to your account."
              : "Aguarde o administrador vincular softwares à sua conta de revendedor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app: any) => {
            const plans = app.plans || [];
            // Acha o menor preço para exibir "A partir de"
            let lowestPrice: number | null = null;
            if (plans.length > 0) {
              const prices = plans.map((p: any) => {
                if (resellerType === "credits") {
                  return parseFloat(String(p.priceCredits ?? "0")) * (1 - discount / 100);
                } else {
                  return parseFloat(String(p.pricePercentage ?? "0")) * (1 - discount / 100);
                }
              }).filter((val: number) => !isNaN(val) && val > 0);
              if (prices.length > 0) lowestPrice = Math.min(...prices);
            }

            return (
              <div
                key={app.id}
                onClick={() => navigate(`/reseller/apps/${app.id}`)}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-emerald-500/[0.02] hover:border-emerald-500/35 transition-all cursor-pointer p-5 flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Top Bar do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                        <AppWindow className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-emerald-300 transition-colors">
                            {app.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                          {app.version || "v1.0"}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Ativo
                    </span>
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed min-h-[32px] mb-4">
                    {app.description || "Sem descrição informada para este software."}
                  </p>

                  {/* Informações de Planos */}
                  <div className="py-2.5 px-3 rounded-xl bg-black/30 border border-white/[0.04] mb-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{plans.length} {plans.length === 1 ? "plano" : "planos"}</span>
                    </div>

                    {lowestPrice !== null && (
                      <div className="text-right">
                        <span className="text-gray-500 text-[10px] mr-1">a partir de</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">
                          {resellerType === "credits" ? `${lowestPrice.toFixed(2)} cr` : fmt(lowestPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Ação */}
                <Button
                  size="sm"
                  className="w-full h-9 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-emerald-500 group-hover:bg-emerald-500 group-hover:text-black border border-white/[0.08] group-hover:border-transparent text-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>Acessar Painel do App</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
