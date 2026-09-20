import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { Download, Film, Plus, Trash2, ExternalLink, Save, X, UploadCloud, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDownloads() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: apps = [] } = trpc.admin.listApps.useQuery();
  const [appId, setAppId] = useState<string>("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    type: "download" as "download" | "tutorial",
    title: "",
    url: "",
    videoUrl: "",
    sortOrder: "0",
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadedName, setUploadedName] = useState("");

  const MAX_UPLOAD_MB = 500;

  const handleFile = async (file: File) => {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande — máximo ${MAX_UPLOAD_MB}MB`);
      return;
    }
    setUploading(true);
    setUploadPct(0);
    setUploadedName("");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/blob-upload",
        multipart: file.size > 32 * 1024 * 1024,
        onUploadProgress: p => setUploadPct(Math.round(p.percentage)),
      });
      setForm(f => ({ ...f, url: blob.url }));
      setUploadedName(file.name);
      toast.success("Arquivo enviado!");
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const { data: downloads = [] } = trpc.admin.getDownloadsByApp.useQuery(
    { appId: Number(appId) || 0 },
    { enabled: !!appId }
  );

  const create = trpc.admin.createAppDownload.useMutation({
    onSuccess: () => {
      toast.success("Adicionado!");
      setShow(false);
      resetForm();
      utils.admin.getDownloadsByApp.invalidate({ appId: Number(appId) || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const del = trpc.admin.deleteAppDownload.useMutation({
    onSuccess: () => {
      toast.success("Removido!");
      utils.admin.getDownloadsByApp.invalidate({ appId: Number(appId) || 0 });
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ type: "download", title: "", url: "", videoUrl: "", sortOrder: "0" });
    setUploadedName("");
    setUploadPct(0);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !form.title || !form.url || uploading) return;
    create.mutate({
      appId: Number(appId),
      type: form.type,
      title: form.title,
      url: form.url,
      videoUrl: form.videoUrl || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Downloads por App</h1>
          <p className="text-gray-500 text-sm mt-1">Adicione links de download e tutoriais por aplicação</p>
        </div>
        <Button
          onClick={() => navigate("/admin")}
          className="text-white"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          Voltar
        </Button>
      </div>

      <div>
        <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Aplicação</Label>
        <Select value={appId} onValueChange={setAppId}>
          <SelectTrigger className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white">
            <SelectValue placeholder="Selecione um app" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
            {apps.map((a: any) => (
              <SelectItem key={a.id} value={String(a.id)} className="text-white">{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {appId && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">Itens</h2>
            <Button
              onClick={() => { setShow(true); resetForm(); }}
              className="h-8 text-xs text-white"
              style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Novo
            </Button>
          </div>

          <div className="space-y-3">
            {downloads.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum download/tutorial para este app.</p>
            ) : (
              downloads.map((d: any) => (
                <div key={d.id} className="rounded-3xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {d.type === "download" ? <Download className="w-4 h-4 text-violet-400" /> : <Film className="w-4 h-4 text-blue-400" />}
                      <div>
                        <p className="text-white font-medium text-sm">{d.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{d.type === "download" ? "Download" : "Tutorial"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { if (confirm("Remover este item?")) del.mutate({ id: d.id }); }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-emerald-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {d.type === "download" ? "Link de download" : "Link do tutorial"}
                    </a>
                    {d.videoUrl && (
                      <a href={d.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Film className="w-3 h-3" /> Vídeo
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="text-white max-w-lg border-0" style={{ background: "linear-gradient(145deg, rgba(18,12,35,0.98) 0%, rgba(10,8,25,0.98) 100%)" }}>
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Novo Download / Tutorial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0c1a] border-white/[0.06]">
                  <SelectItem value="download" className="text-white">Download</SelectItem>
                  <SelectItem value="tutorial" className="text-white">Tutorial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Título</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white" required />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                {form.type === "download" ? "Arquivo (upload direto — até 500MB)" : "URL do Tutorial"}
              </Label>
              {form.type === "download" && (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    className="mt-1.5 w-full rounded-xl border border-dashed border-white/[0.12] hover:border-emerald-500/40 bg-white/[0.02] px-4 py-4 text-sm text-gray-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <UploadCloud className="w-5 h-5 animate-pulse" />
                        <span>Enviando... {uploadPct}%</span>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${uploadPct}%` }} />
                        </div>
                      </>
                    ) : uploadedName ? (
                      <>
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">{uploadedName}</span>
                        <span className="text-[10px] text-gray-600">Clique para trocar o arquivo</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5" />
                        <span>Clique para escolher o arquivo do seu PC</span>
                        <span className="text-[10px] text-gray-600">Máx. 500MB — hospedado direto no site</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <Input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder={form.type === "download" ? "…ou cole uma URL externa" : "https://…"}
                className="mt-2 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-gray-600"
                required
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">URL do Vídeo (opcional)</Label>
              <Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Ordem</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} className="mt-1.5 bg-white/[0.03] border-white/[0.06] text-white" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setShow(false)} className="flex-1 text-gray-300" style={{ background: "rgba(255,255,255,0.06)" }}>Cancelar</Button>
              <Button type="submit" disabled={create.isPending || uploading} className="flex-1 text-white" style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
                <Save className="w-4 h-4 mr-1" /> {uploading ? "Enviando arquivo..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
