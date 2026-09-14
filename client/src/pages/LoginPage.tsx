import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Send, MessageCircle, CheckCircle2, User, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import LightStreaks from "@/components/LightStreaks";

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
    <div className="auth-page">
      {/* Left side: WebGL Light Streaks warp speed background (monochrome starlight) */}
      <div className="auth-left">
        <div className="auth-left-bg">
          <LightStreaks
            colors={["#ffffff", "#e0e0e0", "#a8a8a8", "#666666"]}
            backgroundColor="#030305"
            speed={0.4}
            streakCount={6}
            streakWidth={1}
            streakLength={1.2}
            glow={0.7}
            density={0.5}
            twinkle={0.8}
            zoom={2.5}
            backgroundGlow={0.12}
            opacity={0.7}
            mouseInteraction={true}
            mouseStrength={0.4}
            mouseRadius={0.8}
          />
        </div>

        {/* Enterprise Live Gateway badge on bottom-left */}
        <div className="relative z-10 p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.16em] uppercase text-gray-300">Enterprise Network</span>
          </div>
          <p className="text-sm font-medium text-white/90 leading-snug">
            Infraestrutura de alta disponibilidade para distribuição e gestão automatizada de licenças B2B.
          </p>
          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Latência &lt; 25ms</span>
            <span>Zero-Downtime</span>
            <span>Console v2.6</span>
          </div>
        </div>
      </div>

      {/* Right side: High-end B2B Authentication Console */}
      <div className="auth-right">
        {/* Top Header Bar */}
        <div className="w-full max-w-[420px] mx-auto flex items-center justify-between mb-8 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono tracking-[0.14em] uppercase text-gray-400">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSupport(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Suporte
            </button>
            <span className="text-gray-700">•</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Center Card */}
        <div className="auth-card w-full max-w-[420px] mx-auto my-auto z-10">
          {/* Brand Mark */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase">VG SELLERS</h2>
                <p className="text-[10px] tracking-[0.14em] text-gray-500 uppercase font-mono">Painel Corporativo B2B</p>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Autenticação</h1>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              Insira suas credenciais de revendedor para acessar o console de operações.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Usuário ou E-mail</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-4 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => toast.info("Para redefinir a senha, entre em contato com o suporte ou administrador.")}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 text-sm bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="remember" className="flex items-center gap-2.5 text-xs text-gray-400 cursor-pointer select-none">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-white cursor-pointer"
                />
                <span>Manter conectado neste dispositivo</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.08)] mt-3"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet application notice if active */}
          {hasApplication && application?.status === "pre_approved" && (
            <div className="mt-5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sua aplicação foi pré-aprovada. Fale pelo chat.
              </p>
            </div>
          )}

          {/* Clean B2B affiliation link */}
          <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
            <span>Deseja se tornar revendedor?</span>
            <button
              type="button"
              onClick={() => setShowApply(true)}
              className="text-white hover:text-gray-300 font-medium transition-colors"
            >
              Solicitar afiliação →
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="w-full max-w-[420px] mx-auto text-center mt-8 z-10">
          <p className="text-[11px] text-gray-600 leading-relaxed font-mono">
            Ambiente seguro • Proteção de sessão por JWT & Whitelist
            <br />
            © 2026 VG SELLERS. Todos os direitos reservados.
          </p>
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
