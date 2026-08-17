import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Send, MessageCircle, X, UserPlus, CheckCircle2, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InteractiveStars from "@/components/InteractiveStars";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "/logo.png";
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
  const [showAdmin, setShowAdmin] = useState(false);
  const { t } = useLanguage();

  const hwid = (() => {
    try {
      const url = new URL("https://x" + location);
      return url.searchParams.get("hwid") || undefined;
    } catch { return undefined; }
  })();

  const urlError = (() => {
    try {
      const url = new URL("https://x" + location);
      return url.searchParams.get("error");
    } catch { return null; }
  })();

  const [showForm, setShowForm] = useState(urlError === "discord_not_linked" || urlError === "not_authorized");

  useEffect(() => {
    if (urlError && !showForm) {
      setShowForm(true);
    }
  }, [urlError]);

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
    if (!meLoading && me) {
      if (me.role === "admin") navigate("/admin");
      else if (me.role === "reseller") navigate("/reseller");
    }
  }, [me, meLoading, navigate]);

  useEffect(() => {
    if (urlError) {
      const msgs: Record<string, string> = {
        discord_denied: "Login com Discord cancelado.",
        missing_code: "Erro no callback do Discord.",
        discord_token: "Nao foi possivel autenticar no Discord.",
        discord_user: "Nao foi possivel obter dados do Discord.",
        discord_not_linked: "Discord nao vinculado. Use usuario e senha.",
        not_authorized: "Acesso negado.",
        account_inactive: "Conta inativa.",
        discord_error: "Erro no login com Discord.",
      };
      toast.error(msgs[urlError] || "Erro no login com Discord.");
      window.history.replaceState({}, "", "/");
    }
  }, [urlError]);

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
    resellerLogin.mutate({ username, password, remember, hwid });
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
        {!showForm ? (
          <a
            href="/api/auth/discord"
            className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
              boxShadow: "0 8px 32px rgba(88,101,242,0.4), 0 1px 0 rgba(255,255,255,0.1) inset",
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.097.246.198.373.292a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Entrar com Discord
          </a>
        ) : (
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
              <h2 className="text-2xl font-bold text-white">{showAdmin ? t.login_reseller_access : "Acesso Admin"}</h2>
              <p className="text-gray-500 text-sm mt-1">{showAdmin ? t.login_sign_in_desc : "Entre com suas credenciais."}</p>
            </div>

            {!showAdmin ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAdmin(true)}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  Login com usuario e senha
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Voltar
                </button>
              </div>
            ) : (
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

                <button
                  type="button"
                  onClick={() => { setShowAdmin(false); setShowForm(false); }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Voltar
                </button>
              </form>
            )}
          </div>
        )}

        {hasApplication && application?.status === "pre_approved" && (
          <div className="mt-8 text-center">
            <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Pré-aprovado! Clique no chat flutuante.
            </p>
          </div>
        )}

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

      {/* Floating Help */}
      <button
        onClick={() => setShowSupport(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center z-30 transition-all hover:scale-110"
        style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}
      >
        <HelpCircle className="w-5 h-5 text-white" />
      </button>

      {/* Floating Close App Chat */}
      {hasApplication && isPreApproved && (
        <button
          onClick={() => setShowAppChat(true)}
          className="fixed bottom-20 right-6 w-12 h-12 rounded-full flex items-center justify-center z-30 transition-all hover:scale-110"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
