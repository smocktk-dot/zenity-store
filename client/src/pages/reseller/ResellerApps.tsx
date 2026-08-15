import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, AppWindow, Users, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResellerApps() {
  const [, navigate] = useLocation();
  const { data: apps = [], isLoading } = trpc.reseller.myApps.useQuery();
  const [search, setSearch] = useState("");
  const { t, language } = useLanguage();

  const filtered = apps.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.categoryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t.apps_title}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.apps_subtitle}</p>
        </div>
        <span className="text-gray-500 text-sm">{apps.length} {language === "en" ? "applications" : "aplicações"}</span>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={language === "en" ? "Search applications..." : "Buscar aplicações..."} className="pl-11 h-12 rounded-2xl bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600 focus:border-emerald-500/50" />
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-center py-16 text-sm animate-pulse">{t.apps_loading}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-3xl border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <AppWindow className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-medium">{t.apps_no_apps}</p>
          <p className="text-gray-600 text-sm mt-1">{language === "en" ? "Wait for the admin to assign apps to your account" : "Aguarde o admin atribuir apps à sua conta"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((app: any) => (
            <button
              key={app.id}
              onClick={() => navigate(`/reseller/apps/${app.id}`)}
              className="group rounded-3xl border border-white/[0.06] p-6 text-left hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-blue-500/15 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                    <AppWindow className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">{app.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-500 font-mono border border-white/[0.04]">{app.version}</span>
                      {app.categoryName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-500 border border-white/[0.04]">{app.categoryName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${app.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                  {app.status === "active" ? t.general_active : app.status}
                </span>
              </div>

              <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed">{app.description || t.general_no_description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <span>{app.totalKeys || 0} {language === "en" ? "keys" : "keys"}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium group-hover:translate-x-1 transition-transform">
                  {language === "en" ? "View details" : "Ver detalhes"} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
