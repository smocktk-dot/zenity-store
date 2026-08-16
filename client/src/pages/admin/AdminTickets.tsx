import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Image,
  X,
  ArrowLeft,
  Ticket,
  MessageSquare,
  Search,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminTickets() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [chatText, setChatText] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [chatImageName, setChatImageName] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: tickets = [], isLoading } = trpc.admin.listTickets.useQuery();
  const { data: ticketDetail, isLoading: isLoadingDetail } = trpc.admin.getTicket.useQuery(
    { id: selectedTicketId || 0 },
    { enabled: !!selectedTicketId }
  );

  const sendMessage = trpc.admin.sendTicketMessage.useMutation({
    onSuccess: () => {
      setChatText("");
      setChatImage(null);
      setChatImageName(null);
      utils.admin.getTicket.invalidate({ id: selectedTicketId || 0 });
      utils.admin.listTickets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.admin.updateTicketStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado");
      utils.admin.listTickets.invalidate();
      utils.admin.getTicket.invalidate({ id: selectedTicketId || 0 });
      setNewStatus(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteTicket = trpc.admin.deleteTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket excluído");
      setSelectedTicketId(null);
      utils.admin.listTickets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketDetail?.messages]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    const base64 = await fileToBase64(file);
    setChatImage(base64);
    setChatImageName(file.name);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() && !chatImage) return;
    sendMessage.mutate({
      ticketId: selectedTicketId || 0,
      message: chatText.trim() || " ",
      imageBase64: chatImage || undefined,
    });
  };

  const filtered = tickets.filter((t: any) => {
    const matchesFilter = filter === "all" ? true : t.status === filter;
    const matchesSearch =
      (t.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.resellerUsername || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusColor: Record<string, string> = {
    open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    closed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const statusLabel: Record<string, string> = {
    open: "Aberto",
    closed: "Fechado",
    archived: "Arquivado",
  };

  if (selectedTicketId && ticketDetail) {
    return (
      <div className="p-6 h-[calc(100vh-60px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedTicketId(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">{ticketDetail.subject}</h1>
              <p className="text-gray-500 text-xs">
                Ticket #{ticketDetail.id} · Reseller: <span className="text-violet-400">{ticketDetail.resellerUsername}</span> · {formatDate(ticketDetail.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={newStatus || ticketDetail.status}
              onValueChange={(v) => {
                setNewStatus(v);
                updateStatus.mutate({ id: ticketDetail.id, status: v as any });
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-white bg-white/[0.03] border-white/[0.06] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
                <SelectItem value="open" className="text-white">Aberto</SelectItem>
                <SelectItem value="closed" className="text-white">Fechado</SelectItem>
                <SelectItem value="archived" className="text-white">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (confirm("Deseja excluir este ticket?")) deleteTicket.mutate({ id: ticketDetail.id });
              }}
              className="h-9 px-3 text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-emerald-500/20"
              title="Deletar ticket"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2"
          style={{ maxHeight: "calc(100% - 140px)" }}
        >
          {ticketDetail.messages?.map((msg: any) => {
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${isAdmin ? "text-violet-400" : "text-yellow-400"}`}>
                        {isAdmin ? "Admin" : ticketDetail.resellerUsername}
                      </span>
                    </div>
                    <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                        <img
                          src={msg.imageUrl}
                          alt="Anexo"
                          className="max-w-full max-h-60 rounded-lg object-contain border border-white/[0.06]"
                        />
                      </a>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1.5 text-right">{formatDate(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {ticketDetail.status !== "archived" ? (
            <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-white/[0.04]">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Responda ao reseller..."
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600 min-h-[60px] resize-none"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  />
                  {chatImageName && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-violet-400">
                      <Image className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{chatImageName}</span>
                      <button type="button" onClick={() => { setChatImage(null); setChatImageName(null); }} className="text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={chatFileInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="h-10 w-10 p-0 border-white/[0.06] text-gray-400 hover:text-violet-400 hover:bg-white/[0.03]"
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendMessage.isPending || (!chatText.trim() && !chatImage)}
                    className="h-10 w-10 p-0 text-white"
                    style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4 border-t border-white/[0.04]">Este ticket está arquivado.</p>
          )}
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os tickets abertos pelos resellers</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-9 text-white bg-white/[0.03] border-white/[0.06] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
                <SelectItem value="all" className="text-white">Todos</SelectItem>
                <SelectItem value="open" className="text-white">Abertos</SelectItem>
                <SelectItem value="closed" className="text-white">Fechados</SelectItem>
                <SelectItem value="archived" className="text-white">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por assunto ou reseller..."
            className="pl-9 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600"
          />
        </div>

        <div className="rounded-3xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {isLoading ? (
            <p className="text-center py-10 text-gray-500">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <Ticket className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-500 text-sm">Nenhum ticket encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Assunto", "Reseller", "Status", "Última atualização", "Ações"].map((h) => (
                    <th key={h} className="text-left px-5 py-4 text-gray-400 text-xs font-semibold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-white text-sm font-medium">{t.subject}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm">{t.resellerUsername}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[t.status]}`}>
                        {statusLabel[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{formatDate(t.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTicketId(t.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                          title="Entrar no chat"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: t.id, status: t.status === "archived" ? "open" : "archived" })}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                          title={t.status === "archived" ? "Reabrir" : "Arquivar"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ id: t.id, status: "closed" })}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Fechar"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Deseja excluir este ticket?")) deleteTicket.mutate({ id: t.id }); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-emerald-500/10 transition-all"
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
