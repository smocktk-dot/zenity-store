import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Coins, Percent, Package, Plus, Trash2,
  CheckCircle2, Circle, User, Calendar, CreditCard, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminResellerDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: resellerApps, isLoading } = trpc.admin.getResellerApps.useQuery({ resellerId: id });
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const reseller = resellers.find((r: any) => r.id === id);

  const [discount, setDiscount] = useState<string>("");

  const assignApp = trpc.admin.assignApp.useMutation({
    onSuccess: () => {
      toast.success("App adicionado ao reseller!");
      utils.admin.getResellerApps.invalidate({ resellerId: id });
    },
    onError: e => toast.error(e.message),
  });

  const removeApp = trpc.admin.removeApp.useMutation({
    onSuccess: () => {
      toast.success("App removido do reseller!");
      utils.admin.getResellerApps.invalidate({ resellerId: id });
    },
    onError: e => toast.error(e.message),
  });

  const updateReseller = trpc.admin.updateReseller.useMutation({
    onSuccess: () => {
      toast.success("Desconto atualizado!");
      utils.admin.listResellers.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const assigned: number[] = resellerApps?.assigned ?? [];
  const allApps: any[] = resellerApps?.all ?? [];
  const assignedApps = allApps.filter(a => assigned.includes(a.id));
  const availableApps = allApps.filter(a => !assigned.includes(a.id));

  const isCredits = !reseller?.resellerType || reseller?.resellerType === "credits";
  const currentDiscount = parseFloat(reseller?.discountPercent ?? "0");
  const discountValue = discount === "" ? currentDiscount.toFixed(0) : discount;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/resellers")}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-lg">
            {reseller?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">{reseller?.username ?? `Reseller #${id}`}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isCredits ? (
                <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                  <Coins className="w-3 h-3" /> Créditos
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  <Percent className="w-3 h-3" /> Porcentagem
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${reseller?.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                {reseller?.status ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {reseller && (
          <div className="ml-auto flex items-center gap-4 text-sm">
            {isCredits && (
              <div className="text-right">
                <p className="text-gray-500 text-xs">Créditos</p>
                <p className="text-yellow-400 font-bold font-mono">{parseFloat(reseller.credits ?? "0").toFixed(2)}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-gray-500 text-xs">Compras</p>
              <p className="text-white font-bold">{reseller.totalPurchases ?? 0}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Desconto</p>
              <p className="text-green-400 font-bold">{reseller.discountPercent ?? 0}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Info do tipo de reseller */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${isCredits ? "border-yellow-500/20 bg-yellow-500/5" : "border-purple-500/20 bg-purple-500/5"}`}>
        {isCredits ? (
          <>
            <CreditCard className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">Reseller de Créditos</p>
              <p className="text-gray-500 text-xs mt-0.5">Este reseller usa o sistema de créditos. Ele gera keys descontando do saldo de créditos com desconto progressivo (35% → 40% → 50%).</p>
            </div>
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-purple-400 font-semibold text-sm">Reseller de Porcentagem</p>
              <p className="text-gray-500 text-xs mt-0.5">Este reseller usa o sistema de porcentagem. Ele compra keys pelo preço em R$ com desconto progressivo (35% → 40% → 50%).</p>
            </div>
          </>
        )}
      </div>

      {/* Configurar desconto */}
      {reseller && (
        <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-white font-semibold text-sm">Desconto do reseller</h3>
              <p className="text-gray-500 text-xs mt-0.5">Modifique o percentual de desconto aplicado nas compras deste reseller.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountValue}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 bg-white/5 border-white/10 text-white text-center"
              />
              <span className="text-gray-400 text-sm">%</span>
              <Button
                onClick={() => {
                  const value = parseFloat(discountValue);
                  if (isNaN(value) || value < 0 || value > 100) {
                    toast.error("Desconto deve ser entre 0 e 100");
                    return;
                  }
                  updateReseller.mutate({ id, discountPercent: value });
                }}
                disabled={updateReseller.isPending}
                className="text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
              >
                {updateReseller.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Apps Atribuídos ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Apps Atribuídos
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-mono">
                {assignedApps.length}
              </span>
            </h2>
          </div>

          {assignedApps.length === 0 ? (
            <div className="rounded-xl border border-white/5 p-8 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Nenhum app atribuído ainda</p>
              <p className="text-gray-700 text-xs mt-1">Adicione apps da coluna ao lado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedApps.map((app: any) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-green-500/10 p-3.5 bg-green-500/5 flex items-center justify-between group hover:border-green-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{app.name}</p>
                      <p className="text-gray-600 text-xs">{app.description || "Sem descrição"} · v{app.version || "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Remover "${app.name}" deste reseller?`)) removeApp.mutate({ resellerId: id, appId: app.id }); }}
                    disabled={removeApp.isPending}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Apps Disponíveis para Adicionar ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-500" />
              Apps Disponíveis
              <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                {availableApps.length}
              </span>
            </h2>
          </div>

          {availableApps.length === 0 ? (
            <div className="rounded-xl border border-white/5 p-8 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Todos os apps foram atribuídos!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableApps.map((app: any) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-white/5 p-3.5 flex items-center justify-between group hover:border-white/10 hover:bg-white/[0.02] transition-all"
                  style={{ background: "rgba(255,255,255,0.01)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-300 font-medium text-sm">{app.name}</p>
                      <p className="text-gray-600 text-xs">{app.description || "Sem descrição"} · v{app.version || "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => assignApp.mutate({ resellerId: id, appId: app.id })}
                    disabled={assignApp.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/10 text-green-400 border border-green-500/20 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
