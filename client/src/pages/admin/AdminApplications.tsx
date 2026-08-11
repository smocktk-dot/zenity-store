import { useState, useRef, useEffect } from "react";
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
import {
  Archive,
  CheckCircle,
  Trash2,
  Eye,
  Send,
  ArrowLeft,
  UserPlus,
  Search,
  MessageSquare,
  X,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminApplications() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [chatText, setChatText] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: applications = [], isLoading } = trpc.admin.listResellerApplications.useQuery();
  const { data: detail, isLoading: isLoadingDetail } = trpc.admin.getResellerApplication.useQuery(
    { id: selectedId || 0 },
    { enabled: !!selectedId }
  );

  const sendMessage = trpc.admin.sendApplicationMessageAdmin.useMutation({
    onSuccess: () => {
      setChatText("");
      utils.admin.getResellerApplication.invalidate({ id: selectedId || 0 });
      utils.admin.listResellerApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.admin.updateResellerApplicationStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.admin.listResellerApplications.invalidate();
      utils.admin.getResellerApplication.invalidate({ id: selectedId || 0 });
      setNewStatus(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteApp = trpc.admin.deleteResellerApplication.useMutation({
    onSuccess: () => {
      toast.success("Aplicação excluída");
      setSelectedId(null);
      utils.admin.listResellerApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() || !selectedId) return;
    sendMessage.mutate({ applicationId: selectedId, message: chatText.trim() });
  };

  const filtered = applications.filter((a: any) => {
    const matchesFilter = filter === "all" ? true : a.status === filter;
    const matchesSearch =
      (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.discordId || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.reason || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pre_approved: "bg-green-500/20 text-green-400 border-green-500/30",
    approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    pre_approved: "Pré-aprovado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    archived: "Arquivado",
  };

  if (selectedId && detail) {
    return (
      <div className="p-6 h-[calc(100vh-60px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">Aplicação #{detail.id}</h1>
              <p className="text-gray-500 text-xs">{detail.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={newStatus || detail.status}
              onValueChange={(v) => {
                setNewStatus(v);
                updateStatus.mutate({ id: detail.id, status: v as any });
              }}
            >
              <SelectTrigger className="w-[160px] h-9 text-white bg-white/5 border-white/10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c1a] border-white/10">
                <SelectItem value="pending" className="text-white">Pendente</SelectItem>
                <SelectItem value="pre_approved" className="text-white">Pré-aprovado</SelectItem>
                <SelectItem value="approved" className="text-white">Aprovado</SelectItem>
                <SelectItem value="rejected" className="text-white">Rejeitado</SelectItem>
                <SelectItem value="archived" className="text-white">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => { if (confirm("Deseja excluir esta aplicação?")) deleteApp.mutate({ id: detail.id }); }}
              className="h-9 px-3 text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
              title="Deletar aplicação"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Discord Link</p>
            <a href={detail.discordLink} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm break-all hover:underline">{detail.discordLink}</a>
          </div>
          <div className="rounded-xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Discord ID</p>
            <p className="text-white text-sm font-mono">{detail.discordId}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 p-4 mb-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Motivo</p>
          <p className="text-white text-sm leading-relaxed">{detail.reason}</p>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2"
          style={{ maxHeight: "calc(100% - 300px)" }}
        >
          {detail.messages?.map((msg: any) => {
            const isAdmin = msg.senderType === "admin";
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${isAdmin ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={{
                    background: isAdmin ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.1))" : "rgba(255,255,255,0.05)",
                    border: isAdmin ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-[10px] text-gray-500 mb-0.5 font-semibold uppercase">{isAdmin ? "Admin" : "Candidato"}</p>
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] text-gray-500 mt-1.5 text-right">{formatDate(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {detail.status !== "archived" && detail.status !== "rejected" ? (
          <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-end gap-2">
              <Textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Responda ao candidato..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[60px] resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
              />
              <Button
                type="submit"
                disabled={sendMessage.isPending || !chatText.trim()}
                className="h-[60px] w-12 p-0 text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-center text-gray-500 text-sm py-4 border-t border-white/5">Chat encerrado.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Aplicações de Reseller</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie candidatos e converse com eles</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] h-9 text-white bg-white/5 border-white/10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0c1a] border-white/10">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="pending" className="text-white">Pendente</SelectItem>
              <SelectItem value="pre_approved" className="text-white">Pré-aprovado</SelectItem>
              <SelectItem value="approved" className="text-white">Aprovado</SelectItem>
              <SelectItem value="rejected" className="text-white">Rejeitado</SelectItem>
              <SelectItem value="archived" className="text-white">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email, discord ID ou motivo..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
        />
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        {isLoading ? (
          <p className="text-center py-10 text-gray-500">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <UserPlus className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-gray-500 text-sm">Nenhuma aplicação encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["ID", "Email", "Discord ID", "Status", "Data", "Ações"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">#{a.id}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{a.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{a.discordId}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[a.status]}`}>
                      {statusLabel[a.status] || a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedId(a.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                        title="Abrir chat"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: a.id, status: a.status === "archived" ? "pending" : "archived" })}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                        title={a.status === "archived" ? "Reabrir" : "Arquivar"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: a.id, status: "pre_approved" })}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                        title="Pré-aprovar"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Deseja excluir esta aplicação?")) deleteApp.mutate({ id: a.id }); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Deletar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
