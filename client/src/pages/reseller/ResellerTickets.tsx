import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Send, Image, X, ArrowLeft, Ticket, Clock, ChevronRight } from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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
    open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    closed: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    archived: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  };

  const statusDot: Record<string, string> = {
    open: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    closed: "bg-amber-400",
    archived: "bg-gray-400",
  };

  const statusLabel: Record<string, string> = {
    open: "Aberto",
    closed: "Fechado",
    archived: "Arquivado",
  };

  // ─── Chat view ───────────────────────────────────────────────────────────────
  if (selectedTicketId && ticketDetail) {
    return (
      <div className="p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg md:text-xl font-semibold truncate">{ticketDetail.subject}</h1>
            <div className="flex items-center gap-3 text-gray-500 text-xs">
              <span>Ticket #{ticketDetail.id}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>{formatDate(ticketDetail.createdAt)}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusColor[ticketDetail.status]}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot[ticketDetail.status]}`} />
            {statusLabel[ticketDetail.status] || ticketDetail.status}
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-5 pr-1"
          style={{ maxHeight: "calc(100% - 140px)" }}
        >
          {ticketDetail.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500">
              <MessageSquare className="w-10 h-10 text-gray-700" />
              <p className="text-sm">Nenhuma mensagem ainda. Envie a primeira.</p>
            </div>
          ) : (
            ticketDetail.messages?.map((msg: any) => {
              const isReseller = msg.senderType === "reseller";
              return (
                <div key={msg.id} className={`flex ${isReseller ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
                    <div
                      className={`rounded-2xl px-4 py-3 ${isReseller ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background: isReseller
                          ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12))"
                          : "rgba(255,255,255,0.05)",
                        border: isReseller
                          ? "1px solid rgba(16,185,129,0.25)"
                          : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-white/95 text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      {msg.imageUrl && (
                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block group">
                          <img
                            src={msg.imageUrl}
                            alt="Anexo"
                            className="max-w-full max-h-52 rounded-xl object-contain border border-white/10 group-hover:border-emerald-500/30 transition-colors"
                          />
                        </a>
                      )}
                    </div>
                    <span className={`text-[10px] text-gray-500 mt-1.5 ${isReseller ? "text-right" : "text-left"}`}>
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply input */}
        {ticketDetail.status !== "archived" ? (
          <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-white/[0.05]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="bg-white/[0.03] border-white/[0.08] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 text-white placeholder:text-gray-600 min-h-[64px] max-h-40 resize-none pr-4 pb-10 rounded-2xl"
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                  />
                  <div className="absolute bottom-2 left-2">
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
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {chatImageName && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <Image className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{chatImageName}</span>
                    <button type="button" onClick={() => { setChatImage(null); setChatImageName(null); }} className="text-gray-400 hover:text-red-400 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={sendMessage.isPending || (!chatText.trim() && !chatImage)}
                className="h-11 w-11 p-0 rounded-2xl text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Este ticket está arquivado.
          </div>
        )}
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-bold">Meus Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Converse com o suporte da Zenity</p>
        </div>
        <Button
          onClick={() => setOpenNew(true)}
          className="gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <Plus className="w-4 h-4" /> Novo Ticket
        </Button>
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.02]">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Ticket className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Nenhum ticket ainda</h3>
            <p className="text-gray-500 text-sm max-w-sm mt-1 mb-5">Abra um ticket caso tenha dúvidas, problemas com keys ou precise falar com o suporte.</p>
            <Button
              onClick={() => setOpenNew(true)}
              className="gap-2 text-sm font-semibold text-white rounded-xl border-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              <Plus className="w-4 h-4" /> Abrir Ticket
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="group text-left rounded-2xl p-5 bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${statusColor[t.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
                    {statusLabel[t.status] || t.status}
                  </span>
                </div>
                <h3 className="text-white text-sm font-semibold line-clamp-1 mb-1 group-hover:text-emerald-50 transition-colors">{t.subject}</h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{relativeTime(t.updatedAt)}</span>
                </div>
                <div className="mt-4 flex items-center text-emerald-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver conversa <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New ticket modal */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="text-white max-w-md border-0 rounded-2xl p-0 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(16,185,129,0.2), 0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.08)",
          }}
        >
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
                  <Ticket className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-semibold">Abrir Ticket</DialogTitle>
                  <p className="text-gray-500 text-xs mt-0.5">Descreva seu problema para o suporte</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Assunto</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Problema com key"
                  className="mt-1.5 text-white border-white/[0.08] focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 bg-white/[0.03] rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Mensagem</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema..."
                  className="mt-1.5 text-white border-white/[0.08] focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 bg-white/[0.03] min-h-[120px] resize-none rounded-xl"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Anexo (opcional)</Label>
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
                    className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl border border-dashed border-white/[0.12] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-sm"
                  >
                    <Image className="w-4 h-4" /> Adicionar foto
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    <Image className="w-4 h-4" />
                    <span className="flex-1 truncate">{imageName}</span>
                    <button type="button" onClick={() => { setImageBase64(null); setImageName(null); }} className="text-gray-400 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setOpenNew(false)}
                  className="flex-1 font-medium text-gray-300 rounded-xl transition-all duration-200 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                  className="flex-1 font-semibold text-white rounded-xl border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {createTicket.isPending ? "Abrindo..." : "Abrir Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
