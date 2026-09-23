import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, User, Key, AlertTriangle, CheckCircle2, ArrowRight, Filter } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "Todas as keys" },
  { value: "active", label: "Apenas ativas" },
  { value: "used", label: "Apenas usadas" },
  { value: "revoked", label: "Apenas revogadas" },
  { value: "expired", label: "Apenas expiradas" },
];

export default function AdminTransferKeys() {
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const utils = trpc.useUtils();

  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const statusFilter = status === "all" ? undefined : (status as "active" | "used" | "revoked" | "expired");

  const { data: fromCount } = trpc.admin.resellerKeyCount.useQuery(
    { resellerId: Number(fromId) || 0, status: statusFilter },
    { enabled: !!fromId }
  );

  const transfer = trpc.admin.transferKeys.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.transferred} ${data.transferred === 1 ? "key transferida" : "keys transferidas"} com sucesso!`);
      utils.admin.resellerKeyCount.invalidate();
      utils.admin.listAllKeys.invalidate();
      setFromId("");
      setToId("");
      setStatus("all");
    },
    onError: (e) => toast.error(e.message),
  });

  const fromReseller = resellers.find((r: any) => String(r.id) === fromId);
  const toReseller = resellers.find((r: any) => String(r.id) === toId);
  const sameReseller = !!fromId && fromId === toId;
  const canSubmit = !!fromId && !!toId && !sameReseller && !transfer.isPending;

  const resellerLabel = (r: any) =>
    `${r.username} — ${r.resellerType === "percentage" ? "Porcentagem" : r.resellerType === "other" ? "Other Store" : r.resellerType === "unlimited" ? "Unlimited" : "Créditos"}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sameReseller) {
      toast.error("Origem e destino não podem ser o mesmo revendedor");
      return;
    }
    if (!fromId || !toId) {
      toast.error("Selecione os revendedores de origem e destino");
      return;
    }
    transfer.mutate({
      fromResellerId: Number(fromId),
      toResellerId: Number(toId),
      status: statusFilter,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Transferência de Keys</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              Migração em Massa
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Transfira todas as licenças de um revendedor para outro — as keys aparecem em "Minhas Keys" do destino
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Origem (de quem sai) *
              </Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecione a origem..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  {resellers.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                      {resellerLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:flex items-center justify-center pb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Destino (quem recebe) *
              </Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Selecione o destino..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                  {resellers
                    .filter((r: any) => String(r.id) !== fromId)
                    .map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                        {resellerLabel(r)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Filtro de Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-black/30 border-white/[0.1] text-white text-xs h-10 rounded-xl">
                <SelectValue placeholder="Todas as keys" />
              </SelectTrigger>
              <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white text-xs">
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview da contagem */}
          {!!fromId && (
            <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Keys na origem</p>
                <p className={`font-mono text-xs font-semibold mt-0.5 ${fromCount?.count ? "text-emerald-400" : "text-red-400"}`}>
                  {fromCount === undefined
                    ? "Contando..."
                    : `${fromCount.count} ${fromCount.count === 1 ? "key encontrada" : "keys encontradas"}`}
                </p>
              </div>
              <Filter className="w-4 h-4 text-gray-600" />
            </div>
          )}

          {/* Aviso */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              A transferência é imediata e move a propriedade das licenças para o revendedor de destino.
              As keys passam a aparecer no painel "Minhas Keys" do destinatário e saem do painel da origem.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-10 px-6 font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0 shadow-sm flex items-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {transfer.isPending ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </div>
        </form>

        {/* Resumo Lateral */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider flex items-center gap-2 text-gray-400 font-semibold">
              <Key className="w-3.5 h-3.5 text-emerald-400" /> Resumo da Transferência
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">De:</span>
                <span className="text-white font-medium flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-500" />
                  {fromReseller?.username || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Para:</span>
                <span className="text-white font-medium flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-500" />
                  {toReseller?.username || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Filtro:</span>
                <span className="text-white font-medium">
                  {STATUS_OPTIONS.find(o => o.value === status)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <span className="text-gray-500">Keys a mover:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {fromCount?.count ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Execução:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Imediata
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-[11px] text-gray-400 leading-relaxed">
              O histórico de cada licença (app, plano, data de criação, HWID) é preservado — apenas o dono da key é alterado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
