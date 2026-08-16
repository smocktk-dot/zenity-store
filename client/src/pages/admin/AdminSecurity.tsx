import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, Key, User, Eye, EyeOff, Shield, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Change Admin Password ────────────────────────────────────────────────────
function ChangeAdminPassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const change = trpc.admin.changeAdminPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha do admin alterada com sucesso!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Preencha todos os campos"); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Nova senha e confirmação não coincidem"); return;
    }
    if (form.newPassword.length < 6) {
      toast.error("Nova senha deve ter pelo menos 6 caracteres"); return;
    }
    change.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Shield className="w-4 h-4" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Senha do Administrador</h2>
          <p className="text-gray-500 text-xs">Altere a senha da sua conta admin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Senha Atual</label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="h-10 text-white placeholder:text-gray-600 pr-10"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Nova Senha</label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="h-10 text-white placeholder:text-gray-600 pr-10"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Confirmar Nova Senha</label>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Repita a nova senha"
            className="h-10 text-white placeholder:text-gray-600"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: form.confirmPassword && form.newPassword !== form.confirmPassword
                ? "1px solid rgba(239,68,68,0.5)"
                : "1px solid rgba(255,255,255,0.08)"
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
            onBlur={e => {
              e.currentTarget.style.borderColor = form.confirmPassword && form.newPassword !== form.confirmPassword
                ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)";
            }}
          />
          {form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-red-400 text-xs">As senhas não coincidem</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={change.isPending}
          className="w-full h-10 font-semibold text-sm text-white mt-2"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", border: "none" }}
        >
          {change.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Lock className="w-4 h-4 mr-2" />Alterar Senha do Admin</>
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Change Reseller Password ─────────────────────────────────────────────────
function ChangeResellerPassword() {
  const { data: resellers = [] } = trpc.admin.listResellers.useQuery();
  const [selectedId, setSelectedId] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [open, setOpen] = useState(false);

  const change = trpc.admin.changeResellerPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha do reseller alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
      setSelectedId("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { toast.error("Selecione um reseller"); return; }
    if (!newPassword || !confirmPassword) { toast.error("Preencha todos os campos"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (newPassword.length < 6) { toast.error("Nova senha deve ter pelo menos 6 caracteres"); return; }
    change.mutate({ resellerId: parseInt(selectedId), newPassword });
  };

  const selectedReseller = resellers.find(r => String(r.id) === selectedId);

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)" }}
        >
          <User className="w-4 h-4" style={{ color: "#fbbf24" }} />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Senha de Reseller</h2>
          <p className="text-gray-500 text-xs">Redefina a senha de qualquer reseller</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reseller selector */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Reseller</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="w-full h-10 px-3 rounded-lg text-sm flex items-center justify-between transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: selectedReseller ? "#fff" : "#4b5563" }}
            >
              <span>{selectedReseller ? selectedReseller.username : "Selecione um reseller..."}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#6b7280" }} />
            </button>
            {open && (
              <div
                className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: "#0d0b1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "200px", overflowY: "auto" }}
              >
                {resellers.length === 0 ? (
                  <div className="px-3 py-3 text-gray-500 text-sm text-center">Nenhum reseller cadastrado</div>
                ) : (
                  resellers.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setSelectedId(String(r.id)); setOpen(false); }}
                      className="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-all"
                      style={{ color: selectedId === String(r.id) ? "#c4b5fd" : "#d1d5db" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span>{r.username}</span>
                      <span className="text-xs" style={{ color: r.status === "active" ? "#4ade80" : "#f87171" }}>{r.status}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Nova Senha</label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-10 text-white placeholder:text-gray-600 pr-10"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Confirmar Nova Senha</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            className="h-10 text-white placeholder:text-gray-600"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: confirmPassword && newPassword !== confirmPassword
                ? "1px solid rgba(239,68,68,0.5)"
                : "1px solid rgba(255,255,255,0.08)"
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
            onBlur={e => {
              e.currentTarget.style.borderColor = confirmPassword && newPassword !== confirmPassword
                ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)";
            }}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-red-400 text-xs">As senhas não coincidem</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={change.isPending}
          className="w-full h-10 font-semibold text-sm text-white mt-2"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", border: "none" }}
        >
          {change.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Key className="w-4 h-4 mr-2" />Redefinir Senha do Reseller</>
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Lock className="w-5 h-5" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl">Segurança</h1>
          <p className="text-gray-500 text-sm">Gerencie senhas do admin e dos resellers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChangeAdminPassword />
        <ChangeResellerPassword />
      </div>
    </div>
  );
}
