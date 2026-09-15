import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Image as ImageIcon,
  Megaphone,
  X,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Coins,
  Percent,
  Upload,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Product = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  descriptionEn: string | null;
  pricingCredits: string | null;
  pricingCreditsEn: string | null;
  pricingPercentage: string | null;
  pricingPercentageEn: string | null;
  imageUrl: string | null;
  galleryImages: string | null;
  discordUrl: string | null;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_DISCORD_URL = "https://discord.gg/vgseller";
const MAX_IMAGE_MB = 5; // tamanho bruto do file
const MAX_BASE64_CHARS = 3_000_000; // ~3 MB de base64 no body JSON (protege contra Vercel 413)

function currentBase64Size(cover: string, gallery: string[]) {
  return cover.length + gallery.reduce((sum, b) => sum + b.length, 0);
}

async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas não suportado")); return; }
      ctx.fillStyle = "#0a0c10";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => reject(e);
    img.src = URL.createObjectURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return compressImage(file);
}

const emptyForm = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  descriptionEn: "",
  pricingCredits: "",
  pricingCreditsEn: "",
  pricingPercentage: "",
  pricingPercentageEn: "",
  discordUrl: "",
  sortOrder: "0",
  status: "active" as "active" | "inactive",
};

export default function AdminResellerInfo() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.admin.listResellerInfoProducts.useQuery();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Image state
  const [coverBase64, setCoverBase64] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [clearCover, setClearCover] = useState(false);
  const [galleryBase64, setGalleryBase64] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [clearGallery, setClearGallery] = useState(false);

  // Preview modal
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const create = trpc.admin.createResellerInfoProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      utils.admin.listResellerInfoProducts.invalidate();
      closeDialog();
    },
    onError: e => toast.error(e.message),
  });
  const update = trpc.admin.updateResellerInfoProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      utils.admin.listResellerInfoProducts.invalidate();
      closeDialog();
    },
    onError: e => toast.error(e.message),
  });
  const del = trpc.admin.deleteResellerInfoProduct.useMutation({
    onSuccess: () => {
      toast.success("Produto removido!");
      utils.admin.listResellerInfoProducts.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const closeDialog = () => {
    setShowCreate(false);
    setEditProduct(null);
    setForm({ ...emptyForm });
    setCoverBase64("");
    setCoverPreview("");
    setClearCover(false);
    setGalleryBase64([]);
    setGalleryPreviews([]);
    setClearGallery(false);
  };

  const slugify = (s: string) =>
    s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const filtered = products.filter((p: Product) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase()) ||
    p.tagline?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCoverFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`Imagem muito grande (máx ${MAX_IMAGE_MB}MB)`); return; }
    const base64 = await fileToBase64(file);
    if (base64.length > MAX_BASE64_CHARS) { toast.error("Imagem ainda muito grande após compressão. Tente uma imagem menor."); return; }
    setCoverBase64(base64);
    setCoverPreview(base64);
    setClearCover(false);
  };

  const handleGalleryFiles = async (files: FileList) => {
    const newPreviews: string[] = [];
    const newBase64: string[] = [];
    let currentSize = currentBase64Size(coverBase64, [...galleryBase64, ...newBase64]);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`${file.name} muito grande (máx ${MAX_IMAGE_MB}MB)`); continue; }
      const base64 = await fileToBase64(file);
      if (currentSize + base64.length > MAX_BASE64_CHARS) {
        toast.error(`Limite de tamanho atingido. Adicione menos imagens ou use arquivos menores. (${newBase64.length} adicionadas)`);
        break;
      }
      currentSize += base64.length;
      newPreviews.push(base64);
      newBase64.push(base64);
    }
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
    setGalleryBase64(prev => [...prev, ...newBase64]);
    setClearGallery(false);
  };

  const removeGalleryItem = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryBase64(prev => prev.filter((_, i) => i !== index));
  };

  const existingGallery = (p: Product): string[] => {
    if (!p.galleryImages) return [];
    try {
      const arr = JSON.parse(p.galleryImages);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      title: p.title,
      slug: p.slug,
      tagline: p.tagline || "",
      description: p.description || "",
      descriptionEn: p.descriptionEn || "",
      pricingCredits: p.pricingCredits || "",
      pricingCreditsEn: p.pricingCreditsEn || "",
      pricingPercentage: p.pricingPercentage || "",
      pricingPercentageEn: p.pricingPercentageEn || "",
      discordUrl: p.discordUrl || "",
      sortOrder: String(p.sortOrder || 0),
      status: p.status as "active" | "inactive",
    });
    setCoverBase64("");
    setCoverPreview(p.imageUrl || "");
    setClearCover(false);
    setGalleryBase64([]);
    setGalleryPreviews(existingGallery(p));
    setClearGallery(false);
    setShowCreate(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBase64Size(coverBase64, galleryBase64) > MAX_BASE64_CHARS) {
      toast.error("As imagens anexadas são muito grandes. Reduza a quantidade/tamanho ou comprima-as.");
      return;
    }
    const base = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      pricingCredits: form.pricingCredits.trim() || null,
      pricingCreditsEn: form.pricingCreditsEn.trim() || null,
      pricingPercentage: form.pricingPercentage.trim() || null,
      pricingPercentageEn: form.pricingPercentageEn.trim() || null,
      discordUrl: form.discordUrl.trim() || null,
      sortOrder: parseInt(form.sortOrder) || 0,
      status: form.status,
    };
    if (editProduct) {
      update.mutate({
        id: editProduct.id,
        ...base,
        imageUrlBase64: coverBase64 || undefined,
        clearImage: clearCover || undefined,
        galleryImagesBase64: galleryBase64.length > 0 ? galleryBase64 : undefined,
        clearGallery: clearGallery || undefined,
      });
    } else {
      create.mutate({
        ...base,
        imageUrlBase64: coverBase64 || undefined,
        galleryImagesBase64: galleryBase64.length > 0 ? galleryBase64 : undefined,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Reseller Info — Produtos</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
              {products.length} produtos
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Gerencie os produtos exibidos na página pública <code className="text-emerald-400/80">/resellerinfo</code> para futuros revendedores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-9 h-9 text-xs rounded-xl bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
          <Button
            onClick={() => { setShowCreate(true); setForm({ ...emptyForm }); setCoverPreview(""); setGalleryPreviews([]); }}
            className="h-9 px-4 text-xs font-semibold rounded-xl border-0 bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <Megaphone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white text-sm font-semibold">Nenhum produto cadastrado</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Novo Produto" para adicionar um produto à página /resellerinfo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: Product) => (
            <div
              key={p.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col"
            >
              {/* Cover */}
              {p.imageUrl ? (
                <div className="w-full h-32 bg-cover bg-center" style={{ backgroundImage: `url(${p.imageUrl})` }} />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <ImageIcon className="w-8 h-8 text-gray-700" />
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm tracking-tight truncate">{p.title}</h3>
                    <span className="text-[10px] font-mono text-gray-500">/{p.slug}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                    p.status === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === "active" ? "bg-emerald-400" : "bg-gray-400"}`} />
                    {p.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {p.tagline && <p className="text-gray-400 text-xs line-clamp-2 mb-2">{p.tagline}</p>}

                {/* Meta */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.pricingCredits && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1">
                      <Coins className="w-2.5 h-2.5" /> Credits
                    </span>
                  )}
                  {p.pricingPercentage && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center gap-1">
                      <Percent className="w-2.5 h-2.5" /> Porcentagem
                    </span>
                  )}
                  {existingGallery(p).length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-400 border border-white/[0.08] flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> {existingGallery(p).length} imgs
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                    Ordem: {p.sortOrder}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04] mt-auto">
                  <Button
                    size="sm"
                    onClick={() => setPreviewProduct(p)}
                    className="flex-1 h-8 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Preview
                  </Button>
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.08] transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remover "${p.title}" permanentemente?`)) del.mutate({ id: p.id }); }}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="bg-[#0b100e] border border-white/[0.1] text-white max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white font-bold text-base">
              {editProduct ? `Editar: ${editProduct.title}` : "Cadastrar Novo Produto"}
            </DialogTitle>
            <p className="text-gray-400 text-xs mt-0.5">
              Este produto aparecerá na página pública <code className="text-emerald-400/80">/resellerinfo</code> para futuros revendedores
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title + Slug */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Título do Produto *</Label>
                <Input
                  value={form.title}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({ ...f, title: val, slug: f.slug || slugify(val) }));
                  }}
                  placeholder="Ex: PUBLIC EMULATOR"
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="public-emulator"
                  className="bg-black/30 border-white/[0.1] text-white font-mono rounded-lg h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Tagline / Subtítulo</Label>
              <Input
                value={form.tagline}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="Ex: Tecnologia exclusiva de emulação Riot Games"
                className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
              />
            </div>

            {/* Cover image */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1.5">Imagem de Capa</Label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-xl border border-white/[0.1] bg-black/30 overflow-hidden flex items-center justify-center shrink-0">
                  {coverPreview ? (
                    <img src={coverPreview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleCoverFile(e.target.files[0])}
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-gray-300 transition-all w-fit">
                      <Upload className="w-3.5 h-3.5" /> Enviar imagem
                    </div>
                  </label>
                  {editProduct?.imageUrl && !clearCover && !coverBase64 && (
                    <button
                      type="button"
                      onClick={() => { setClearCover(true); setCoverPreview(""); }}
                      className="text-[11px] text-red-400 hover:text-red-300 w-fit"
                    >
                      Remover imagem atual
                    </button>
                  )}
                  {clearCover && <span className="text-[11px] text-amber-400">Imagem será removida ao salvar</span>}
                </div>
              </div>
            </div>

            {/* Gallery images */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1.5">
                Galeria de Imagens (Preview) — {galleryPreviews.length} imagem(ns)
              </Label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {galleryPreviews.map((url, i) => (
                  <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-white/[0.1]">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="cursor-pointer aspect-video rounded-lg border border-dashed border-white/[0.15] hover:border-emerald-500/40 flex items-center justify-center bg-black/20 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && handleGalleryFiles(e.target.files)}
                  />
                  <Plus className="w-5 h-5 text-gray-500" />
                </label>
              </div>
              {editProduct && existingGallery(editProduct).length > 0 && !clearGallery && galleryBase64.length === 0 && (
                <button
                  type="button"
                  onClick={() => { setClearGallery(true); setGalleryPreviews([]); }}
                  className="text-[11px] text-red-400 hover:text-red-300"
                >
                  Remover galeria atual ({existingGallery(editProduct).length} imgs)
                </button>
              )}
              {clearGallery && <span className="text-[11px] text-amber-400">Galeria será removida ao salvar</span>}
            </div>

            {/* Description PT */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Descrição Completa — PT (uma linha por parágrafo)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder={"COMO FUNCIONA?\n..."}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Description EN */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1">Full Description — EN (one line per paragraph)</Label>
              <Textarea
                value={form.descriptionEn}
                onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
                rows={4}
                placeholder={"HOW DOES IT WORK?\n..."}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Pricing Credits PT */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" /> Seller Credits — PT (uma linha por item)
              </Label>
              <Textarea
                value={form.pricingCredits}
                onChange={e => setForm(f => ({ ...f, pricingCredits: e.target.value }))}
                rows={3}
                placeholder={"Painel de Créditos lançado e disponível!\nDepósito mínimo:\n$300 — 60% de desconto em chaves"}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Pricing Credits EN */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" /> Seller Credits — EN (one line per item)
              </Label>
              <Textarea
                value={form.pricingCreditsEn}
                onChange={e => setForm(f => ({ ...f, pricingCreditsEn: e.target.value }))}
                rows={3}
                placeholder={"Credits panel is now available!\nMinimum deposit:\n$300 — 60% discount per key"}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Pricing Percentage PT */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-400" /> Seller Percentage — PT (uma linha por item)
              </Label>
              <Textarea
                value={form.pricingPercentage}
                onChange={e => setForm(f => ({ ...f, pricingPercentage: e.target.value }))}
                rows={3}
                placeholder={"Painel Porcentagem disponível\nSem depósito mínimo\nVocê começa com 35% de desconto"}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Pricing Percentage EN */}
            <div>
              <Label className="text-gray-300 text-xs font-medium block mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-400" /> Seller Percentage — EN (one line per item)
              </Label>
              <Textarea
                value={form.pricingPercentageEn}
                onChange={e => setForm(f => ({ ...f, pricingPercentageEn: e.target.value }))}
                rows={3}
                placeholder={"Percentage panel available\nNo minimum deposit\nYou start with 35% discount"}
                className="w-full bg-black/30 border border-white/[0.1] text-white rounded-lg p-2.5 text-xs resize-none outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Discord URL + Sort + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label className="text-gray-300 text-xs font-medium block mb-1">Discord URL (override)</Label>
                <Input
                  value={form.discordUrl}
                  onChange={e => setForm(f => ({ ...f, discordUrl: e.target.value }))}
                  placeholder={DEFAULT_DISCORD_URL}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Ordem</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs font-medium block mb-1">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as "active" | "inactive" }))}>
                  <SelectTrigger className="bg-black/30 border-white/[0.1] text-white rounded-lg h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b100e] border-white/[0.1] text-white">
                    <SelectItem value="active" className="text-xs">Ativo</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                onClick={closeDialog}
                className="flex-1 h-9 rounded-lg border-white/[0.1] bg-white/[0.02] text-gray-300 hover:text-white text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="flex-1 h-9 rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs border-0"
              >
                {create.isPending || update.isPending ? "Salvando..." : editProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Modal ─── */}
      {previewProduct && (
        <div className="fixed inset-0 z-100 bg-black/72 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewProduct(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#0a0c10] border border-white/[0.08] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Preview — /resellerinfo</span>
              </div>
              <button onClick={() => setPreviewProduct(null)} className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {/* Product header */}
              <div className="flex gap-4 items-center">
                {previewProduct.imageUrl ? (
                  <div className="w-20 h-20 rounded-xl bg-cover bg-center border border-white/[0.08] shrink-0" style={{ backgroundImage: `url(${previewProduct.imageUrl})` }} />
                ) : (
                  <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-emerald-500/5 border border-white/[0.08] shrink-0">
                    <ImageIcon className="w-7 h-7 text-gray-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Produto</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{previewProduct.title}</h2>
                  {previewProduct.tagline && <p className="text-xs text-gray-400 mt-1">{previewProduct.tagline}</p>}
                </div>
              </div>

              {/* Gallery */}
              {existingGallery(previewProduct).length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Galeria
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {existingGallery(previewProduct).map((url, i) => (
                      <div key={i} className="aspect-video rounded-lg bg-cover bg-center border border-white/[0.08]" style={{ backgroundImage: `url(${url})` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {previewProduct.description && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">Descrição</div>
                  <div className="text-xs text-gray-300 leading-relaxed space-y-1">
                    {previewProduct.description.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                </div>
              )}

              {/* Pricing Credits */}
              {previewProduct.pricingCredits && (
                <div className="rounded-xl border border-emerald-500/18 bg-emerald-500/3 p-4">
                  <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Seller Credits</h3>
                      <p className="text-[11px] text-gray-400">Painel de créditos</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {previewProduct.pricingCredits.split("\n").map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Percentage */}
              {previewProduct.pricingPercentage && (
                <div className="rounded-xl border border-indigo-500/18 bg-indigo-500/3 p-4">
                  <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center">
                      <Percent className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Seller Porcentagem</h3>
                      <p className="text-[11px] text-gray-400">Sem depósito</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {previewProduct.pricingPercentage.split("\n").map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <a
                href={previewProduct.discordUrl || DEFAULT_DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:shadow-lg transition-all"
              >
                Quero virar Reseller <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
