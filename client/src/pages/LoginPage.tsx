import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const LOGIN_STREAKS = Array.from({ length: 92 }, (_, i) => {
  const normalized = i / 91 - 0.5;
  return {
    left: (i / 91) * 100,
    height: 78 + ((i * 41) % 190),
    delay: (i * 0.15) % 3.8,
    duration: 4.1 + ((i * 23) % 30) / 10,
    opacity: 0.2 + ((i * 11) % 50) / 100,
    drift: Math.round(normalized * 220),
    width: 1 + ((i * 7) % 2),
  };
});

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const { t } = useLanguage();

  // Application state
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

  // Support ticket state
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
      toast.success("Dúvida enviada!");
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

  useEffect(() => {
    if (appScrollRef.current) appScrollRef.current.scrollTop = appScrollRef.current.scrollHeight;
  }, [application?.messages]);

  useEffect(() => {
    if (supportScrollRef.current) supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
  }, [supportTicket?.messages]);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.22),transparent_38%),radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.06),transparent_35%)] pointer-events-none" />

      <div className="hidden lg:block absolute inset-y-0 left-0 w-1/2 overflow-hidden">
        <div className="login-streak-stage">
          {LOGIN_STREAKS.map((line, idx) => (
            <span
              key={idx}
              className="login-streak-line"
              style={{
                left: `${line.left}%`,
                height: `${line.height}px`,
                animationDelay: `-${line.delay}s`,
                animationDuration: `${line.duration}s`,
                opacity: line.opacity,
                width: `${line.width}px`,
                ["--drift" as any]: `${line.drift}px`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-52 bg-gradient-to-l from-[#050507] to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen lg:justify-end">
        <div
          className="w-full lg:w-1/2 min-h-screen border-l border-white/10"
          style={{ background: "rgba(7,7,10,0.9)", backdropFilter: "blur(18px)" }}
        >
          <div className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col justify-center px-8 py-10 sm:px-12">
            <div className="mb-9 flex items-center justify-between">
              <p className="text-[11px] tracking-[0.16em] uppercase text-gray-300">✦ Stellar Sellers</p>
              <LanguageSwitcher />
            </div>

            <div className="mb-7">
              <h1 className="text-[34px] sm:text-[38px] font-semibold leading-tight text-white">Bem-vindo de volta.</h1>
              <p className="mt-2 text-[13px] text-gray-400">Entre na sua conta para continuar.</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toast.info("Use o login com usuário e senha.")}
                className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.06]"
              >
                Entrar com Google
              </button>
              <button
                type="button"
                onClick={() => toast.info("Use o login com usuário e senha.")}
                className="w-full h-10 rounded-md border border-white/12 bg-white/[0.03] text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.06]"
              >
                Entrar com Discord
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-gray-600">
              <div className="h-px flex-1 bg-white/10" />
              ou
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{t.login_username}</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.login_username_placeholder}
                  autoComplete="username"
                  className="h-10 rounded-md border-white/15 bg-white/[0.03] text-sm text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-violet-400/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{t.login_password}</label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    className="h-10 rounded-md border-white/15 bg-white/[0.03] pr-10 text-sm text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-violet-400/50"
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

              <div className="flex items-center justify-between pt-1">
                <label htmlFor="remember" className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/30 accent-violet-500"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  onClick={() => toast.info("Entre em contato com o admin.")}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-black transition-all"
                style={{
                  background: isLoading
                    ? "linear-gradient(135deg, rgba(234,234,255,0.55), rgba(202,202,230,0.55))"
                    : "linear-gradient(135deg, #f5f5f8, #d9d9de)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    {t.login_signing_in}
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    {t.login_sign_in}
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-500">
              Não tem conta?{" "}
              <button type="button" onClick={() => setShowApply(true)} className="text-gray-300 hover:text-violet-300 transition-colors">
                Criar uma
              </button>
              <span className="mx-2 text-gray-700">•</span>
              <button type="button" onClick={() => setShowSupport(true)} className="hover:text-gray-300 transition-colors">
                Ajuda
              </button>
            </div>

            {hasApplication && application?.status === "pre_approved" && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Pré-aprovado! Clique no chat flutuante.
              </p>
            )}

            <p className="mt-8 text-[11px] leading-relaxed text-gray-600">
              {t.login_secure_access}
              <br />
              {t.login_copyright}
            </p>
          </div>
        </div>
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
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Seu Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Qual produto quer revender?</Label>
              <Input
                value={form.product}
                onChange={(e) => setForm(f => ({ ...f, product: e.target.value }))}
                placeholder="Ex: Cheats, Contas, Keys..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Por que quer se tornar reseller?</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Conte um pouco sobre você e como pretende vender..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5 min-h-[100px]"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setShowApply(false)}
                className="flex-1 text-gray-300 bg-white/5 border border-white/10 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submit.isPending}
                className="flex-1 text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                {submit.isPending ? "Enviando..." : "Enviar aplicação"}
              </Button>
            </div>
          </form>
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
            <DialogTitle className="text-white text-lg font-semibold">Tire sua dúvida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupport} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Seu Nome</Label>
              <Input
                value={supportForm.name}
                onChange={(e) => setSupportForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Como podemos te chamar?"
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Seu Email</Label>
              <Input
                type="email"
                value={supportForm.email}
                onChange={(e) => setSupportForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Motivo do ticket</Label>
              <Input
                value={supportForm.subject}
                onChange={(e) => setSupportForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ex: Dúvida sobre preço, problema com acesso..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Sua dúvida</Label>
              <Textarea
                value={supportForm.question}
                onChange={(e) => setSupportForm(f => ({ ...f, question: e.target.value }))}
                placeholder="Descreva sua dúvida..."
                className="mt-1.5 text-white border-white/10 focus:border-violet-500/60 bg-white/5 min-h-[120px]"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setShowSupport(false)}
                className="flex-1 text-gray-300 bg-white/5 border border-white/10 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitSupport.isPending}
                className="flex-1 text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                {submitSupport.isPending ? "Enviando..." : "Abrir ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Application chat floating button */}
      {hasApplication && (
        <button
          onClick={() => setShowAppChat(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110"
          style={{
            background: isPreApproved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: isPreApproved ? "0 4px 24px rgba(34,197,94,0.45)" : "0 4px 24px rgba(16,185,129,0.45)",
          }}
          title="Meu chat com a administração"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Application Chat Dialog */}
      <Dialog open={showAppChat} onOpenChange={setShowAppChat}>
        <DialogContent
          className="text-white max-w-lg border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader className="border-b border-white/10 pb-3">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-violet-400" /> Chat com a Admin
            </DialogTitle>
          </DialogHeader>

          {application?.status === "pre_approved" && (
            <div className="mb-3 rounded-lg p-3 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <p className="text-green-400 font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Pré-aprovado!</p>
              <p className="text-gray-400 text-xs mt-1">Você está no processo de aprovação final. Fique atento ao chat.</p>
            </div>
          )}

          <div
            ref={appScrollRef}
            className="h-[320px] overflow-y-auto space-y-3 pr-1 my-3"
          >
            {isLoadingApp ? (
              <p className="text-center text-gray-500 text-sm py-10">Carregando...</p>
            ) : application?.messages?.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">Aguarde a resposta da administração.</p>
            ) : (
              application?.messages?.map((msg: any) => {
                const isApplicant = msg.senderType === "applicant";
                return (
                  <div key={msg.id} className={`flex ${isApplicant ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${isApplicant ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background: isApplicant ? "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(139,92,246,0.1))" : "rgba(255,255,255,0.05)",
                        border: isApplicant ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] text-gray-500 mb-0.5 font-semibold uppercase">{isApplicant ? "Você" : "Admin"}</p>
                      <p className="text-white text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1 text-right">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {application && application.status !== "archived" && application.status !== "rejected" ? (
            <form onSubmit={handleAppChatSend} className="border-t border-white/10 pt-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={appChatText}
                  onChange={(e) => setAppChatText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[60px] resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAppChatSend(e as any); } }}
                />
                <Button
                  type="submit"
                  disabled={sendAppMessage.isPending || !appChatText.trim()}
                  className="h-[60px] w-12 p-0 text-white"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500 text-sm py-2 border-t border-white/10">Este chat está encerrado.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Support Chat Dialog */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent
          className="text-white max-w-lg border-0"
          style={{
            background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 25px 60px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
          }}
        >
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" /> Dúvida #{supportTicket?.id}
            </DialogTitle>
            <button
              onClick={() => {
                localStorage.removeItem(SUPPORT_STORAGE_KEY);
                setSupportId(null);
                setShowSupportChat(false);
                setShowSupport(true);
                setSupportForm({ name: "", email: "", subject: "", question: "" });
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" /> Nova dúvida
            </button>
          </DialogHeader>

          <div
            ref={supportScrollRef}
            className="h-[320px] overflow-y-auto space-y-3 pr-1 my-3"
          >
            {isLoadingSupport ? (
              <p className="text-center text-gray-500 text-sm py-10">Carregando...</p>
            ) : supportTicket?.messages?.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-10">Aguarde a resposta da administração.</p>
            ) : (
              supportTicket?.messages?.map((msg: any) => {
                const isUser = msg.senderType === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background: isUser ? "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.1))" : "rgba(255,255,255,0.05)",
                        border: isUser ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="text-[10px] text-gray-500 mb-0.5 font-semibold uppercase">{isUser ? "Você" : "Admin"}</p>
                      <p className="text-white text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1 text-right">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {supportTicket && supportTicket.status === "open" ? (
            <form onSubmit={handleSupportChatSend} className="border-t border-white/10 pt-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={supportChatText}
                  onChange={(e) => setSupportChatText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600 min-h-[60px] resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSupportChatSend(e as any); } }}
                />
                <Button
                  type="submit"
                  disabled={sendSupportMessage.isPending || !supportChatText.trim()}
                  className="h-[60px] w-12 p-0 text-white"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500 text-sm py-2 border-t border-white/10">Este ticket foi fechado. Caso ainda tenha dúvidas, abra um novo.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
