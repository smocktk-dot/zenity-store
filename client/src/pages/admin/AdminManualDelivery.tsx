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
import { Send, User, Package, Key, ArrowRight, ShieldCheck, CheckCircle2, Zap } from "lucide-react";

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
      toast.success("Chave entregue com sucesso ao revendedor!");
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
      toast.error("Nenhuma key disponível no estoque para este plano");
      return;
    }
    setKeyValue(nextStock[0].keyValue);
    toast.success("Chave puxada do estoque com sucesso!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resellerId || !appId || !planId || !keyValue.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

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
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header Corporativo */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Entrega Manual de Licenças</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              Despacho Direto
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Transfira uma licença diretamente para o painel de um revendedor selecionado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 shadow-sm">
          <div>
            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Destinatário (Reseller) *
            </Label>
            <Select value={resellerId} onValueChange={setResellerId}>
              <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl">
                <SelectValue placeholder="Selecione o revendedor de destino..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                {resellers.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                    {r.username} — {r.resellerType === "percentage" ? "Porcentagem" : r.resellerType === "other" ? "Other Store" : r.resellerType === "unlimited" ? "Unlimited" : "Créditos"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Software (App) *
              </Label>
              <Select value={appId} onValueChange={(v) => { setAppId(v); setPlanId(""); setKeyValue(""); }}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecione o app..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  {apps.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)} className="text-xs">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Plano de Duração *
              </Label>
              <Select value={planId} onValueChange={(v) => { setPlanId(v); setKeyValue(""); }} disabled={!appId}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl disabled:opacity-40">
                  <SelectValue placeholder={!appId ? "Escolha o app primeiro" : "Selecione o plano..."} />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  {app?.plans?.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name} ({p.durationDays >= 9000 ? "Lifetime" : `${p.durationDays}d`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opção de Estoque Automático */}
          {!!appId && !!planId && (
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Estoque do Plano</p>
                {nextStock?.[0] ? (
                  <p className="text-emerald-400 font-mono text-xs font-semibold mt-0.5">
                    {nextStock.length} {nextStock.length === 1 ? "chave disponível" : "chaves disponíveis"}
                  </p>
                ) : (
                  <p className="text-red-400 text-xs mt-0.5">Sem chaves prontas em estoque</p>
                )}
              </div>

              {nextStock?.[0] && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUseStock}
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                >
                  <Package className="w-3.5 h-3.5 mr-1.5" /> Puxar do Estoque
                </Button>
              )}
            </div>
          )}

          <div>
            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Chave de Licença (Key) *
            </Label>
            <Input
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="Digite a chave ou clique em 'Puxar do Estoque'..."
              className="bg-black/30 border-white/[0.1] text-white font-mono rounded-xl h-10 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Observação Interna (Opcional)
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Entrega de cortesia / bonificação de metas..."
              className="bg-black/30 border-white/[0.1] text-white rounded-xl min-h-[80px] text-xs resize-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={deliver.isPending || !resellerId || !appId || !planId || !keyValue.trim()}
              className="h-10 px-6 font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0 shadow-sm flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {deliver.isPending ? "Processando Entrega..." : "Confirmar e Entregar Key"}
            </Button>
          </div>
        </form>

        {/* Resumo Lateral de Despacho */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 space-y-4">
            <h3 className="text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 text-gray-400">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Resumo do Despacho
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Destinatário:</span>
                <span className="text-white font-medium">{selectedReseller?.username || "—"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Software:</span>
                <span className="text-white font-medium">{selectedApp?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Plano:</span>
                <span className="text-white font-medium">{selectedPlan?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status Entrega:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Imediata
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-[11px] text-gray-400 leading-relaxed">
              Ao confirmar, a chave será vinculada instantaneamente à conta do revendedor e registrada no histórico de logs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
