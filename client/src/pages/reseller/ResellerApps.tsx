import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, AppWindow, Users, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ResellerApps() {
  const [, navigate] = useLocation();
  const { data: apps = [], isLoading } = trpc.reseller.myApps.useQuery();
  const [search, setSearch] = useState("");

  const filtered = apps.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.categoryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your applications and services</p>
        </div>
        <span className="text-gray-500 text-sm">{apps.length} applications</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-center py-12">Carregando apps...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <AppWindow className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">Nenhum app disponível</p>
          <p className="text-gray-600 text-sm mt-1">Aguarde o admin atribuir apps à sua conta</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app: any) => (
            <button
              key={app.id}
              onClick={() => navigate(`/reseller/apps/${app.id}`)}
              className="rounded-xl border border-white/5 p-5 text-left hover:border-white/15 hover:bg-white/[0.03] transition-all group"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 border border-purple-500/20 flex items-center justify-center">
                    <AppWindow className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{app.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500 font-mono">{app.version}</span>
                      {app.categoryName && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{app.categoryName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${app.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                  {app.status === "active" ? "Active" : app.status}
                </span>
              </div>

              <p className="text-gray-500 text-xs mb-4 line-clamp-2">{app.description || "Sem descrição"}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{app.totalKeys || 0} keys geradas</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 group-hover:text-red-400 transition-colors text-xs">
                  Ver detalhes <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
