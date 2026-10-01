import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ArrowLeft, Key, Users, Ban, ScrollText, Plus, Copy, Check, Trash2,
  Pause, Play, CalendarPlus, RotateCcw, ShieldBan, ShieldCheck, Download, X, KeyRound, ShieldAlert, Power
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const allTabs = [
  { id: "keys", label: "Licenses", icon: Key, authOnly: true },
  { id: "users", label: "Users", icon: Users, authOnly: false },
  { id: "bans", label: "Bans", icon: Ban, authOnly: false },
  { id: "protect", label: "Protect", icon: ShieldAlert, authOnly: false },
  { id: "dl", label: "Auto-Update", icon: Download, authOnly: false },
  { id: "logs", label: "Logs", icon: ScrollText, authOnly: false },
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    banned: "bg-red-500/15 text-red-400 border-red-500/25",
    revoked: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    expired: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${map[status] ?? map.expired}`}>{status}</span>;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); toast.success("Copiado"); setTimeout(() => setOk(false), 1500); }}
      className="text-gray-500 hover:text-emerald-400 transition-colors">
      {ok ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function AdminVgAuthApp({ id }: { id: number }) {
  const { data, refetch, isLoading } = trpc.vgauth.getAppDetail.useQuery({ id });
  const { data: protectLogs, refetch: refetchProtect } = trpc.vgauth.protectLogs.useQuery({ id });
  const [tab, setTab] = useState<string>("keys");

  // Generate keys modal state
  const [genOpen, setGenOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [mask, setMask] = useState("VG-******-******-******");
  const [uppercase, setUppercase] = useState(true);
  const [subLevel, setSubLevel] = useState("default");
  const [note, setNote] = useState("");
  const [durationUnit, setDurationUnit] = useState<"minutes"|"hours"|"days"|"weeks"|"months"|"years"|"lifetime">("days");
  const [durationValue, setDurationValue] = useState(30);
  const [generated, setGenerated] = useState<string[]>([]);

  // Ban form
  const [banIp, setBanIp] = useState("");
  const [banMb, setBanMb] = useState("");
  const [banCpu, setBanCpu] = useState("");
  const [banReason, setBanReason] = useState("");

  // Add days
  const [addDays, setAddDays] = useState(7);

  const gen = trpc.vgauth.generateKeys.useMutation({
    onSuccess: d => { setGenerated(d.keys); toast.success(`${d.keys.length} key(s) geradas`); refetch(); },
    onError: e => toast.error(e.message),
  });
  const setStatus = trpc.vgauth.setLicenseStatus.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const resetHwid = trpc.vgauth.resetLicenseHwid.useMutation({ onSuccess: () => { toast.success("HWID resetado"); refetch(); }, onError: e => toast.error(e.message) });
  const delLic = trpc.vgauth.deleteLicense.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const banUser = trpc.vgauth.banUser.useMutation({ onSuccess: () => { toast.success("Usuário banido (IP + HWIDs registrados)"); refetch(); }, onError: e => toast.error(e.message) });
  const setPass = trpc.vgauth.setUserPassword.useMutation({ onSuccess: () => { toast.success("Senha alterada"); refetch(); }, onError: e => toast.error(e.message) });
  const unbanUser = trpc.vgauth.unbanUser.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const resetUserHwid = trpc.vgauth.resetUserHwid.useMutation({ onSuccess: () => { toast.success("HWID do usuário resetado"); refetch(); }, onError: e => toast.error(e.message) });
  const delUser = trpc.vgauth.deleteUser.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const pauseAll = trpc.vgauth.pauseAllKeys.useMutation({ onSuccess: d => { toast.success(`${d.count} keys pausadas`); refetch(); }, onError: e => toast.error(e.message) });
  const resumeAll = trpc.vgauth.resumeAllKeys.useMutation({ onSuccess: d => { toast.success(`${d.count} keys retomadas`); refetch(); }, onError: e => toast.error(e.message) });
  const addDaysAll = trpc.vgauth.addDaysAllKeys.useMutation({ onSuccess: d => { toast.success(`+${addDays}d adicionados em ${d.count} keys`); refetch(); }, onError: e => toast.error(e.message) });
  const createBan = trpc.vgauth.createBan.useMutation({
    onSuccess: () => { toast.success("Ban registrado"); setBanIp(""); setBanMb(""); setBanCpu(""); setBanReason(""); refetch(); },
    onError: e => toast.error(e.message),
  });
  const deleteBan = trpc.vgauth.deleteBan.useMutation({ onSuccess: () => refetch(), onError: e => toast.error(e.message) });
  const banProtect = trpc.vgauth.banProtectTarget.useMutation({
    onSuccess: () => { toast.success("Alvo banido (conta + key + IP + HWIDs)"); refetch(); refetchProtect(); },
    onError: e => toast.error(e.message),
  });
  const unbanProtect = trpc.vgauth.unbanProtectTarget.useMutation({
    onSuccess: d => { toast.success(`Desbanido — ${d.removed} ban(s) removido(s)`); refetch(); refetchProtect(); },
    onError: e => toast.error(e.message),
  });
  const shutdownProtect = trpc.vgauth.shutdownTarget.useMutation({
    onSuccess: (_d, vars) => {
      toast.success(vars.active
        ? "Shutdown marcado — o PC do alvo desliga na próxima resposta do servidor"
        : "Shutdown cancelado");
      refetchProtect();
    },
    onError: e => toast.error(e.message),
  });
  const [protectSub, setProtectSub] = useState<string>("all");

  // Auto-update / distribuição
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [dlVersion, setDlVersion] = useState("");
  const uploadBuild = trpc.vgauth.uploadVgauthBuild.useMutation({
    onSuccess: d => {
      toast.success(`Build v${d.version} publicada (${(d.size / 1024 / 1024).toFixed(1)} MB) — clientes atualizam na próxima execução`);
      setDlFile(null); setDlVersion(""); refetch();
    },
    onError: e => toast.error(e.message),
  });
  const [uploading, setUploading] = useState(false);
  const publishBuild = () => {
    if (!dlFile) return toast.error("Selecione o .exe");
    const ver = dlVersion.trim() || new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1] || "";
      uploadBuild.mutate({ id, fileName: dlFile.name, version: ver, data: b64 },
        { onSettled: () => setUploading(false) });
    };
    reader.onerror = () => { setUploading(false); toast.error("Falha ao ler arquivo"); };
    reader.readAsDataURL(dlFile);
  };

  if (isLoading || !data) {
    return <div className="p-6 text-gray-500">Carregando...</div>;
  }
  const { app, licenses, users, bans, logs } = data as any;
  const isLoader = app.type === "loader";
  const tabs = allTabs.filter(t => !t.authOnly || !isLoader);
  const activeTab = isLoader && tab === "keys" ? "users" : tab;

  const th = "text-left px-4 py-3 text-gray-400 text-[11px] font-semibold uppercase tracking-widest";
  const td = "px-4 py-3 text-sm";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/vg-auth">
            <button className="p-2 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white transition-all"><ArrowLeft className="w-4 h-4" /></button>
          </Link>
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              {app.name}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${isLoader ? "bg-violet-500/10 text-violet-400 border-violet-500/25" : "bg-blue-500/10 text-blue-400 border-blue-500/25"}`}>
                {isLoader ? "MULTI LOADER" : "AUTH"}
              </span>
            </h1>
            <p className="text-gray-500 text-sm">v{app.version} • {isLoader ? `${users.length} contas` : `${licenses.length} keys • ${users.length} usuários`}</p>
          </div>
        </div>
        {!isLoader && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setGenOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all">
              <Plus className="w-4 h-4" /> Gerar Keys
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions — só apps auth */}
      {!isLoader && (
        <div className="rounded-2xl border border-white/[0.06] p-4 flex flex-wrap items-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
          <span className="text-gray-500 text-xs uppercase font-semibold">Ações em massa:</span>
          <button onClick={() => { if (confirm("Pausar o tempo de TODAS as keys?")) pauseAll.mutate({ appId: id }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-all">
            <Pause className="w-3 h-3" /> Pausar todas
          </button>
          <button onClick={() => resumeAll.mutate({ appId: id })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all">
            <Play className="w-3 h-3" /> Retomar todas
          </button>
          <div className="flex items-center gap-2">
            <Input type="number" value={addDays} onChange={e => setAddDays(parseInt(e.target.value) || 0)}
              className="w-20 h-8 bg-white/[0.03] border-white/[0.08] text-white text-xs" />
            <button onClick={() => { if (confirm(`Adicionar ${addDays} dias em TODAS as keys?`)) addDaysAll.mutate({ appId: id, days: addDays }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25 hover:bg-blue-500/20 transition-all">
              <CalendarPlus className="w-3 h-3" /> +dias todas
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-px">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${activeTab === t.id ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── KEYS ── */}
      {activeTab === "keys" && (
        <div className="rounded-3xl border border-white/[0.06] overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Key", "Sub", "Duração", "Status", "Usado por", "HWID MB", "HWID CPU", "Expira", "Ações"].map(h => <th key={h} className={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-600">Nenhuma key — clique em "Gerar Keys"</td></tr>
              ) : licenses.map((k: any) => (
                <tr key={k.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className={td}><div className="flex items-center gap-2"><code className="text-gray-300 text-xs font-mono">{k.keyValue}</code><CopyBtn text={k.keyValue} /></div></td>
                  <td className={`${td} text-gray-400`}>{k.subLevel}</td>
                  <td className={`${td} text-gray-400`}>{k.durationUnit === "lifetime" ? "Lifetime" : `${k.durationValue} ${k.durationUnit}`}</td>
                  <td className={td}>{k.paused ? <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase bg-amber-500/15 text-amber-400 border-amber-500/25">pausada</span> : <StatusBadge status={k.status} />}</td>
                  <td className={`${td} text-gray-400`}>{k.usedBy || <span className="text-gray-600">—</span>}</td>
                  <td className={`${td} text-gray-500 font-mono text-xs`}>{k.hwidMb ? k.hwidMb.slice(0, 12) + "…" : "—"}</td>
                  <td className={`${td} text-gray-500 font-mono text-xs`}>{k.hwidCpu ? k.hwidCpu.slice(0, 12) + "…" : "—"}</td>
                  <td className={`${td} text-gray-500 text-xs`}>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString("pt-BR") : "∞"}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => resetHwid.mutate({ id: k.id })} title="Reset HWID"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
                      {k.status !== "banned" ? (
                        <button onClick={() => setStatus.mutate({ id: k.id, status: "banned" })} title="Banir key"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><ShieldBan className="w-3.5 h-3.5" /></button>
                      ) : (
                        <button onClick={() => setStatus.mutate({ id: k.id, status: "active" })} title="Desbanir"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><ShieldCheck className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => { if (confirm("Deletar key?")) delLic.mutate({ id: k.id }); }} title="Deletar"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === "users" && (
        <div className="rounded-3xl border border-white/[0.06] overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {[...(isLoader ? ["Usuário", "Email", "Senha"] : ["Usuário", "Email", "Sub"]), "Status", "HWID MB", "HWID CPU", "IP", "Último login", "Ações"].map(h => <th key={h} className={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-600">Nenhum usuário registrado</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className={`${td} text-gray-300 font-medium`}>{u.username}</td>
                  <td className={`${td} text-gray-400`}>{u.email || "—"}</td>
                  {isLoader ? (
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <code className="text-amber-400 text-xs font-mono">{u.passwordPlain || "—"}</code>
                        {u.passwordPlain && <CopyBtn text={u.passwordPlain} />}
                      </div>
                    </td>
                  ) : (
                    <td className={`${td} text-gray-400`}>{u.subLevel}</td>
                  )}
                  <td className={td}><StatusBadge status={u.status} /></td>
                  <td className={`${td} text-gray-500 font-mono text-xs`}>{u.hwidMb ? u.hwidMb.slice(0, 12) + "…" : "—"}</td>
                  <td className={`${td} text-gray-500 font-mono text-xs`}>{u.hwidCpu ? u.hwidCpu.slice(0, 12) + "…" : "—"}</td>
                  <td className={`${td} text-gray-500 text-xs`}>{u.ip || "—"}</td>
                  <td className={`${td} text-gray-500 text-xs`}>{u.lastLogin ? new Date(u.lastLogin).toLocaleString("pt-BR") : "—"}</td>
                  <td className={td}>
                    <div className="flex items-center gap-1">
                      {isLoader && (
                        <button onClick={() => { const p = prompt(`Nova senha para "${u.username}":`); if (p) setPass.mutate({ userId: u.id, appId: id, password: p }); }}
                          title="Trocar senha"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"><KeyRound className="w-3.5 h-3.5" /></button>
                      )}
                      {(u.hwidMb || u.hwidCpu) && (
                        <button onClick={() => { if (confirm(`Resetar HWID de ${u.username}?`)) resetUserHwid.mutate({ userId: u.id, appId: id }); }}
                          title="Resetar HWID (placa-mãe + CPU)"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
                      )}
                      {u.status !== "banned" ? (
                        <button onClick={() => { if (confirm(`Banir ${u.username}? IP + HWIDs serão bloqueados globalmente.`)) banUser.mutate({ userId: u.id, appId: id }); }}
                          title="Banir (IP + HWID MB + HWID CPU)"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><ShieldBan className="w-3.5 h-3.5" /></button>
                      ) : (
                        <button onClick={() => unbanUser.mutate({ userId: u.id, appId: id })} title="Desbanir"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><ShieldCheck className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => { if (confirm(`Deletar ${u.username}?`)) delUser.mutate({ userId: u.id }); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── BANS ── */}
      {activeTab === "bans" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/15 p-4 space-y-3" style={{ background: "rgba(239,68,68,0.03)" }}>
            <h3 className="text-white text-sm font-semibold">Banir identificador manualmente</h3>
            <p className="text-gray-500 text-xs">O ban vale para <span className="text-red-400 font-semibold">todos os apps</span> da VG Auth — o banido não loga nem com outra key.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input value={banIp} onChange={e => setBanIp(e.target.value)} placeholder="IP" className="bg-white/[0.03] border-white/[0.08] text-white text-xs placeholder:text-gray-600" />
              <Input value={banMb} onChange={e => setBanMb(e.target.value)} placeholder="HWID Placa-mãe" className="bg-white/[0.03] border-white/[0.08] text-white text-xs placeholder:text-gray-600" />
              <Input value={banCpu} onChange={e => setBanCpu(e.target.value)} placeholder="HWID CPU" className="bg-white/[0.03] border-white/[0.08] text-white text-xs placeholder:text-gray-600" />
              <Input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Motivo" className="bg-white/[0.03] border-white/[0.08] text-white text-xs placeholder:text-gray-600" />
            </div>
            <button onClick={() => createBan.mutate({ appId: id, ip: banIp || undefined, hwidMb: banMb || undefined, hwidCpu: banCpu || undefined, reason: banReason || undefined })}
              disabled={!banIp && !banMb && !banCpu}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold transition-all">
              Registrar Ban
            </button>
          </div>

          <div className="rounded-3xl border border-white/[0.06] overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Usuário", "IP", "HWID MB", "HWID CPU", "Motivo", "Origem", "Data", ""].map(h => <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {bans.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-600">Nenhum ban registrado</td></tr>
                ) : bans.map((b: any) => (
                  <tr key={b.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className={`${td} text-gray-300`}>{b.username || "—"}</td>
                    <td className={`${td} text-gray-400 font-mono text-xs`}>{b.ip || "—"}</td>
                    <td className={`${td} text-gray-500 font-mono text-xs`}>{b.hwidMb ? b.hwidMb.slice(0, 14) + "…" : "—"}</td>
                    <td className={`${td} text-gray-500 font-mono text-xs`}>{b.hwidCpu ? b.hwidCpu.slice(0, 14) + "…" : "—"}</td>
                    <td className={`${td} text-gray-400 text-xs`}>{b.reason || "—"}</td>
                    <td className={`${td} text-gray-500 text-xs`}>{b.createdBy}</td>
                    <td className={`${td} text-gray-500 text-xs`}>{new Date(b.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className={td}>
                      <button onClick={() => deleteBan.mutate({ id: b.id })} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {activeTab === "logs" && (
        <div className="rounded-3xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {logs.length === 0 ? (
            <p className="text-center py-10 text-gray-600">Sem logs ainda</p>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
              {logs.map((l: any) => (
                <div key={l.id} className="px-5 py-3 flex items-center gap-4 text-sm hover:bg-white/[0.02]">
                  <span className="text-gray-600 text-xs font-mono w-36 flex-shrink-0">{new Date(l.createdAt).toLocaleString("pt-BR")}</span>
                  <span className="text-emerald-400 text-xs font-mono w-40 flex-shrink-0">{l.action}</span>
                  <span className="text-gray-400 text-xs flex-1 truncate">{l.detail || "—"}</span>
                  <span className="text-gray-600 text-xs font-mono">{l.ip || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROTECT LOGS (deteccoes anti-tamper do cliente) ── */}
      {activeTab === "protect" && (() => {
        const subTabs = [
          { id: "all", label: "Todos" },
          { id: "alerts", label: "Alertas" },
          { id: "rejected", label: "PTK rejeitado" },
          { id: "bans", label: "Bans" },
        ];
        const filtered = (protectLogs || []).filter((l: any) =>
          protectSub === "all" ? true :
          protectSub === "alerts" ? l.action === "protect.alert" :
          protectSub === "rejected" ? l.action === "protect.ptk_rejected" :
          ["protect.auto_ban", "protect.ban", "protect.unban"].includes(l.action));
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/15 p-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.03)" }}>
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-white text-sm font-semibold">Detecções de proteção</h3>
                <p className="text-gray-500 text-xs">
                  Alertas enviados pelo cliente quando o anti-debug/anti-tamper dispara, quando o ptk é rejeitado
                  ou quando o auto-ban (3+ alertas em 24h) entra em ação.
                </p>
              </div>
            </div>

            {/* Mini-abas */}
            <div className="flex gap-1.5">
              {subTabs.map(s => {
                const count = s.id === "all" ? (protectLogs?.length ?? 0)
                  : (protectLogs || []).filter((l: any) =>
                      s.id === "alerts" ? l.action === "protect.alert" :
                      s.id === "rejected" ? l.action === "protect.ptk_rejected" :
                      ["protect.auto_ban", "protect.ban", "protect.unban"].includes(l.action)).length;
                return (
                  <button key={s.id} onClick={() => setProtectSub(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      protectSub === s.id
                        ? "bg-red-500/15 text-red-400 border border-red-500/25"
                        : "text-gray-500 hover:text-gray-300 border border-white/[0.06]"}`}>
                    {s.label} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-3xl border border-white/[0.06] overflow-x-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Data", "Evento", "Check", "Usuário", "Discord ID", "Key", "HWID MB", "HWID CPU", "IP", "Print", "Detalhe", ""].map(h => <th key={h} className={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={12} className="text-center py-10 text-gray-600">Nenhuma detecção — tudo limpo</td></tr>
                  ) : filtered.map((l: any) => {
                    const a = l.alert || {};
                    const isAlert = l.action === "protect.alert";
                    const isBan = ["protect.auto_ban", "protect.ban"].includes(l.action);
                    const isUnban = l.action === "protect.unban";
                    const hasIds = a.username || a.hwidMb || a.hwidCpu || a.key || l.ip;
                    const sdOn = !!l.shutdownActive;
                    return (
                      <tr key={l.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        <td className={`${td} text-gray-500 text-xs font-mono whitespace-nowrap`}>{new Date(l.createdAt).toLocaleString("pt-BR")}</td>
                        <td className={td}>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${
                            isBan ? "bg-red-500/15 text-red-400 border-red-500/25"
                            : isUnban ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : isAlert ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                            : "bg-violet-500/15 text-violet-400 border-violet-500/25"}`}>
                            {l.action.replace("protect.", "")}
                          </span>
                        </td>
                        <td className={`${td} text-red-300 font-mono text-xs`}>{a.check || "—"}</td>
                        <td className={`${td} text-gray-300`}>{a.username || "—"}</td>
                        <td className={`${td} font-mono text-xs`}>
                          {a.discordId ? (
                            <span className="text-indigo-300 flex items-center gap-1" title="Discord ID coletado no alerta">
                              {a.discordId} <CopyBtn text={a.discordId} />
                            </span>
                          ) : "—"}
                        </td>
                        <td className={`${td} text-gray-400 font-mono text-xs`}>{a.key ? a.key.slice(0, 12) + "…" : "—"}</td>
                        <td className={`${td} text-gray-500 font-mono text-xs`}>{a.hwidMb ? a.hwidMb.slice(0, 12) + "…" : "—"}</td>
                        <td className={`${td} text-gray-500 font-mono text-xs`}>{a.hwidCpu ? a.hwidCpu.slice(0, 12) + "…" : "—"}</td>
                        <td className={`${td} text-gray-400 font-mono text-xs`}>{l.ip || "—"}</td>
                        <td className={td}>
                          {a.shotUrl ? (
                            <a href={a.shotUrl} target="_blank" rel="noopener noreferrer" title="Abrir print em tela cheia">
                              <img src={a.shotUrl} alt="Print da tela no momento da detecção"
                                className="w-20 h-12 rounded-lg object-cover border border-red-500/25 hover:border-red-400/60 transition-all" />
                            </a>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className={`${td} text-gray-500 text-xs max-w-[220px] truncate`} title={a.detail || l.detail || ""}>{a.detail || l.detail || "—"}</td>
                        <td className={td}>
                          <div className="flex items-center gap-1.5">
                            {hasIds && !isUnban && (
                              <button
                                onClick={() => {
                                  if (confirm(`Banir ${a.username || l.ip}? Ban global (IP + HWIDs) + conta/key banidas.`))
                                    banProtect.mutate({
                                      appId: id,
                                      username: a.username || undefined,
                                      ip: l.ip || undefined,
                                      hwidMb: a.hwidMb || undefined,
                                      hwidCpu: a.hwidCpu || undefined,
                                      keyValue: a.key || undefined,
                                      reason: `protect: ${a.check || "detection"}`,
                                    });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-all">
                                <ShieldBan className="w-3 h-3" /> Banir
                              </button>
                            )}
                            {hasIds && !isUnban && (
                              <button
                                onClick={() => {
                                  const msg = sdOn
                                    ? `Cancelar shutdown de ${a.username || l.ip}? O PC para de desligar.`
                                    : `ShutDown em ${a.username || l.ip}? Na próxima resposta do servidor (login/check) o cliente .hpp executa shutdown /s /f e desliga o PC. Requer o .hpp atualizado.`;
                                  if (confirm(msg))
                                    shutdownProtect.mutate({
                                      appId: id,
                                      username: a.username || undefined,
                                      ip: l.ip || undefined,
                                      hwidMb: a.hwidMb || undefined,
                                      hwidCpu: a.hwidCpu || undefined,
                                      active: !sdOn,
                                    });
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  sdOn
                                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20"}`}>
                                <Power className="w-3 h-3" /> {sdOn ? "SD ATIVO" : "ShutDown"}
                              </button>
                            )}
                            {hasIds && (
                              <button
                                onClick={() => {
                                  if (confirm(`Desbanir ${a.username || l.ip}? Reativa conta/key e remove os bans globais.`))
                                    unbanProtect.mutate({
                                      appId: id,
                                      username: a.username || undefined,
                                      ip: l.ip || undefined,
                                      hwidMb: a.hwidMb || undefined,
                                      hwidCpu: a.hwidCpu || undefined,
                                    });
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all">
                                <ShieldCheck className="w-3 h-3" /> Desbanir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ── AUTO-UPDATE / DISTRIBUIÇÃO ── */}
      {activeTab === "dl" && (() => {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://vgsellers.lat";
        const dlBase = `${origin}/api/vgauth/dl/${app.ownerId}`;
        const oneLiner = `irm ${dlBase}/get.ps1 | iex`;
        const b64cmd = (() => {
          const ps = `iex(irm "${dlBase}/get.ps1" -UseBasicParsing)`;
          const bytes: number[] = [];
          for (let i = 0; i < ps.length; i++) { const c = ps.charCodeAt(i); bytes.push(c & 0xff, c >> 8); }
          return `powershell -NoP -e ${btoa(String.fromCharCode(...bytes))}`;
        })();
        const updateScript = `# VG AUTH UPDATE — ${app.name}
$ownerid = '${app.ownerId}'
$secret  = '${app.secret}'
$file    = '.\\app.exe'   # caminho do exe compilado
$version = Get-Date -Format 'yyyyMMddHHmm'
$b64  = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $file)))
$body = @{ ownerid=$ownerid; secret=$secret; filename=(Split-Path $file -Leaf); version=$version; data=$b64 } | ConvertTo-Json -Compress
$r = Invoke-RestMethod '${origin}/api/vgauth/upload' -Method Post -ContentType 'application/json' -Body $body
if ($r.success) { "Publicado v$version — clientes atualizam na proxima execucao" } else { $r }`;
        const Code = ({ label, text, mono = true }: { label: string; text: string; mono?: boolean }) => (
          <div>
            <p className="text-gray-500 text-[11px] uppercase font-semibold mb-1.5">{label}</p>
            <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5" style={{ background: "rgba(0,0,0,0.3)" }}>
              <code className={`flex-1 text-xs text-emerald-300/90 break-all ${mono ? "font-mono" : ""}`}>{text}</code>
              <CopyBtn text={text} />
            </div>
          </div>
        );
        return (
          <div className="space-y-4">
            {/* Status do build atual */}
            <div className="rounded-2xl border border-white/[0.06] p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10"><Download className="w-5 h-5 text-emerald-400" /></div>
                  <div>
                    <h3 className="text-white text-sm font-semibold">Distribuição / Auto-Update</h3>
                    <p className="text-gray-500 text-xs">
                      {app.dlUrl
                        ? `Build atual: v${app.dlVersion} • ${app.dlFileName} • ${((app.dlSize || 0) / 1024 / 1024).toFixed(1)} MB • ${app.dlUpdatedAt ? new Date(app.dlUpdatedAt).toLocaleString("pt-BR") : ""}`
                        : "Nenhum build publicado ainda — faça o primeiro upload"}
                    </p>
                  </div>
                </div>
              </div>
              {app.dlUrl && (
                <div className="grid gap-3">
                  <Code label="Executável" text={`${dlBase}/app.exe`} />
                  <Code label="Versão" text={`${dlBase}/version.txt`} />
                  <Code label="Bootstrap (get.ps1)" text={`${dlBase}/get.ps1`} />
                </div>
              )}
            </div>

            {/* Comando pro usuário final */}
            {app.dlUrl && (
              <div className="rounded-2xl border border-emerald-500/15 p-5 space-y-3" style={{ background: "rgba(16,185,129,0.03)" }}>
                <h3 className="text-white text-sm font-semibold">Comando pro usuário final</h3>
                <Code label="Curto" text={oneLiner} />
                <Code label="Ofuscado (base64 — não expõe a URL)" text={b64cmd} />
                <p className="text-gray-600 text-[11px]">O cliente roda uma vez → baixa o exe pra %LOCALAPPDATA% e auto-atualiza sozinho em toda execução futura.</p>
              </div>
            )}

            {/* Publicar novo build */}
            <div className="rounded-2xl border border-white/[0.06] p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-white text-sm font-semibold">Publicar novo build</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px]">
                  <label className="text-gray-400 text-xs font-semibold uppercase">Arquivo (.exe)</label>
                  <input type="file" onChange={e => setDlFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/15 file:text-emerald-400 file:px-3 file:py-2 file:text-xs file:font-semibold hover:file:bg-emerald-500/25 file:cursor-pointer" />
                </div>
                <div className="w-48">
                  <label className="text-gray-400 text-xs font-semibold uppercase">Versão</label>
                  <Input value={dlVersion} onChange={e => setDlVersion(e.target.value)} placeholder="yyyyMMddHHmm (auto)"
                    className="mt-1 bg-white/[0.03] border-white/[0.08] text-white font-mono text-xs" />
                </div>
                <button onClick={publishBuild} disabled={uploading || !dlFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold transition-all">
                  <Download className="w-4 h-4" /> {uploading ? "Enviando..." : "Publicar"}
                </button>
              </div>
              <p className="text-gray-600 text-[11px]">Máx ~40 MB. Todo cliente atualiza na próxima execução do get.ps1.</p>
            </div>

            {/* update-app.ps1 */}
            <div className="rounded-2xl border border-white/[0.06] p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-semibold">update-app.ps1 (publicar sem abrir o painel)</h3>
                <CopyBtn text={updateScript} />
              </div>
              <pre className="text-[11px] font-mono text-gray-400 bg-black/30 rounded-xl p-4 overflow-x-auto border border-white/[0.06]">{updateScript}</pre>
              <p className="text-gray-600 text-[11px]">Salve como update-app.ps1 ao lado do exe compilado e rode toda vez que buildar — sobe o arquivo e bumpeia a versão automaticamente.</p>
            </div>
          </div>
        );
      })()}

      {/* ── GENERATE KEYS MODAL (estilo KeyAuth) ── */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: "#0d0d14" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-white text-lg font-bold">Gerar novas keys</h2>
              <button onClick={() => { setGenOpen(false); setGenerated([]); }} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {generated.length === 0 ? (
              <>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase">Quantidade</label>
                  <Input type="number" min={1} max={500} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)}
                    className="mt-1 bg-white/[0.03] border-white/[0.08] text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase">Máscara da key <span className="text-gray-600 normal-case">(* = caractere aleatório)</span></label>
                  <Input value={mask} onChange={e => setMask(e.target.value)} placeholder="VG-******-******"
                    className="mt-1 bg-white/[0.03] border-white/[0.08] text-white font-mono" />
                  <label className="flex items-center gap-2 mt-2 text-gray-400 text-xs cursor-pointer">
                    <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="accent-emerald-500" />
                    Letras maiúsculas (A-Z)
                  </label>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase">Subscription Level</label>
                  <Input value={subLevel} onChange={e => setSubLevel(e.target.value)}
                    className="mt-1 bg-white/[0.03] border-white/[0.08] text-white" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase">Nota (opcional)</label>
                  <Input value={note} onChange={e => setNote(e.target.value)}
                    className="mt-1 bg-white/[0.03] border-white/[0.08] text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase">Unidade</label>
                    <select value={durationUnit} onChange={e => setDurationUnit(e.target.value as any)}
                      className="mt-1 w-full h-10 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white text-sm px-3">
                      {["minutes", "hours", "days", "weeks", "months", "years", "lifetime"].map(u => <option key={u} value={u} className="bg-[#0d0d14]">{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase">Duração</label>
                    <Input type="number" min={0} value={durationValue} onChange={e => setDurationValue(parseInt(e.target.value) || 0)}
                      disabled={durationUnit === "lifetime"}
                      className="mt-1 bg-white/[0.03] border-white/[0.08] text-white disabled:opacity-40" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setGenOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-300 text-sm font-semibold hover:bg-white/[0.08] transition-all">Cancelar</button>
                  <button
                    onClick={() => gen.mutate({ appId: id, amount, mask, subLevel, durationValue, durationUnit, uppercase, note: note || undefined })}
                    disabled={gen.isPending || !mask.includes("*")}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold transition-all">
                    {gen.isPending ? "Gerando..." : "Gerar Keys"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm">{generated.length} key(s) criadas — copie antes de fechar:</p>
                <div className="rounded-xl border border-white/[0.08] p-3 max-h-64 overflow-y-auto space-y-1" style={{ background: "rgba(0,0,0,0.3)" }}>
                  {generated.map(k => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <code className="text-emerald-400 text-xs font-mono">{k}</code>
                      <CopyBtn text={k} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(generated.join("\n")); toast.success("Todas copiadas"); }}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-300 text-sm font-semibold hover:bg-white/[0.08] transition-all">Copiar todas</button>
                  <button onClick={() => { setGenOpen(false); setGenerated([]); }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all">Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
