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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    { enabled: !!applicationId }
  );

  const { data: supportTicket, isLoading: isLoadingSupport } = trpc.auth.getMySupportTicket.useQuery(
    { id: supportId || 0 },
    { enabled: !!supportId }
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
    resellerLogin.mutate({ username, password });
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Galaxy Background */}
      <div className="galaxy-bg">
        <div className="galaxy-shooting-star" />
        <div className="galaxy-shooting-star" style={{ animationDelay: "7s", top: "40%" }} />
        <div className="galaxy-shooting-star" style={{ animationDelay: "13s", top: "65%" }} />
      </div>
      <InteractiveStars />

      {/* Language switcher top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Glow orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%)", filter: "blur(100px)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 60%)", filter: "blur(120px)" }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            <img
              src={LOGO_URL}
              alt="Zenity Store"
              className="w-16 h-16 object-contain"
              style={{ filter: "drop-shadow(0 0 20px rgba(124,58,237,0.6))" }}
            />
            <div className="text-left">
              <h1 className="text-4xl font-black tracking-tight text-white leading-none">ZENITY</h1>
              <p className="text-sm font-bold tracking-[0.4em] mt-0.5" style={{ color: "#a78bfa" }}>STORE</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm">{t.login_title}</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgba(10,8,20,0.88)",
            backdropFilter: "blur(24px)",
            borderColor: "rgba(124,58,237,0.2)",
            boxShadow: "0 0 80px rgba(124,58,237,0.1), 0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Form */}
          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <LogIn className="w-4 h-4" style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-none">{t.login_reseller_access}</h2>
                <p className="text-gray-600 text-xs mt-0.5">{t.login_sign_in_desc}</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{t.login_username}</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.login_username_placeholder}
                  autoComplete="username"
                  className="h-11 text-white placeholder:text-gray-600 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
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
                    className="h-11 text-white placeholder:text-gray-600 pr-10 transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg font-semibold text-sm text-white mt-2 flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isLoading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
                  boxShadow: isLoading ? "none" : "0 4px 24px rgba(124,58,237,0.45), 0 1px 0 rgba(255,255,255,0.1) inset",
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

            <p className="text-center text-gray-700 text-xs mt-5">
              {t.login_secure_access}
            </p>
          </div>
        </div>

        {/* Apply button */}
        {!hasApplication && (
          <div className="mt-5 text-center">
            <Button
              onClick={() => setShowApply(true)}
              className="gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.35)" }}
            >
              <UserPlus className="w-4 h-4" /> Quero me tornar Reseller
            </Button>
          </div>
        )}

        {hasApplication && application?.status === "pre_approved" && (
          <div className="mt-5 text-center">
            <p className="text-green-400 text-sm font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Pré-aprovado! Clique no chat flutuante.
            </p>
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-6">
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
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
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
                style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
              >
                {submitSupport.isPending ? "Enviando..." : "Abrir ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Floating support button */}
      <button
        onClick={() => {
          if (hasSupport) {
            setShowSupportChat(true);
          } else {
            setShowSupport(true);
          }
        }}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-2xl transition-transform hover:scale-105"
        style={{
          background: hasSupport ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: hasSupport ? "0 4px 24px rgba(59,130,246,0.45)" : "none",
        }}
        title="Dúvidas"
      >
        <HelpCircle className="w-4 h-4" /> {hasSupport ? "Minha dúvida" : "Dúvidas"}
      </button>

      {/* Application chat floating button */}
      {hasApplication && (
        <button
          onClick={() => setShowAppChat(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110"
          style={{
            background: isPreApproved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #7c3aed, #8b5cf6)",
            boxShadow: isPreApproved ? "0 4px 24px rgba(34,197,94,0.45)" : "0 4px 24px rgba(124,58,237,0.45)",
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
                        background: isApplicant ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(139,92,246,0.1))" : "rgba(255,255,255,0.05)",
                        border: isApplicant ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)",
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
                  style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
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
              <HelpCircle className="w-5 h-5 text-blue-400" /> Dúvida #{supportTicket?.id}
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
              <HelpCircle className="w-3 h-3" /> Nova dúvida
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
