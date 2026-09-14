import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Send, Image, X, ArrowLeft, Ticket, Clock, ChevronRight, Search } from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
  if (isToday) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function relativeTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const now = new Date();
  const date = new Date(d);
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "Agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return date.toLocaleDateString("pt-BR");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ResellerTickets() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [chatImageName, setChatImageName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: tickets = [], isLoading } = trpc.reseller.myTickets.useQuery();
  const { data: ticketDetail, isLoading: isLoadingDetail } = trpc.reseller.getTicket.useQuery(
    { id: selectedTicketId || 0 },
    { enabled: !!selectedTicketId }
  );

  const createTicket = trpc.reseller.createTicket.useMutation({
    onSuccess: (data) => {
      toast.success("Ticket aberto!");
      setOpenNew(false);
      setSubject("");
      setMessage("");
      setImageBase64(null);
      setImageName(null);
      utils.reseller.myTickets.invalidate();
      setSelectedTicketId(data.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const sendMessage = trpc.reseller.sendTicketMessage.useMutation({
    onSuccess: () => {
      setChatText("");
      setChatImage(null);
      setChatImageName(null);
      utils.reseller.getTicket.invalidate({ id: selectedTicketId || 0 });
      utils.reseller.myTickets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketDetail?.messages]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, setImg: (v: string | null) => void, setName: (v: string | null) => void) => {
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
    setImg(base64);
    setName(file.name);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createTicket.mutate({
      subject: subject.trim(),
      message: message.trim(),
      imageBase64: imageBase64 || undefined,
    });
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

  const statusColor: Record<string, string> = {
    open: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25",
    closed: "bg-amber-500/12 text-amber-400 border-amber-500/25",
    archived: "bg-slate-500/12 text-slate-400 border-slate-500/25",
  };

  const statusDot: Record<string, string> = {
    open: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    closed: "bg-amber-400",
    archived: "bg-slate-400",
  };

  const statusLabel: Record<string, string> = {
    open: "Aberto",
    closed: "Fechado",
    archived: "Arquivado",
  };

  const filtered = tickets.filter((t: any) =>
    (t.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  // ─── Chat view ───────────────────────────────────────────────────────────────
  if (selectedTicketId && ticketDetail) {
    return (
      <div className="p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/[0.06]">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-white/[0.06] hover:border-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 shrink-0">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg md:text-xl font-semibold truncate">{ticketDetail.subject}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span>Ticket #{ticketDetail.id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>{formatDate(ticketDetail.createdAt)}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${statusColor[ticketDetail.status]}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot[ticketDetail.status]}`} />
            {statusLabel[ticketDetail.status] || ticketDetail.status}
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-1"
          style={{ maxHeight: "calc(100% - 160px)" }}
        >
          {ticketDetail.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-700" />
              <p className="text-sm">Nenhuma mensagem ainda. Envie a primeira.</p>
            </div>
          ) : (
            ticketDetail.messages?.map((msg: any, index: number) => {
              const isReseller = msg.senderType === "reseller";
              const prev = ticketDetail.messages[index - 1];
              const showDate = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-5">
                      <div className="px-3 py-1 rounded-full text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.06]">
                        {new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                    </div>
                  )}
                  <div className={`flex ${isReseller ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-end gap-3 max-w-[90%] md:max-w-[75%]">
                      {!isReseller && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-violet-900/20 border border-violet-500/20 text-[10px] font-bold text-violet-300 shrink-0 mb-6 hidden md:flex">
                          AD
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-[11px] font-semibold ${isReseller ? "text-emerald-400" : "text-violet-400"}`}>
                            {isReseller ? "Você" : "Suporte"}
                          </span>
                          <span className="text-[10px] text-gray-600">{formatShortDate(msg.createdAt)}</span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 ${isReseller ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                          style={{
                            background: isReseller
                              ? "linear-gradient(135deg, rgba(16,185,129,0.20), rgba(5,150,105,0.10))"
                              : "rgba(255,255,255,0.05)",
                            border: isReseller
                              ? "1px solid rgba(16,185,129,0.22)"
                              : "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <p className="text-white/95 text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block group">
                              <img
                                src={msg.imageUrl}
                                alt="Anexo"
                                className="max-w-full max-h-56 rounded-xl object-contain border border-white/10 group-hover:border-emerald-500/30 transition-colors"
                              />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply input */}
        {ticketDetail.status !== "archived" ? (
          <form onSubmit={handleSend} className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="bg-white/[0.03] border-white/[0.08] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 text-white placeholder:text-gray-600 min-h-[72px] max-h-40 resize-none pr-14 pb-3 rounded-2xl"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  />
                  <div className="absolute bottom-3 right-3">
                    <input
                      type="file"
                      accept="image/*"
                      ref={chatFileInputRef}
                      className="hidden"
                      onChange={(e) => handleImageChange(e, setChatImage, setChatImageName)}
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="p-2 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title="Anexar imagem"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {chatImageName && (
                  <div className="inline-flex items-center gap-2 mt-2.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Image className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[220px]">{chatImageName}</span>
                    <button type="button" onClick={() => { setChatImage(null); setChatImageName(null); }} className="text-gray-400 hover:text-red-400 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={sendMessage.isPending || (!chatText.trim() && !chatImage)}
                className="h-12 w-12 p-0 rounded-2xl text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Este ticket está arquivado.
          </div>
        )}
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20">
            <Ticket className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white text-2xl md:text-3xl font-bold">Meus Tickets</h1>
            <p className="text-gray-500 text-sm mt-0.5">Central de suporte da Zenity</p>
          </div>
        </div>
        <Button
          onClick={() => setOpenNew(true)}
          className="gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <Plus className="w-4 h-4" /> Novo Ticket
        </Button>
      </div>

      {/* Search + stats */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ticket por assunto..."
            className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 rounded-xl focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="text-emerald-400 font-semibold">{tickets.filter((t: any) => t.status === "open").length}</span> abertos
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="text-amber-400 font-semibold">{tickets.filter((t: any) => t.status === "closed").length}</span> fechados
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className="text-white font-semibold">{tickets.length}</span> total
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.015)" }}>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/20 mb-5">
              <Ticket className="w-9 h-9 text-emerald-400/70" />
            </div>
            <h3 className="text-white text-xl font-semibold">{tickets.length === 0 ? "Nenhum ticket ainda" : "Nenhum resultado"}</h3>
            <p className="text-gray-500 text-sm max-w-md mt-1.5 mb-6">
              {tickets.length === 0
                ? "Abra um ticket para falar com o suporte sobre dúvidas, problemas com keys ou outros assuntos."
                : "Nenhum ticket encontrado para a busca."}
            </p>
            {tickets.length === 0 && (
              <Button
                onClick={() => setOpenNew(true)}
                className="gap-2 text-sm font-semibold text-white rounded-xl border-0"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <Plus className="w-4 h-4" /> Abrir Ticket
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="group w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/20 shrink-0 group-hover:border-emerald-500/35 transition-colors">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate group-hover:text-emerald-50 transition-colors">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs truncate">Ticket #{t.id}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {relativeTime(t.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${statusColor[t.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
                    {statusLabel[t.status] || t.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <span className={`md:hidden inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${statusColor[t.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
                  {statusLabel[t.status] || t.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New ticket modal */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="text-white max-w-lg border-0 rounded-3xl p-0 overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(170deg, #0b1311 0%, #070a09 100%)",
            boxShadow: "0 0 0 1px rgba(16,185,129,0.22), 0 30px 80px rgba(0,0,0,0.85), 0 0 60px rgba(16,185,129,0.12)",
          }}
        >
          {/* Glowing Top Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

          <div className="p-6 sm:p-7">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-xl font-bold tracking-tight">Novo Ticket de Suporte</DialogTitle>
                    <p className="text-gray-400 text-xs mt-0.5">Nossa equipe responderá o mais rápido possível</p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Sugestões Rápidas de Assunto */}
              <div>
                <Label className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider block mb-2">
                  Atalhos de assunto
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Problema com Key",
                    "Dúvida sobre Créditos / Pix",
                    "Reset de HWID",
                    "Solicitação de Suporte",
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setSubject(preset)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        subject === preset
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                          : "bg-white/[0.02] text-gray-400 border-white/[0.07] hover:border-emerald-500/30 hover:text-white hover:bg-emerald-500/5"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Assunto */}
              <div>
                <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                  Assunto *
                </Label>
                <div className="relative mt-2">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Não consigo ativar minha key..."
                    className="h-11 text-white border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 bg-black/40 rounded-xl pl-3.5 pr-4 text-sm placeholder:text-gray-600 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Campo Mensagem */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                    Mensagem *
                  </Label>
                  <span className="text-[11px] text-gray-500">
                    {message.length} caracteres
                  </span>
                </div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique o que aconteceu, informe dados relevantes ou envie detalhes da key..."
                  className="text-white border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15 bg-black/40 min-h-[130px] resize-none rounded-xl p-3.5 text-sm placeholder:text-gray-600 transition-all leading-relaxed"
                  required
                />
              </div>

              {/* Upload de Anexo com Preview */}
              <div>
                <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Anexo de imagem (opcional)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleImageChange(e, setImageBase64, setImageName)}
                />
                {!imageName ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center gap-1.5 w-full py-4 px-4 rounded-2xl border border-dashed border-white/[0.12] hover:border-emerald-500/40 bg-black/20 hover:bg-emerald-500/[0.03] text-gray-400 hover:text-emerald-300 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] group-hover:bg-emerald-500/10 text-gray-400 group-hover:text-emerald-400 transition-all">
                      <Image className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">Clique para adicionar print ou comprovante</span>
                    <span className="text-[10px] text-gray-500">PNG, JPG ou GIF (máx. 5MB)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    {imageBase64 && (
                      <img
                        src={imageBase64}
                        alt="Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-300 truncate">{imageName}</p>
                      <p className="text-[10px] text-emerald-400/70 mt-0.5">Imagem pronta para envio</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setImageBase64(null); setImageName(null); }}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Remover anexo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  onClick={() => setOpenNew(false)}
                  className="flex-1 h-12 font-medium text-gray-300 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                  className="flex-1 h-12 font-semibold text-white rounded-2xl border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  }}
                >
                  <Send className="w-4 h-4" />
                  {createTicket.isPending ? "Abrindo Ticket..." : "Enviar Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
