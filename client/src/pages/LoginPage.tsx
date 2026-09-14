import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Send, MessageCircle, CheckCircle2, User, Lock, ArrowRight, ShieldCheck, Check } from "lucide-react";
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
      {/* Left side: Enterprise showcase panel */}
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

        {/* Subtle grid overlay for depth */}
        <div className="auth-left-grid" aria-hidden="true" />

        {/* Top: Brand lockup */}
        <div className="auth-left-top">
          <div className="auth-brand-mark">
            <span className="auth-brand-glyph">VG</span>
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">VG SELLERS</span>
            <span className="auth-brand-sub">Reseller Operations Console</span>
          </div>
        </div>

        {/* Middle: Value proposition */}
        <div className="auth-left-mid">
          <h2 className="auth-left-title">
            Distribuição de licenças<br />em escala empresarial.
          </h2>
          <p className="auth-left-desc">
            Plataforma unificada para revendedores autorizados gerenciarem estoque, geração de keys,
            integrações de gateway e relatórios em tempo real.
          </p>

          <ul className="auth-features">
            <li>
              <span className="auth-feature-dot" />
              <div>
                <p className="auth-feature-title">Geração automatizada de keys</p>
                <p className="auth-feature-sub">Controle de estoque e revogação por HWID.</p>
              </div>
            </li>
            <li>
              <span className="auth-feature-dot" />
              <div>
                <p className="auth-feature-title">Gateways de API para bots</p>
                <p className="auth-feature-sub">Integração direta com KeyAuth e PUB EMU.</p>
              </div>
            </li>
            <li>
              <span className="auth-feature-dot" />
              <div>
                <p className="auth-feature-title">Painel de revendedor dedicado</p>
                <p className="auth-feature-sub">Créditos, percentual e loja própria.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Bottom: Status card */}
        <div className="auth-left-status">
          <div className="auth-status-head">
            <span className="auth-status-pulse" />
            <span className="auth-status-label">Enterprise Network</span>
          </div>
          <div className="auth-status-metrics">
            <div>
              <span className="auth-status-value">99.98%</span>
              <span className="auth-status-key">Uptime SLA</span>
            </div>
            <div>
              <span className="auth-status-value">{"<25ms"}</span>
              <span className="auth-status-key">Latência</span>
            </div>
            <div>
              <span className="auth-status-value">v2.6</span>
              <span className="auth-status-key">Console</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Authentication console */}
      <div className="auth-right">
        {/* Top Header Bar */}
        <div className="auth-topbar">
          <div className="auth-topbar-brand">
            <div className="auth-topbar-glyph">VG</div>
            <span className="auth-topbar-name">SELLERS</span>
          </div>
          <div className="auth-topbar-actions">
            <button
              type="button"
              onClick={() => setShowSupport(true)}
              className="auth-topbar-link"
            >
              Suporte
            </button>
            <span className="auth-topbar-sep" />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Center Card */}
        <div className="auth-card">
          <div className="auth-card-head">
            <div className="auth-eyebrow">
              <span className="auth-eyebrow-dot" />
              <span>Console do Revendedor</span>
            </div>

            <h1 className="auth-card-title">Acesse sua conta</h1>
            <p className="auth-card-sub">
              Entre com suas credenciais autorizadas para gerenciar licenças, estoque e integrações.
            </p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Usuário ou E-mail</label>
              <div className="auth-input-wrap">
                <User className="auth-input-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário cadastrado"
                  autoComplete="username"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => toast.info("Para redefinir a senha, entre em contato com o suporte ou administrador.")}
                  className="auth-forgot"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="auth-input-wrap">
                <Lock className="auth-input-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="auth-input auth-input--pass"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-pass-toggle"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="auth-remember-row">
              <label
                onClick={() => setRemember(!remember)}
                className="auth-remember"
              >
                <div className={`auth-check ${remember ? "auth-check--on" : ""}`}>
                  {remember && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Manter conectado neste dispositivo</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit"
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Discreet application notice if active */}
          {hasApplication && application?.status === "pre_approved" && (
            <div className="auth-notice">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sua aplicação foi pré-aprovada. Fale pelo chat.</span>
            </div>
          )}

          {/* Partner / Affiliation Card */}
          <div className="auth-partner">
            <div className="auth-partner-text">
              <p className="auth-partner-title">Ainda não é um revendedor?</p>
              <p className="auth-partner-sub">Solicite credenciais para revender nossas ferramentas.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowApply(true)}
              className="auth-partner-btn"
            >
              Candidatar-se
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="auth-footer">
          <div className="auth-footer-meta">
            <span>Sessão Criptografada</span>
            <span className="auth-footer-sep">•</span>
            <span>IP Whitelist Ativo</span>
            <span className="auth-footer-sep">•</span>
            <span>SLA 99.98%</span>
          </div>
          <p className="auth-footer-copy">© 2026 VG SELLERS. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Apply Modal */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent
          className="text-white max-w-md border border-white/10 rounded-2xl p-6"
          style={{
            background: "#0c0d12",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-white text-lg font-bold tracking-tight">
              Candidatura de Revendedor
            </DialogTitle>
            <p className="text-xs text-zinc-400">
              Forneça as informações abaixo para análise da equipe e credenciamento oficial.
            </p>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Link do Servidor Discord
              </label>
              <Input
                value={form.discordLink}
                onChange={(e) => setForm(f => ({ ...f, discordLink: e.target.value }))}
                placeholder="https://discord.gg/..."
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Seu ID de Usuário do Discord
              </label>
              <Input
                value={form.discordId}
                onChange={(e) => setForm(f => ({ ...f, discordId: e.target.value }))}
                placeholder="Ex: 123456789012345678"
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                E-mail para Contato
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Produtos que pretende revender
              </label>
              <Input
                value={form.product}
                onChange={(e) => setForm(f => ({ ...f, product: e.target.value }))}
                placeholder="Ex: Cheats, Contas, Keys..."
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Proposta e Plano de Vendas
              </label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Conte um pouco sobre sua base de clientes, canais de venda e expectativa..."
                className="text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30 min-h-[85px] resize-none"
                required
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowApply(false)}
                className="flex-1 h-10 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submit.isPending}
                className="flex-1 h-10 rounded-lg bg-white text-zinc-950 text-xs font-semibold uppercase tracking-[0.05em] hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {submit.isPending ? "Enviando..." : "Enviar Candidatura"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Support Modal */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent
          className="text-white max-w-md border border-white/10 rounded-2xl p-6"
          style={{
            background: "#0c0d12",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-white text-lg font-bold tracking-tight">
              Suporte e Atendimento
            </DialogTitle>
            <p className="text-xs text-zinc-400">
              Envie sua dúvida ou solicitação diretamente para a administração.
            </p>
          </DialogHeader>
          <form onSubmit={handleSupport} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Seu Nome
              </label>
              <Input
                value={supportForm.name}
                onChange={(e) => setSupportForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Como podemos te chamar?"
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Seu E-mail
              </label>
              <Input
                type="email"
                value={supportForm.email}
                onChange={(e) => setSupportForm(f => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Assunto do Atendimento
              </label>
              <Input
                value={supportForm.subject}
                onChange={(e) => setSupportForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Ex: Dúvida sobre credenciamento, API, pagamentos..."
                className="h-10 text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Mensagem
              </label>
              <Textarea
                value={supportForm.question}
                onChange={(e) => setSupportForm(f => ({ ...f, question: e.target.value }))}
                placeholder="Descreva detalhadamente sua solicitação..."
                className="text-[13px] text-white bg-[#07080b] border border-white/10 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-white/30 min-h-[90px] resize-none"
                required
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSupport(false)}
                className="flex-1 h-10 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-300 hover:bg-white/[0.07] hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitSupport.isPending}
                className="flex-1 h-10 rounded-lg bg-white text-zinc-950 text-xs font-semibold uppercase tracking-[0.05em] hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {submitSupport.isPending ? "Enviando..." : "Abrir Ticket"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Application chat floating button */}
      {hasApplication && (
        <button
          onClick={() => setShowAppChat(true)}
          className="fixed bottom-6 right-6 z-50 h-11 px-4 rounded-full flex items-center gap-2.5 text-white shadow-2xl transition-all hover:scale-105 border border-white/15 bg-zinc-900"
          title="Atendimento de Credenciamento"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <MessageCircle className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold">Atendimento Ativo</span>
        </button>
      )}

      {/* Application Chat Dialog */}
      <Dialog open={showAppChat} onOpenChange={setShowAppChat}>
        <DialogContent
          className="text-white max-w-lg border border-white/10 rounded-2xl p-6"
          style={{
            background: "#0c0d12",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-zinc-300" /> Chat de Credenciamento
            </DialogTitle>
          </DialogHeader>

          {application?.status === "pre_approved" && (
            <div className="mb-3 rounded-lg p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sua candidatura foi pré-aprovada. Prossiga com o atendimento abaixo.</span>
            </div>
          )}

          <div
            ref={appScrollRef}
            className="h-[320px] overflow-y-auto space-y-3 pr-1 my-3"
          >
            {isLoadingApp ? (
              <p className="text-center text-zinc-500 text-xs py-10">Carregando mensagens...</p>
            ) : application?.messages?.length === 0 ? (
              <p className="text-center text-zinc-500 text-xs py-10">Aguarde a resposta da administração.</p>
            ) : (
              application?.messages?.map((msg: any) => {
                const isApplicant = msg.senderType === "applicant";
                return (
                  <div key={msg.id} className={`flex ${isApplicant ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${isApplicant ? "rounded-tr-xs bg-zinc-800 text-white" : "rounded-tl-xs bg-[#14161f] border border-white/10 text-zinc-200"}`}
                    >
                      <p className="text-[10px] text-zinc-400 mb-0.5 font-semibold uppercase">{isApplicant ? "Você" : "Admin"}</p>
                      <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 text-right">{formatDate(msg.createdAt)}</p>
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
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 bg-[#07080b] border-white/10 text-white placeholder:text-zinc-600 min-h-[50px] text-xs resize-none rounded-lg"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAppChatSend(e as any); } }}
                />
                <Button
                  type="submit"
                  disabled={sendAppMessage.isPending || !appChatText.trim()}
                  className="h-[50px] w-12 p-0 bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-center text-zinc-500 text-xs py-2 border-t border-white/10">Este chat está encerrado.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Support Chat Dialog */}
      <Dialog open={showSupportChat} onOpenChange={setShowSupportChat}>
        <DialogContent
          className="text-white max-w-lg border border-white/10 rounded-2xl p-6"
          style={{
            background: "#0c0d12",
            boxShadow: "0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <DialogHeader className="border-b border-white/10 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-zinc-300" /> Atendimento #{supportTicket?.id}
            </DialogTitle>
            <button
              onClick={() => {
                localStorage.removeItem(SUPPORT_STORAGE_KEY);
                setSupportId(null);
                setShowSupportChat(false);
                setShowSupport(true);
                setSupportForm({ name: "", email: "", subject: "", question: "" });
              }}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3 h-3" /> Novo ticket
            </button>
          </DialogHeader>

          <div
            ref={supportScrollRef}
            className="h-[320px] overflow-y-auto space-y-3 pr-1 my-3"
          >
            {isLoadingSupport ? (
              <p className="text-center text-zinc-500 text-xs py-10">Carregando mensagens...</p>
            ) : supportTicket?.messages?.length === 0 ? (
              <p className="text-center text-zinc-500 text-xs py-10">Aguarde a resposta da equipe técnica.</p>
            ) : (
              supportTicket?.messages?.map((msg: any) => {
                const isUser = msg.senderType === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${isUser ? "rounded-tr-xs bg-zinc-800 text-white" : "rounded-tl-xs bg-[#14161f] border border-white/10 text-zinc-200"}`}
                    >
                      <p className="text-[10px] text-zinc-400 mb-0.5 font-semibold uppercase">{isUser ? "Você" : "Suporte"}</p>
                      <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 text-right">{formatDate(msg.createdAt)}</p>
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
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 bg-[#07080b] border-white/10 text-white placeholder:text-zinc-600 min-h-[50px] text-xs resize-none rounded-lg"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSupportChatSend(e as any); } }}
                />
                <Button
                  type="submit"
                  disabled={sendSupportMessage.isPending || !supportChatText.trim()}
                  className="h-[50px] w-12 p-0 bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-center text-zinc-500 text-xs py-2 border-t border-white/10">Este ticket foi concluído.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
