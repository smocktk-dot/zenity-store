import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Trash2, Search, Boxes, ChevronDown, ChevronUp, Clock } from "lucide-react";

export default function AdminStock() {
  const [appId, setAppId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [keys, setKeys] = useState("");
  const [search, setSearch] = useState("");
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});
  const utils = trpc.useUtils();

  const { data: apps = [] } = trpc.admin.listApps.useQuery();
  const { data: app } = trpc.admin.getApp.useQuery(
    { id: appId || 0 },
    { enabled: !!appId }
  );
  const plans = app?.plans || [];
  const { data: stock, isLoading: isLoadingStock } = trpc.admin.getStockByApp.useQuery(
    { appId: appId || 0 },
    { enabled: !!appId }
  );

  const addStock = trpc.admin.addStock.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.added} keys adicionadas ao estoque`);
      setKeys("");
      utils.admin.getStockByApp.invalidate({ appId: appId || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteStock = trpc.admin.deleteStock.useMutation({
    onSuccess: () => {
      toast.success("Key removida");
      utils.admin.getStockByApp.invalidate({ appId: appId || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !planId || !keys.trim()) return;
    addStock.mutate({ appId, planId, keys });
  };

  const selectedApp = apps.find((a: any) => a.id === appId);
  const selectedPlan = plans.find((p: any) => p.id === planId);

  const searchTerm = search.toLowerCase();
  const filteredItems = (stock?.items || []).filter((item: any) =>
    item.keyValue.toLowerCase().includes(searchTerm) ||
    (item.planName || "").toLowerCase().includes(searchTerm)
  );

  const grouped = plans.map((p: any) => {
    const items = filteredItems.filter((item: any) => item.planId === p.id);
    return { ...p, items, available: items.filter((i: any) => i.status === "available").length, sold: items.filter((i: any) => i.status === "sold").length };
  }).filter((g: any) => g.items.length > 0 || searchTerm === "");

  const togglePlan = (id: number) => {
    setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Boxes className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-white text-2xl font-bold">Estoque de Keys</h1>
          <p className="text-gray-500 text-sm mt-1">Adicione keys separadas por linha e gerencie por app/plano</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div>
          <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">App</Label>
          <Select value={appId ? String(appId) : ""} onValueChange={(v) => { setAppId(Number(v)); setPlanId(null); }}>
            <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione um app" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0c1a] border-white/10">
              {apps.map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)} className="text-white">{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Plano</Label>
          <Select value={planId ? String(planId) : ""} onValueChange={(v) => setPlanId(Number(v))} disabled={!appId}>
            <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0c1a] border-white/10">
              {plans.map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)} className="text-white">{p.name} ({p.durationDays} dias)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {appId && planId && (
        <form onSubmit={handleAdd} className="rounded-xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div>
            <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
              Keys para {selectedApp?.name} / {selectedPlan?.name}
            </Label>
            <p className="text-gray-600 text-xs mt-1">Uma key por linha</p>
            <Textarea
              value={keys}
              onChange={(e) => setKeys(e.target.value)}
              placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ"
              className="mt-2 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={addStock.isPending}
            className="text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
          >
            <Package className="w-4 h-4 mr-2" /> {addStock.isPending ? "Adicionando..." : "Adicionar ao estoque"}
          </Button>
        </form>
      )}

      {appId && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar key..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          {isLoadingStock ? (
            <p className="text-center py-10 text-gray-500">Carregando...</p>
          ) : plans.length === 0 ? (
            <p className="text-center py-10 text-gray-500">Nenhum plano para este app</p>
          ) : grouped.length === 0 && searchTerm ? (
            <p className="text-center py-10 text-gray-500">Nenhuma key encontrada</p>
          ) : (
            <div className="space-y-3">
              {grouped.map((g: any) => (
                <div key={g.id} className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <button
                    onClick={() => togglePlan(g.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-violet-400" />
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">{g.name}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {g.durationDays >= 9000 ? "Lifetime" : `${g.durationDays} dias`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-green-400 font-medium">{g.available} disp</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-blue-400 font-medium">{g.sold} vend</span>
                      </div>
                      {expandedPlans[g.id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </button>

                  {expandedPlans[g.id] && (
                    <div className="border-t border-white/5">
                      {g.items.length === 0 ? (
                        <p className="text-center py-6 text-gray-500 text-sm">Nenhuma key neste plano</p>
                      ) : (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/5">
                              {["Key", "Status", "Reseller", "Ações"].map((h) => (
                                <th key={h} className="text-left px-4 py-2 text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {g.items.map((item: any) => (
                              <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                <td className="px-4 py-2 text-gray-300 text-sm font-mono max-w-[220px] truncate" title={item.keyValue}>{item.keyValue}</td>
                                <td className="px-4 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                    item.status === "available" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  }`}>
                                    {item.status === "available" ? "Disponível" : "Vendida"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-gray-400 text-sm">{item.resellerId ? `#${item.resellerId}` : "—"}</td>
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => { if (confirm("Remover esta key do estoque?")) deleteStock.mutate({ id: item.id }); }}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
