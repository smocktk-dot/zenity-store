import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ShieldCheck, Plus, Copy, Check, Trash2, RefreshCw, Key, Users, Ban, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminVgAuth() {
  const { data: apps = [], refetch, isLoading } = trpc.vgauth.listApps.useQuery();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [appType, setAppType] = useState<"auth" | "loader">("auth");
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<number, boolean>>({});

  const createApp = trpc.vgauth.createApp.useMutation({
    onSuccess: () => { toast.success("Aplicação criada"); setCreating(false); setName(""); refetch(); },
    onError: e => toast.error(e.message),
  });
  const deleteApp = trpc.vgauth.deleteApp.useMutation({
    onSuccess: () => { toast.success("Aplicação removida"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const regenSecret = trpc.vgauth.regenerateSecret.useMutation({
    onSuccess: () => { toast.success("Secret regenerada"); refetch(); },
    onError: e => toast.error(e.message),
  });
  const regenSignKey = trpc.vgauth.regenerateSigningKey.useMutation({
    onSuccess: () => { toast.success("Chave de assinatura rotacionada — atualize a Pub Key nos loaders"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const copy = (id: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> VG Auth
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de autenticação para seus apps C++ e sites — keys, HWID, bans e logs</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Aplicação
        </button>
      </div>

      {creating && (
        <div className="rounded-3xl border border-emerald-500/20 p-5 space-y-4" style={{ background: "rgba(16,185,129,0.04)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Criar aplicação</h3>
            <button onClick={() => setCreating(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAppType("auth")}
              className={`rounded-2xl border p-4 text-left transition-all ${appType === "auth" ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}
            >
              <p className={`text-sm font-semibold ${appType === "auth" ? "text-emerald-400" : "text-gray-300"}`}>Auth Completo</p>
              <p className="text-gray-500 text-xs mt-1">Sistema de keys, licenças, HWID, sub-levels e duração — estilo KeyAuth</p>
            </button>
            <button
              onClick={() => setAppType("loader")}
              className={`rounded-2xl border p-4 text-left transition-all ${appType === "loader" ? "border-violet-500/40 bg-violet-500/10" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`}
            >
              <p className={`text-sm font-semibold ${appType === "loader" ? "text-violet-400" : "text-gray-300"}`}>Multi Loader</p>
              <p className="text-gray-500 text-xs mt-1">Sem keys — só contas. Armazena usuário, email e senha; ban e troca de senha</p>
            </button>
          </div>
          <div className="flex gap-3">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={appType === "loader" ? "Nome (ex: MULTI LOADER)" : "Nome da aplicação (ex: Meu Cheat, Meu Site)"}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600"
            />
            <button
              onClick={() => createApp.mutate({ name, type: appType })}
              disabled={name.trim().length < 2 || createApp.isPending}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold whitespace-nowrap transition-all"
            >
              Criar
            </button>
          </div>
          <p className="text-gray-500 text-xs">Um <span className="text-gray-300">Owner ID</span> e uma <span className="text-gray-300">Secret</span> serão gerados automaticamente.</p>
        </div>
      )}

      <div className="rounded-3xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        {isLoading ? (
          <p className="text-center py-10 text-gray-600">Carregando...</p>
        ) : apps.length === 0 ? (
          <div className="text-center py-14">
            <ShieldCheck className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma aplicação criada</p>
            <p className="text-gray-600 text-sm mt-1">Crie sua primeira aplicação para começar a gerar keys</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {apps.map((a: any) => (
              <div key={a.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/vg-auth/${a.id}`}>
                        <span className="text-white font-semibold text-lg hover:text-emerald-400 cursor-pointer transition-colors">{a.name}</span>
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${a.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-red-500/10 text-red-400 border-red-500/25"}`}>
                        {a.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${a.type === "loader" ? "bg-violet-500/10 text-violet-400 border-violet-500/25" : "bg-blue-500/10 text-blue-400 border-blue-500/25"}`}>
                        {a.type === "loader" ? "LOADER" : "AUTH"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-white/[0.04] text-gray-400 border-white/[0.08]">v{a.version}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-gray-500 text-[10px] uppercase font-semibold w-14">Owner</span>
                        <code className="text-gray-300 text-xs font-mono truncate flex-1">{a.ownerId}</code>
                        <button onClick={() => copy(`o${a.id}`, a.ownerId, "Owner ID")} className="text-gray-500 hover:text-emerald-400 transition-colors">
                          {copied === `o${a.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
                        <span className="text-emerald-500/80 text-[10px] uppercase font-semibold w-14">Pub Key</span>
                        <code className="text-gray-300 text-xs font-mono truncate flex-1">
                          {a.signPublicKey || "—"}
                        </code>
                        {a.signPublicKey && (
                          <button onClick={() => copy(`p${a.id}`, a.signPublicKey, "Pub Key")} className="text-gray-500 hover:text-emerald-400 transition-colors" title="Copiar — vai no loader no lugar do secret">
                            {copied === `p${a.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm("Rotacionar a chave de assinatura? Todos os loaders com a Pub Key antiga param de validar — só faça ao rebuildar/redistribuir.")) regenSignKey.mutate({ id: a.id }); }}
                          className="text-gray-500 hover:text-amber-400 transition-colors" title="Rotacionar chave de assinatura"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="text-gray-500 text-[10px] uppercase font-semibold w-14">Secret</span>
                        <code className="text-gray-300 text-xs font-mono truncate flex-1">
                          {showSecret[a.id] ? a.secret : "•".repeat(24)}
                        </code>
                        <button onClick={() => setShowSecret(s => ({ ...s, [a.id]: !s[a.id] }))} className="text-gray-500 hover:text-white transition-colors">
                          {showSecret[a.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copy(`s${a.id}`, a.secret, "Secret")} className="text-gray-500 hover:text-emerald-400 transition-colors" title="Legado (HMAC) — prefira a Pub Key">
                          {copied === `s${a.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => { if (confirm("Regenerar a secret? Clientes legados (HMAC) com a antiga param de autenticar.")) regenSecret.mutate({ id: a.id }); }}
                          className="text-gray-500 hover:text-amber-400 transition-colors" title="Regenerar secret legada"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/vg-auth/${a.id}`}>
                      <button className="flex items-center gap-1.5 px-3 py2 py-2 rounded-xl text-xs font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-600/25 transition-all">
                        <Key className="w-3.5 h-3.5" /> Gerenciar
                      </button>
                    </Link>
                    <button
                      onClick={() => { if (confirm(`Deletar "${a.name}" e todas as keys/usuários?`)) deleteApp.mutate({ id: a.id }); }}
                      className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/[0.06] p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <h3 className="text-white font-semibold mb-2">SDK para download</h3>
        <p className="text-gray-500 text-sm mb-4">Integre a auth no seu código C++ ou site com os clientes prontos (com proteções anti-bypass incluídas).</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            {
              title: "Auth Completo",
              desc: "Keys, licenças, HWID e duração — estilo KeyAuth",
              accent: "blue",
              files: [
                { file: "auth/VgAuth.hpp", label: "Auth C++ (.hpp)" },
                { file: "auth/example.cpp", label: "Exemplo C++" },
                { file: "auth/vgauth.js", label: "Cliente Web (.js)" },
                { file: "auth/example.html", label: "Exemplo Web" },
                { file: "auth/README.md", label: "Documentação" },
              ],
            },
            {
              title: "Multi Loader",
              desc: "Só contas — sem keys. Registro, login, ban e senha",
              accent: "violet",
              files: [
                { file: "loader/VgAuthLoader.hpp", label: "Loader C++ (.hpp)" },
                { file: "loader/example_loader.cpp", label: "Exemplo C++" },
                { file: "loader/README_LOADER.md", label: "Documentação" },
              ],
            },
          ].map(g => (
            <div key={g.title} className={`rounded-2xl border p-4 ${g.accent === "violet" ? "border-violet-500/15" : "border-blue-500/15"}`}
              style={{ background: g.accent === "violet" ? "rgba(139,92,246,0.03)" : "rgba(59,130,246,0.03)" }}>
              <div className="mb-3">
                <p className={`text-sm font-semibold ${g.accent === "violet" ? "text-violet-400" : "text-blue-400"}`}>{g.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{g.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.files.map(f => (
                  <a key={f.file} href={`/vgauth/${f.file}`} download
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] text-gray-300 border border-white/[0.08] transition-all ${g.accent === "violet" ? "hover:border-violet-500/30 hover:text-violet-400" : "hover:border-blue-500/30 hover:text-blue-400"}`}>
                    {f.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
