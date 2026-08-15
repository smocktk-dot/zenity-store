import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Send, Image, X, ArrowLeft, Ticket } from "lucide-react";

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
    open: "bg-green-500/20 text-green-400 border-green-500/30",
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
      <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">{ticketDetail.subject}</h1>
            <p className="text-gray-500 text-xs">Ticket #{ticketDetail.id} · {formatDate(ticketDetail.createdAt)}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor[ticketDetail.status]}`}>
            {statusLabel[ticketDetail.status] || ticketDetail.status}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2"
          style={{ maxHeight: "calc(100% - 140px)" }}
        >
          {ticketDetail.messages?.map((msg: any) => {
            const isReseller = msg.senderType === "reseller";
            return (
              <div key={msg.id} className={`flex ${isReseller ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${isReseller ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                  style={{
                    background: isReseller ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.1))" : "rgba(255,255,255,0.05)",
                    border: isReseller ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  {msg.imageUrl && (
                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                      <img
                        src={msg.imageUrl}
                        alt="Anexo"
                        className="max-w-full max-h-60 rounded-lg object-contain border border-white/10"
                      />
                    </a>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1.5 text-right">{formatDate(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {ticketDetail.status !== "archived" && (
          <form onSubmit={handleSend} className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Textarea
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[60px] resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                />
                {chatImageName && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
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
                  onChange={(e) => handleImageChange(e, setChatImage, setChatImageName)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => chatFileInputRef.current?.click()}
                  className="h-10 w-10 p-0 border-white/10 text-gray-400 hover:text-emerald-400 hover:bg-white/5"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={sendMessage.isPending || (!chatText.trim() && !chatImage)}
                  className="h-10 w-10 p-0 text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        )}

        {ticketDetail.status === "archived" && (
          <p className="text-center text-gray-500 text-sm py-4 border-t border-white/5">Este ticket está arquivado.</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Meus Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Fale com o suporte da Zenity</p>
        </div>
        <Button
          onClick={() => setOpenNew(true)}
          className="gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
        >
          <Plus className="w-4 h-4" /> Novo Ticket
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        {isLoading ? (
          <p className="text-center py-10 text-gray-500">Carregando...</p>
        ) : tickets.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-gray-500 text-sm">Nenhum ticket aberto ainda</p>
            <Button
              onClick={() => setOpenNew(true)}
              className="gap-2 text-sm"
              style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
            >
              <Plus className="w-4 h-4" /> Abrir Ticket
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.subject}</p>
                  <p className="text-gray-500 text-xs">{formatDate(t.updatedAt)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[t.status]}`}>
                  {statusLabel[t.status] || t.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent
          className="text-white max-w-md border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Abrir Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Assunto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Problema com key"
                className="mt-1.5 text-white border-white/10 focus:border-emerald-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Mensagem</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva sua dúvida ou problema..."
                className="mt-1.5 text-white border-white/10 focus:border-emerald-500/60 bg-white/5 min-h-[100px]"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">Anexo (opcional)</Label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => handleImageChange(e, setImageBase64, setImageName)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border-white/10 text-gray-400 hover:text-emerald-400 bg-transparent"
              >
                <Image className="w-4 h-4" /> {imageName ? "Trocar foto" : "Adicionar foto"}
              </Button>
              {imageName && (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-2">
                  <Image className="w-3.5 h-3.5" /> {imageName}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setOpenNew(false)}
                className="flex-1 text-gray-300 bg-white/5 border border-white/10 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTicket.isPending || !subject.trim() || !message.trim()}
                className="flex-1 text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
              >
                {createTicket.isPending ? "Abrindo..." : "Abrir Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
