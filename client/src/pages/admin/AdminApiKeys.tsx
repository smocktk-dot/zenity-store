import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2, Copy, RefreshCw, Link2, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SITE_URL = "https://vgsellers.lat";

function apiBaseForApp(appName: string): string | null {
  const n = appName.toLowerCase().replace(/[^a-z]/g, "");
  if (n.includes("unlock")) return "/api/unlock-all/v1";
  if (n.includes("emulator") || n.includes("pubemu")) return "/api/public-emulator/v1";
  if (n.includes("stock")) return "/api/stock/v1";
  return null;
}

function planSlug(name: string) {
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return slug || name.toLowerCase().trim();
}

export default function AdminApiKeys() {
  const { language } = useLanguage();
  const [resellerId, setResellerId] = useState<string>("");
  const [appId, setAppId] = useState<string>("");
  const [name, setName] = useState("");
  const [allowedIps, setAllowedIps] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [generatedUrls, setGeneratedUrls] = useState<{ name: string; url: string }[]>([]);
  const utils = trpc.useUtils();

  const resellers = trpc.admin.listResellers.useQuery();
  const apps = trpc.admin.listApps.useQuery();
  const appDetail = trpc.admin.getApp.useQuery(
    { id: Number(appId) || 0 },
    { enabled: !!appId }
  );
  const keys = trpc.admin.listResellerApiKeys.useQuery(
    { resellerId: Number(resellerId) || 0 },
    { enabled: !!resellerId }
  );

  const assignApp = trpc.admin.assignApp.useMutation();

  const create = trpc.admin.createResellerApiKey.useMutation({
    onSuccess: (data) => {
      setNewKey(data.apiKey);
      const app = apps.data?.find((a: any) => String(a.id) === appId);
      const plans = (appDetail.data as any)?.plans ?? [];
      if (app && plans.length) {
        const base = apiBaseForApp(app.name);
        setGeneratedUrls(plans.map((p: any) => ({
          name: p.name,
          url: base
            ? `${SITE_URL}${base}/take/${planSlug(p.name)}?apikey=${data.apiKey}`
            : `${SITE_URL}/api/reseller/v1/gateway/take?appId=${app.id}&planId=${p.id}&apikey=${data.apiKey}`,
        })));
      } else {
        setGeneratedUrls([]);
      }
      toast.success(language === "en" ? "API key created" : "Chave API criada");
      keys.refetch();
    },
    onError: e => toast.error(e.message),
  });

  const revoke = trpc.admin.revokeResellerApiKey.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "API key revoked" : "Chave API revogada");
      keys.refetch();
    },
    onError: e => toast.error(e.message),
  });

  const handleCreate = async () => {
    const id = Number(resellerId);
    if (!id) { toast.error(language === "en" ? "Select a reseller" : "Selecione um reseller"); return; }
    if (appId) {
      try {
        await assignApp.mutateAsync({ resellerId: id, appId: Number(appId) });
      } catch {
        // já atribuído ou falha não-crítica
      }
    }
    create.mutate({ resellerId: id, name: name || undefined, allowedIps: allowedIps || undefined });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(language === "en" ? "URL copied" : "URL copiada");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">API Keys</h1>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-white font-semibold mb-4">{language === "en" ? "Create API Key" : "Criar Chave API"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Reseller</Label>
            <select
              value={resellerId}
              onChange={e => setResellerId(e.target.value)}
              className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm px-3 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#0b0b0f]">Selecione...</option>
              {resellers.data?.map(r => (
                <option key={r.id} value={r.id} className="bg-[#0b0b0f]">{r.username}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">
              {language === "en" ? "Stock App" : "App de Stock"}
            </Label>
            <select
              value={appId}
              onChange={e => setAppId(e.target.value)}
              className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm px-3 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="" className="bg-[#0b0b0f]">{language === "en" ? "None" : "Nenhum"}</option>
              {apps.data?.map((a: any) => (
                <option key={a.id} value={a.id} className="bg-[#0b0b0f]">{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">{language === "en" ? "Name" : "Nome"}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Site Pessoal" className="h-11 bg-white/[0.03] border-white/[0.06] text-white rounded-xl" />
          </div>
          <div>
            <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1.5 block">Allowed IPs</Label>
            <Input value={allowedIps} onChange={e => setAllowedIps(e.target.value)} placeholder="Ex: 1.1.1.1, 2.2.2.2" className="h-11 bg-white/[0.03] border-white/[0.06] text-white rounded-xl" />
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={create.isPending || !resellerId}
          className="h-11 rounded-xl font-semibold gap-2"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <Plus className="w-4 h-4" /> {language === "en" ? "Create" : "Criar"}
        </Button>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-white font-semibold mb-4">{language === "en" ? "Reseller API Keys" : "Chaves API do Reseller"}</h2>
        {!resellerId ? (
          <p className="text-gray-600 text-sm text-center py-8">Selecione um reseller para ver as chaves</p>
        ) : keys.isLoading ? (
          <div className="text-center py-8"><RefreshCw className="w-5 h-5 text-emerald-500 animate-spin mx-auto" /></div>
        ) : !keys.data?.length ? (
          <p className="text-gray-600 text-sm text-center py-8">{language === "en" ? "No API keys" : "Nenhuma chave API"}</p>
        ) : (
          <div className="space-y-3">
            {keys.data.map((k: any) => (
              <div key={k.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div>
                  <p className="text-white font-mono text-sm">{k.apiKey}</p>
                  <p className="text-gray-500 text-xs mt-1">{k.name || "Sem nome"} • {k.isActive ? <span className="text-emerald-400">Ativa</span> : <span className="text-red-400">Revogada</span>}</p>
                </div>
                <button onClick={() => revoke.mutate({ id: k.id })} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all" disabled={!k.isActive}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!newKey} onOpenChange={() => { setNewKey(null); setGeneratedUrls([]); }}>
        <DialogContent className="bg-[#0b0b0f] border-white/[0.08] text-white max-w-lg rounded-3xl p-0 overflow-hidden">
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-bold text-base">{language === "en" ? "New API Key" : "Nova Chave API"}</DialogTitle>
            </DialogHeader>
            <div className="rounded-2xl p-4 break-all font-mono text-sm text-emerald-400" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {newKey}
            </div>
            <p className="text-gray-500 text-xs">{language === "en" ? "Copy now. It won't be shown again." : "Copie agora. Não será exibida novamente."}</p>
            <Button onClick={() => { if (newKey) navigator.clipboard.writeText(newKey); toast.success("Copiado"); }} className="w-full h-11 rounded-xl font-semibold gap-2" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Copy className="w-4 h-4" /> {language === "en" ? "Copy" : "Copiar"}
            </Button>

            {/* URLs prontas das variações */}
            {generatedUrls.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  {language === "en" ? "Variation URLs (Purin Cash)" : "URLs das Variações (Purin Cash)"}
                </p>
                <div className="space-y-2">
                  {generatedUrls.map((v, i) => (
                    <div key={i} className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-semibold">{v.name}</p>
                        <p className="text-gray-500 text-[11px] font-mono truncate mt-0.5">{v.url}</p>
                      </div>
                      <button
                        onClick={() => copyUrl(v.url)}
                        className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all shrink-0"
                        title={language === "en" ? "Copy URL" : "Copiar URL"}
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrls.map(v => `${v.name}: ${v.url}`).join("\n"));
                    toast.success(language === "en" ? "All URLs copied" : "Todas as URLs copiadas");
                  }}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-xs border-white/[0.08] text-gray-300 hover:bg-white/[0.05]"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> {language === "en" ? "Copy all URLs" : "Copiar todas as URLs"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
