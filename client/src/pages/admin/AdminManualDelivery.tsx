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
import { Send, User, Package, Key, ArrowRight } from "lucide-react";

export default function AdminManualDelivery() {
  const [resellerId, setResellerId] = useState<string>("");
  const [appId, setAppId] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const [keyValue, setKeyValue] = useState("");
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();

  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const { data: apps = [] } = trpc.admin.listApps.useQuery();
  const { data: app } = trpc.admin.getApp.useQuery(
    { id: Number(appId) || 0 },
    { enabled: !!appId }
  );
  const { data: nextStock } = trpc.admin.getAvailableStockForPlan.useQuery(
    { appId: Number(appId) || 0, planId: Number(planId) || 0 },
    { enabled: !!appId && !!planId }
  );

  const deliver = trpc.admin.manualDeliverKey.useMutation({
    onSuccess: () => {
      toast.success("Key entregue ao reseller!");
      setKeyValue("");
      setNote("");
      utils.admin.getAvailableStockForPlan.invalidate({ appId: Number(appId) || 0, planId: Number(planId) || 0 });
      utils.admin.getStockByApp.invalidate({ appId: Number(appId) || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedReseller = resellers.find((r: any) => String(r.id) === resellerId);
  const selectedApp = apps.find((a: any) => String(a.id) === appId);
  const selectedPlan = app?.plans?.find((p: any) => String(p.id) === planId);

  const handleUseStock = () => {
    if (!nextStock?.[0]) {
      toast.error("Nenhuma key em estoque para este plano");
      return;
    }
    setKeyValue(nextStock[0].keyValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resellerId || !appId || !planId || !keyValue.trim()) return;

    const stockItem = nextStock?.[0];
    const stockId = stockItem && stockItem.keyValue === keyValue.trim() ? stockItem.id : undefined;

    deliver.mutate({
      resellerId: Number(resellerId),
      appId: Number(appId),
      planId: Number(planId),
      keyValue: keyValue.trim(),
      stockId,
      note: note || undefined,
    });
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Send className="w-6 h-6 text-violet-400" />
        <div>
          <h1 className="text-white text-2xl font-bold">Entrega Manual de Keys</h1>
          <p className="text-gray-500 text-sm mt-1">Envie uma key diretamente para um reseller, do estoque ou colando manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div>
          <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Reseller</Label>
          <Select value={resellerId} onValueChange={setResellerId}>
            <SelectTrigger className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white">
              <SelectValue placeholder="Selecione um reseller" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
              {resellers.map((r: any) => (
                <SelectItem key={r.id} value={String(r.id)} className="text-white">{r.username} ({r.resellerType})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedReseller && (
            <p className="text-gray-500 text-xs mt-1">Tipo: <span className="text-gray-300">{selectedReseller.resellerType}</span> · Compras: <span className="text-gray-300">{selectedReseller.totalPurchases}</span></p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">App</Label>
            <Select value={appId} onValueChange={(v) => { setAppId(v); setPlanId(""); setKeyValue(""); }}>
              <SelectTrigger className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white">
                <SelectValue placeholder="Selecione um app" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
                {apps.map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)} className="text-white">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Plano</Label>
            <Select value={planId} onValueChange={(v) => { setPlanId(v); setKeyValue(""); }} disabled={!appId}>
              <SelectTrigger className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white">
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
                {app?.plans?.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)} className="text-white">{p.name} ({p.durationDays}d)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!!appId && !!planId && (
          <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Próxima key no estoque</p>
              <Button
                type="button"
                onClick={handleUseStock}
                disabled={!nextStock?.[0]}
                className="h-7 text-xs text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}
              >
                <Package className="w-3 h-3 mr-1" /> Usar do estoque
              </Button>
            </div>
            {nextStock?.[0] ? (
              <p className="text-gray-300 text-sm font-mono mt-2 break-all">{nextStock[0].keyValue}</p>
            ) : (
              <p className="text-red-400 text-xs mt-2">Sem estoque para este plano. Cole a key manualmente.</p>
            )}
          </div>
        )}

        <div>
          <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Key</Label>
          <Input
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="Cole aqui a key ou clique em 'Usar do estoque'"
            className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white font-mono"
            required
          />
        </div>

        <div>
          <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Observação (opcional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota interna sobre a entrega..."
            className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600"
          />
        </div>

        <Button
          type="submit"
          disabled={deliver.isPending}
          className="w-full text-white"
          style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}
        >
          <Send className="w-4 h-4 mr-2" /> {deliver.isPending ? "Entregando..." : "Entregar key"}
        </Button>
      </form>
    </div>
  );
}
