import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Send, MessageCircle, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InteractiveStars from "@/components/InteractiveStars";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const APP_STORAGE_KEY = "zenity_application_id";
const SUPPORT_STORAGE_KEY = "zenity_support_id";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const { t } = useLanguage();

  const urlError = (() => {
    try {
      const url = new URL("https://x" + location);
      return url.searchParams.get("error");
    } catch { return null; }
  })();

  const [showApply, setShowApply] = useState(false);
  const [showAppChat, setShowAppChat] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [appChatText, setAppChatText] = useState("");
  const [form, setForm] = useState({
    discordLink: "",
    discordId: "",
    email: "",
    product: "",
    reason: "",
  });

  const [showSupport, setShowSupport] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportId, setSupportId] = useState<number | null>(null);
  const [supportChatText, setSupportChatText] = useState("");
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    subject: "",
    question: "",
  });

  const appScrollRef = useRef<HTMLDivElement>(null);
  const supportScrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const savedApp = localStorage.getItem(APP_STORAGE_KEY);
    if (savedApp) {
      const id = parseInt(savedApp, 10);
      if (!isNaN(id)) setApplicationId(id);
    }
    const savedSupport = localStorage.getItem(SUPPORT_STORAGE_KEY);
    if (savedSupport) {
      const id = parseInt(savedSupport, 10);
      if (!isNaN(id)) setSupportId(id);
    }
  }, []);

  const { data: application, isLoading: isLoadingApp } = trpc.auth.getMyApplication.useQuery(
    { id: applicationId || 0 },
    {
      enabled: !!applicationId,
      onError: (e: any) => {
        if (e?.data?.code === "NOT_FOUND") {
          localStorage.removeItem(APP_STORAGE_KEY);
          setApplicationId(null);
        }
      },
    }
  );

  const { data: supportTicket, isLoading: isLoadingSupport } = trpc.auth.getMySupportTicket.useQuery(
    { id: supportId || 0 },
    {
      enabled: !!supportId,
      onError: (e: any) => {
        if (e?.data?.code === "NOT_FOUND") {
          localStorage.removeItem(SUPPORT_STORAGE_KEY);
          setSupportId(null);
        }
      },
    }
  );

  const { data: me, isLoading: meLoading } = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });

  useEffect(() => {
    if (urlError) {
      const msgs: Record<string, string> = {
        not_authorized: "Acesso negado.",
        account_inactive: "Conta inativa.",
      };
      toast.error(msgs[urlError] || "Erro no login.");
      window.history.replaceState({}, "", "/");
    }
  }, [urlError]);

  useEffect(() => {
    if (!meLoading && me) {
      if (me.role === "admin") navigate("/admin");
      else navigate("/reseller");
    }
  }, [me, meLoading, navigate]);

  const submit = trpc.auth.submitResellerApplication.useMutation({
    onSuccess: (data) => {
      localStorage.setItem(APP_STORAGE_KEY, String(data.id));
      setApplicationId(data.id);
      setShowApply(false);
      setShowAppChat(true);
      toast.success("Pré-aprovado!");
      utils.auth.getMyApplication.invalidate({ id: data.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const sendAppMessage = trpc.auth.sendApplicationMessage.useMutation({
    onSuccess: () => {
      setAppChatText("");
      utils.auth.getMyApplication.invalidate({ id: applicationId || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const submitSupport = trpc.auth.submitSupportTicket.useMutation({
    onSuccess: (data) => {
      localStorage.setItem(SUPPORT_STORAGE_KEY, String(data.id));
      setSupportId(data.id);
      setShowSupport(false);
      setShowSupportChat(true);
      toast.success("Chamado enviado!");
      utils.auth.getMySupportTicket.invalidate({ id: data.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const sendSupportMessage = trpc.auth.sendSupportMessage.useMutation({
    onSuccess: () => {
      setSupportChatText("");
      utils.auth.getMySupportTicket.invalidate({ id: supportId || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const resellerLogin = trpc.auth.resellerLogin.useMutation({
    onSuccess: (data) => {
      toast.success(t.login_success);
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/reseller");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error(t.login_fill_fields); return; }
    resellerLogin.mutate({ username, password, remember });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.discordLink || !form.discordId || !form.email || !form.product || !form.reason) return;
    submit.mutate(form);
  };

  const handleAppChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appChatText.trim() || !applicationId) return;
    sendAppMessage.mutate({ applicationId, message: appChatText.trim() });
  };

  const handleSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.name || !supportForm.email || !supportForm.subject || !supportForm.question) return;
    submitSupport.mutate(supportForm);
  };

  const handleSupportChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportChatText.trim() || !supportId) return;
    sendSupportMessage.mutate({ ticketId: supportId, message: supportChatText.trim() });
  };

  const isLoading = resellerLogin.isPending;

  const activeAppStatus = ["pending", "pre_approved", "approved"];
  const hasApplication = !!applicationId && (isLoadingApp || (!!application && activeAppStatus.includes(application.status)));
  const isPreApproved = application?.status === "pre_approved";

  useEffect(() => {
    if (application && !activeAppStatus.includes(application.status)) {
      localStorage.removeItem(APP_STORAGE_KEY);
      setApplicationId(null);
      setShowAppChat(false);
    }
  }, [application]);

  const activeSupportStatus = ["open"];
  const hasSupport = !!supportId && (isLoadingSupport || (!!supportTicket && activeSupportStatus.includes(supportTicket.status)));

  useEffect(() => {
    if (supportTicket && !activeSupportStatus.includes(supportTicket.status)) {
      localStorage.removeItem(SUPPORT_STORAGE_KEY);
      setSupportId(null);
      setShowSupportChat(false);
    }
  }, [supportTicket]);

  if (meLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#050507" }}>
      <InteractiveStars />

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
        <div
          className="rounded-3xl border p-8"
          style={{
            background: "rgba(8,8,10,0.78)",
            backdropFilter: "blur(28px)",
            borderColor: "rgba(255,255,255,0.08)",
            boxShadow: "0 0 0 1px rgba(16,185,129,0.08), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-[0.1em]">SELLERS</h2>
            <p className="text-gray-500 text-sm mt-1">{t.login_sign_in_desc}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t.login_username}</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.login_username_placeholder}
                autoComplete="username"
                className="h-12 text-white placeholder:text-gray-600 transition-all rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t.login_password}</label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="h-12 text-white placeholder:text-gray-600 pr-10 transition-all rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                />
                <label htmlFor="remember" className="text-gray-400 text-xs cursor-pointer select-none">Lembrar de mim</label>
              </div>
              <a href="#" className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors" onClick={e => { e.preventDefault(); toast.info("Entre em contato com o admin."); }}>Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-semibold text-sm text-white mt-2 flex items-center justify-center gap-2 transition-all"
              style={{
                background: isLoading ? "rgba(16,185,129,0.4)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: isLoading ? "none" : "0 4px 24px rgba(16,185,129,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t.login_signing_in}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {t.login_sign_in}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            {t.login_secure_access}
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          {t.login_copyright}
        </p>
      </div>

      {/* Apply Modal */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent
          className="text-white max-w-md border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Quero me tornar Reseller</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Link do Discord</Label>
              <Input
                value={form.discordLink}
                onChange={(e) => setForm(f => ({ ...f, discordLink: e.target.value }))}
                placeholder="https://discord.gg/..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">ID do Discord</Label>
              <Input
                value={form.discordId}
                onChange={(e) => setForm(f => ({ ...f, discordId: e.target.value }))}
                placeholder="123456789012345678"
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Email</Label>
              <Input
                value={form.email}
                type="email"
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Produto / Categoria</Label>
              <Input
                value={form.product}
                onChange={(e) => setForm(f => ({ ...f, product: e.target.value }))}
                placeholder="Ex: cheats, contas, mods..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Motivo / Experiência</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Conte um pouco sobre sua experiência..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5 min-h-[100px]"
                required
              />
            </div>
            <Button type="submit" disabled={submit.isPending} className="w-full bg-violet-600 hover:bg-violet-500 h-11">
              {submit.isPending ? "Enviando..." : "Enviar aplicação"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Application Chat Modal */}
      <Dialog open={showAppChat} onOpenChange={setShowAppChat}>
        <DialogContent
          className="text-white max-w-lg border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Sua Aplicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl p-4 max-h-[400px] overflow-y-auto" style={{ background: "rgba(0,0,0,0.2)" }} ref={appScrollRef}>
              {application?.messages?.length === 0 && (
                <p className="text-gray-500 text-sm text-center">Aguardando resposta do admin.</p>
              )}
              {application?.messages?.map((msg: any) => {
                const isApplicant = msg.senderType === "applicant";
                return (
                  <div key={msg.id} className={`flex ${isApplicant ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 mb-2 text-sm ${isApplicant ? "bg-violet-600/30 text-violet-100 rounded-br-md" : "bg-white/10 text-gray-200 rounded-bl-md"}`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleAppChatSend} className="flex gap-2">
              <Input
                value={appChatText}
                onChange={(e) => setAppChatText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="text-white border-white/10 bg-white/5"
              />
              <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-500">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Modal */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent
          className="text-white max-w-md border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Abrir Chamado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupport} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Nome</Label>
              <Input value={supportForm.name} onChange={(e) => setSupportForm(f => ({ ...f, name: e.target.value }))} placeholder="Seu nome" className="mt-1.5 text-white border-white/10 bg-white/5" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Email</Label>
              <Input value={supportForm.email} type="email" onChange={(e) => setSupportForm(f => ({ ...f, email: e.target.value }))} placeholder="seu@email.com" className="mt-1.5 text-white border-white/10 bg-white/5" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Assunto</Label>
              <Input value={supportForm.subject} onChange={(e) => setSupportForm(f => ({ ...f, subject: e.target.value }))} placeholder="Assunto" className="mt-1.5 text-white border-white/10 bg-white/5" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Dúvida</Label>
              <Textarea value={supportForm.question} onChange={(e) => setSupportForm(f => ({ ...f, question: e.target.value }))} placeholder="Descreva sua dúvida..." className="mt-1.5 text-white border-white/10 bg-white/5 min-h-[100px]" required />
            </div>
            <Button type="submit" disabled={submitSupport.isPending} className="w-full bg-violet-600 hover:bg-violet-500 h-11">
              {submitSupport.isPending ? "Enviando..." : "Enviar dúvida"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Support Chat Modal */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent
          className="text-white max-w-lg border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Seu Chamado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl p-4 max-h-[400px] overflow-y-auto" style={{ background: "rgba(0,0,0,0.2)" }} ref={supportScrollRef}>
              {supportTicket?.messages?.length === 0 && (
                <p className="text-gray-500 text-sm text-center">Aguardando resposta do suporte.</p>
              )}
              {supportTicket?.messages?.map((msg: any) => {
                const isUser = msg.senderType === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 mb-2 text-sm ${isUser ? "bg-violet-600/30 text-violet-100 rounded-br-md" : "bg-white/10 text-gray-200 rounded-bl-md"}`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSupportChatSend} className="flex gap-2">
              <Input
                value={supportChatText}
                onChange={(e) => setSupportChatText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="text-white border-white/10 bg-white/5"
              />
              <Button type="submit" size="icon" className="bg-violet-600 hover:bg-violet-500">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
