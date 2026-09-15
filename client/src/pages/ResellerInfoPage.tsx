import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Coins,
  Percent,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  Zap,
  Lock,
  CheckCircle2,
  Check,
  ExternalLink,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import LightStreaks from "@/components/LightStreaks";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_DISCORD_URL = "https://discord.gg/vgseller";

function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const productGradients = [
  "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.18) 50%, rgba(2,44,34,0.25) 100%)",
  "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(79,70,229,0.18) 50%, rgba(30,27,75,0.25) 100%)",
  "linear-gradient(135deg, rgba(236,72,153,0.35) 0%, rgba(190,24,93,0.18) 50%, rgba(88,28,66,0.25) 100%)",
  "linear-gradient(135deg, rgba(245,158,11,0.35) 0%, rgba(180,83,9,0.18) 50%, rgba(69,26,3,0.25) 100%)",
];

function productGradient(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % productGradients.length;
  return productGradients[index];
}

function productInitial(title: string) {
  const first = title?.trim()[0];
  return (first || "?").toUpperCase();
}

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
};

function allProductImages(p: Product): string[] {
  const images: string[] = [];
  if (p.imageUrl) images.push(p.imageUrl);
  if (p.galleryImages) {
    try {
      const arr = JSON.parse(p.galleryImages);
      if (Array.isArray(arr)) images.push(...arr);
    } catch { /* ignore */ }
  }
  return images;
}

function cleanDiscordText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\|\|@everyone\s+@here\s*\|\|/gi, "")
    .replace(/@everyone|@here/gi, "")
    .replace(/<a?:[a-zA-Z0-9_]+:[0-9]+>/g, "")
    .replace(/<#[0-9]+>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s*/g, "")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function parseLocalizedLines(raw: string | null | undefined, lang: "pt" | "en"): string[] {
  if (!raw) return [];
  const cleaned = cleanDiscordText(raw);
  const rawLines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);

  const hasBrasil = rawLines.some(l => /brasil|🇧🇷/i.test(l));
  const hasUS = rawLines.some(l => /🇺🇸|\busa?\b|\benglish\b/i.test(l));

  let candidateLines: string[] = rawLines;

  if (hasBrasil && hasUS) {
    const pt: string[] = [];
    const en: string[] = [];
    let currentSection: "pt" | "en" | null = null;

    for (const line of rawLines) {
      if (/brasil|🇧🇷/i.test(line)) {
        currentSection = "pt";
        continue;
      }
      if (/🇺🇸|\busa?\b|\benglish\b/i.test(line)) {
        currentSection = "en";
        continue;
      }
      if (currentSection === "pt") pt.push(line);
      else if (currentSection === "en") en.push(line);
      else {
        pt.push(line);
        en.push(line);
      }
    }
    candidateLines = lang === "en" ? (en.length > 0 ? en : pt) : (pt.length > 0 ? pt : rawLines);
  }

  return candidateLines
    .map(l => l.replace(/^[-•*]\s*[-•*]?\s*/, "").trim())
    .filter(l => {
      if (!l) return false;
      if (/^seller\s+(credits|porcentagem|percentage)$/i.test(l)) return false;
      return true;
    });
}

function i18nField(p: Product, ptField: keyof Product, enField: keyof Product, lang: "pt" | "en"): string | null {
  const en = lang === "en" ? (p[enField] as string | null) : null;
  if (en && en.trim().length > 0) return en;
  return p[ptField] as string | null;
}

function getProductCategory(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("emulator") || s.includes("emu")) return "VALORANT • KERNEL EMULATOR";
  if (s.includes("unlock")) return "VALORANT • WEB SUITE";
  return "EXCLUSIVE • RESELLER APP";
}

function getProductHighlights(slug: string, lang: "pt" | "en"): string[] {
  const s = slug.toLowerCase();
  if (s.includes("emulator") || s.includes("emu")) {
    return lang === "en"
      ? ["Zero Vanguard Detection", "Dedicated Private Server", "No Queue Restrictions"]
      : ["Zero Detecção Vanguard", "Servidor Privado Dedicado", "Fila sem Restrições"];
  }
  if (s.includes("unlock")) {
    return lang === "en"
      ? ["Unlock All Deluxe Skins", "In-Match Skin Switcher", "Web Browser Loadout & Rank"]
      : ["Desbloqueio de Todas as Skins", "Modificação Dentro da Partida", "Loadout & Rank via Web"];
  }
  return lang === "en"
    ? ["Instant Key Delivery", "High Profit Margins", "Full Reseller Console"]
    : ["Entrega Imediata de Keys", "Altas Margens de Lucro", "Console Completo de Revenda"];
}

function ProductImageBanner({ product, onZoom }: { product: Product; onZoom?: () => void }) {
  const images = allProductImages(product);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [product.id]);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length, product.id]);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => (i - 1 + images.length) % images.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => (i + 1) % images.length);
  };
  const goDot = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setIdx(i);
  };

  if (images.length === 0) {
    return (
      <div
        className="ri-modal-cover ri-modal-cover--placeholder"
        style={{ background: productGradient(product.title) }}
      >
        <span className="ri-modal-cover-initial">{productInitial(product.title)}</span>
      </div>
    );
  }

  return (
    <div
      className="ri-modal-cover ri-modal-cover-banner"
      onClick={onZoom}
      style={{ cursor: onZoom ? "zoom-in" : "default" }}
      title={onZoom ? "Clique para ampliar imagem" : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="ri-modal-cover-slide"
          style={{ backgroundImage: `url(${images[idx]})` }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <button className="ri-modal-arrow ri-modal-arrow--prev" onClick={goPrev} type="button" aria-label="Anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="ri-modal-arrow ri-modal-arrow--next" onClick={goNext} type="button" aria-label="Próximo">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="ri-modal-dots">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => goDot(e, i)}
                className={`ri-modal-dot ${i === idx ? "active" : ""}`}
                type="button"
                aria-label={`Imagem ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const riLabels = {
  pt: {
    brandSub: "Programa Oficial de Parcerias",
    backToLogin: "Voltar ao Login",
    discordCommunity: "Discord Oficial",
    program: "Programa Oficial de Revenda",
    become: "Torne-se um",
    officialReseller: "Revendedor Autorizado",
    heroSub: "Acesse tecnologia exclusiva de emulação, painéis profissionais e margens reais de lucro. Escolha a solução ideal para o seu público e comece a faturar hoje mesmo.",
    featureExclusive: "Tecnologia Exclusiva & Zero Ban",
    featureExclusiveDesc: "Servidores privados dedicados e bypass a nível de kernel com 100% de estabilidade",
    featurePanel: "Painel Profissional & Gestão",
    featurePanelDesc: "Console moderno para controle de estoque, créditos, sub-resellers e reset de HWID",
    featureAuto: "Geração Instantânea via API",
    featureAutoDesc: "Endpoints próprios para integração com seus bots de Discord e automações de venda",
    catalog: "Catálogo & Licenciamento",
    available: "Produtos Oficiais para Revenda",
    catalogSub: "Softwares de alta performance projetados para máxima estabilidade e rentabilidade. Clique em um produto para ver detalhes técnicos, modelos de parceria e tabelas de preço.",
    noProducts: "Nenhum produto cadastrado ainda.",
    availableStatus: "Disponível",
    soonStatus: "Em breve",
    viewDetails: "Ver Detalhes & Planos",
    product: "Produto",
    description: "Especificações & Descrição",
    gallery: "Galeria de Imagens",
    credits: "Seller Credits",
    percentage: "Seller Porcentagem",
    creditsSub: "Painel de créditos — pague conforme vende",
    percentageSub: "Sem depósito mínimo — desconto direto nas keys",
    ready: "Pronto para lucrar como Revendedor?",
    readySub: "Acesse nosso Discord oficial, abra um ticket com nossa equipe e tenha seu acesso liberado com suporte imediato.",
    beReseller: "Entrar no Discord Oficial",
    wantReseller: "Quero virar Reseller deste Produto",
    statSupport: "Suporte 24/7",
    statApi: "API Própria",
    statDelivery: "Auto Entrega",
    statDetection: "Zero Ban",
    loading: "Carregando catálogo de produtos...",
    system: "SISTEMA OPERACIONAL • NETWORK ONLINE",
  },
  en: {
    brandSub: "Official Partner Console",
    backToLogin: "Back to Login",
    discordCommunity: "Official Discord",
    program: "Official Reseller Program",
    become: "Become an",
    officialReseller: "Authorized Reseller",
    heroSub: "Gain access to exclusive emulation technology, professional management panels and real profit margins. Choose the software that matches your audience and scale your revenue today.",
    featureExclusive: "Exclusive Technology & Zero Ban",
    featureExclusiveDesc: "Dedicated private servers and kernel-level bypass with proven 100% stability",
    featurePanel: "Professional Panel & Management",
    featurePanelDesc: "Modern console for real-time stock control, credit balances, sub-resellers and HWID resets",
    featureAuto: "Instant Generation via API",
    featureAutoDesc: "Dedicated endpoints engineered for Discord bot integrations and automated sales",
    catalog: "Catalog & Licensing",
    available: "Official Products for Resale",
    catalogSub: "High-performance software built for maximum stability and reseller profitability. Click any product to explore technical specs, reseller tiers, and pricing tables.",
    noProducts: "No products registered yet.",
    availableStatus: "Available",
    soonStatus: "Coming soon",
    viewDetails: "View Details & Plans",
    product: "Product",
    description: "Specifications & Description",
    gallery: "Screenshots Gallery",
    credits: "Seller Credits",
    percentage: "Seller Percentage",
    creditsSub: "Credits panel — pay as you sell",
    percentageSub: "No minimum deposit — direct discount on keys",
    ready: "Ready to scale as an Official Reseller?",
    readySub: "Join our official Discord server, open a ticket with our team and get your reseller access approved immediately.",
    beReseller: "Join Official Discord",
    wantReseller: "I want to Resell this Product",
    statSupport: "24/7 Support",
    statApi: "Own API",
    statDelivery: "Auto Deliver",
    statDetection: "Zero Ban",
    loading: "Loading product catalog...",
    system: "OPERATIONAL SYSTEM • NETWORK ONLINE",
  },
};

export default function ResellerInfoPage() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const L = riLabels[language];
  const { data: products = [], isLoading } = trpc.auth.listResellerInfo.useQuery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openProduct = (p: Product) => setSelectedProduct(p);
  const closeProduct = () => setSelectedProduct(null);

  const galleryFor = (p: Product): string[] => {
    if (!p.galleryImages) return [];
    try {
      const arr = JSON.parse(p.galleryImages);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const discordUrl = (p: Product) => p.discordUrl || DEFAULT_DISCORD_URL;

  return (
    <div className="auth-page ri-page">
      {/* ─── Left brand & showcase panel ─── */}
      <motion.aside
        className="ri-left"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-left-bg">
          <LightStreaks
            colors={["#34d399", "#10b981", "#6ee7b7", "#ffffff", "#059669", "#a7f3d0"]}
            backgroundColor="#030305"
            speed={0.35}
            streakCount={7}
            streakWidth={1.2}
            streakLength={1.4}
            glow={0.85}
            density={0.55}
            twinkle={0.85}
            zoom={2.4}
            backgroundGlow={0.15}
            opacity={0.85}
            mouseInteraction={true}
            mouseStrength={0.45}
            mouseRadius={0.85}
          />
        </div>
        <div className="auth-left-grid" aria-hidden="true" />

        {/* Top brand lockup */}
        <div className="auth-left-top" style={{ position: "relative", zIndex: 10 }}>
          <div className="auth-brand-mark">
            <span className="auth-brand-glyph">VG</span>
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">VG SELLERS</span>
            <span className="auth-brand-sub">{L.brandSub}</span>
          </div>
        </div>

        {/* Center hero showcase */}
        <div className="ri-left-hero">
          <div className="ri-hero-glow" aria-hidden="true" />
          <motion.div
            className="ri-hero-card"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ri-eyebrow">
              <span className="ri-eyebrow-dot" />
              <span>{L.program}</span>
            </div>
            <h1 className="ri-left-title">
              {L.become}<br />
              <span className="ri-left-title-accent">{L.officialReseller}</span>
            </h1>
            <p className="ri-left-sub">{L.heroSub}</p>

            <div className="ri-left-features">
              <div className="ri-feature">
                <div className="ri-feature-icon">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="ri-feature-text">
                  <span className="ri-feature-title">{L.featureExclusive}</span>
                  <span className="ri-feature-desc">{L.featureExclusiveDesc}</span>
                </div>
              </div>
              <div className="ri-feature">
                <div className="ri-feature-icon">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="ri-feature-text">
                  <span className="ri-feature-title">{L.featurePanel}</span>
                  <span className="ri-feature-desc">{L.featurePanelDesc}</span>
                </div>
              </div>
              <div className="ri-feature">
                <div className="ri-feature-icon">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="ri-feature-text">
                  <span className="ri-feature-title">{L.featureAuto}</span>
                  <span className="ri-feature-desc">{L.featureAutoDesc}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom stats strip */}
        <div className="ri-left-stats">
          <div className="ri-left-stat">
            <span className="ri-left-stat-value">24/7</span>
            <span className="ri-left-stat-label">{L.statSupport}</span>
          </div>
          <div className="ri-left-stat-sep" />
          <div className="ri-left-stat">
            <span className="ri-left-stat-value">API</span>
            <span className="ri-left-stat-label">{L.statApi}</span>
          </div>
          <div className="ri-left-stat-sep" />
          <div className="ri-left-stat">
            <span className="ri-left-stat-value">&lt; 1s</span>
            <span className="ri-left-stat-label">{L.statDelivery}</span>
          </div>
          <div className="ri-left-stat-sep" />
          <div className="ri-left-stat">
            <span className="ri-left-stat-value">0%</span>
            <span className="ri-left-stat-label">{L.statDetection}</span>
          </div>
        </div>

        {/* Operational status badge */}
        <div className="auth-left-foot" style={{ position: "relative", zIndex: 10 }}>
          <div className="auth-status-pulse" />
          <span className="auth-status-label">{L.system}</span>
        </div>
      </motion.aside>

      {/* ─── Right content panel ─── */}
      <motion.main
        className="ri-right"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top bar */}
        <div className="ri-topbar">
          <div className="ri-topbar-pill">
            <a
              href={DEFAULT_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ri-topbar-discord"
              title="Acessar comunidade oficial no Discord"
            >
              <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>{L.discordCommunity}</span>
            </a>
            <div className="auth-topbar-sep" />
            <button
              onClick={() => navigate("/")}
              className="auth-topbar-link"
              type="button"
            >
              {L.backToLogin}
            </button>
            <div className="auth-topbar-sep" />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Content */}
        <div className="ri-content">
          <div className="ri-content-head">
            <div className="ri-eyebrow">
              <span className="ri-eyebrow-dot" />
              <span>{L.catalog}</span>
            </div>
            <h2 className="ri-content-title">{L.available}</h2>
            <p className="ri-content-sub">{L.catalogSub}</p>
          </div>

          {isLoading ? (
            <div className="ri-loading">
              <div className="ri-spinner" />
              <span>{L.loading}</span>
            </div>
          ) : products.length === 0 ? (
            <div className="ri-empty">
              <Sparkles className="w-8 h-8" style={{ color: "rgba(255,255,255,0.2)" }} />
              <p>{L.noProducts}</p>
            </div>
          ) : (
            <div className="ri-grid">
              {products.map((p, i) => {
                const category = getProductCategory(p.slug);
                const highlights = getProductHighlights(p.slug, language);

                return (
                  <motion.div
                    key={p.id}
                    onClick={() => openProduct(p)}
                    className="ri-card"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openProduct(p);
                    }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Media container */}
                    <div className="ri-card-media">
                      {p.imageUrl ? (
                        <div className="ri-card-img" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                      ) : (
                        <div
                          className="ri-card-img ri-modal-cover--placeholder"
                          style={{ background: productGradient(p.title) }}
                        >
                          <span className="ri-modal-cover-initial">{productInitial(p.title)}</span>
                        </div>
                      )}
                      <div className="ri-card-vignette" />
                      <div className="ri-card-chips">
                        <div className={`ri-card-status-badge ${p.status !== "active" ? "ri-card-status-badge--inactive" : ""}`}>
                          <span className="ri-card-status-badge-dot" />
                          <span>{p.status === "active" ? L.availableStatus : L.soonStatus}</span>
                        </div>
                        <span className="ri-card-type-badge">{category}</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="ri-card-body">
                      <h3 className="ri-card-title">{p.title}</h3>
                      {p.tagline && <p className="ri-card-tagline">{p.tagline}</p>}

                      {/* Highlight bullets */}
                      <div className="ri-card-bullets">
                        {highlights.map((bullet, bIdx) => (
                          <div key={bIdx} className="ri-card-bullet-row">
                            <Check className="w-3.5 h-3.5 ri-card-bullet-icon" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing teaser bar */}
                      <div className="ri-card-pricing-teaser">
                        <span className="ri-card-pricing-badge">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Credits & %</span>
                        </span>
                        <div className="ri-card-action-btn">
                          <span>{L.viewDetails}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CTA bottom banner */}
          <div className="ri-cta-banner">
            <div className="ri-cta-content">
              <div className="ri-cta-icon-box">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="ri-cta-title">{L.ready}</p>
                <p className="ri-cta-sub">{L.readySub}</p>
              </div>
            </div>
            <a
              href={DEFAULT_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ri-cta-btn"
            >
              <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
              <span>{L.beReseller}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.main>

      {/* ─── Product detail modal ─── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            key="product-modal"
            className="ri-modal-overlay"
            onClick={closeProduct}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="ri-modal"
              onClick={(e: any) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                className="ri-modal-close"
                onClick={closeProduct}
                type="button"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="ri-modal-scroll">
                {/* Header banner */}
                <div className="ri-modal-head">
                  <ProductImageBanner
                    product={selectedProduct}
                    onZoom={() => {
                      const gallery = allProductImages(selectedProduct);
                      if (gallery.length > 0) setLightboxIndex(0);
                    }}
                  />
                  <div className="ri-modal-headtext">
                    <div className="ri-eyebrow">
                      <span className="ri-eyebrow-dot" />
                      <span>{getProductCategory(selectedProduct.slug)}</span>
                    </div>
                    <h2 className="ri-modal-title">{selectedProduct.title}</h2>
                    {selectedProduct.tagline && <p className="ri-modal-tagline">{selectedProduct.tagline}</p>}
                  </div>
                </div>

                {/* Gallery thumbnails */}
                {galleryFor(selectedProduct).length > 0 && (
                  <div className="ri-gallery">
                    <div className="ri-gallery-label">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{L.gallery}</span>
                    </div>
                    <div className="ri-gallery-grid">
                      {galleryFor(selectedProduct).map((url, i) => (
                        <button
                          key={i}
                          className="ri-gallery-thumb"
                          style={{ backgroundImage: `url(${url})` }}
                          onClick={() => setLightboxIndex(i)}
                          type="button"
                        >
                          <div className="ri-gallery-overlay">
                            <span>Visualizar</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedProduct.description && (
                  <div className="ri-section">
                    <div className="ri-section-label">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{L.description}</span>
                    </div>
                    <div className="ri-description">
                      {parseLocalizedLines(
                        i18nField(selectedProduct, "description", "descriptionEn", language),
                        language
                      ).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing — Credits */}
                {selectedProduct.pricingCredits && (
                  <div className="ri-pricing-card ri-pricing-card--credits">
                    <div className="ri-pricing-head">
                      <div className="ri-pricing-icon ri-pricing-icon--credits">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="ri-pricing-title">{L.credits}</h3>
                        <p className="ri-pricing-sub">{L.creditsSub}</p>
                      </div>
                    </div>
                    <div className="ri-pricing-body">
                      {parseLocalizedLines(
                        i18nField(selectedProduct, "pricingCredits", "pricingCreditsEn", language),
                        language
                      ).map((line, i) => {
                        const isDiscount = /([0-9]+%)/.test(line);
                        const discountMatch = line.match(/([0-9]+%\s*(?:de\s+desconto|off)?)/i);
                        const pillText = discountMatch ? discountMatch[1].toUpperCase() : null;

                        return (
                          <div key={i} className="ri-pricing-line">
                            <div className="ri-pricing-line-left">
                              <span className="ri-pricing-bullet" />
                              <span>{line}</span>
                            </div>
                            {pillText && (
                              <span className="ri-pricing-pill ri-pricing-pill--green">
                                {pillText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing — Percentage */}
                {selectedProduct.pricingPercentage && (
                  <div className="ri-pricing-card ri-pricing-card--percentage">
                    <div className="ri-pricing-head">
                      <div className="ri-pricing-icon ri-pricing-icon--percentage">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="ri-pricing-title">{L.percentage}</h3>
                        <p className="ri-pricing-sub">{L.percentageSub}</p>
                      </div>
                    </div>
                    <div className="ri-pricing-body">
                      {parseLocalizedLines(
                        i18nField(selectedProduct, "pricingPercentage", "pricingPercentageEn", language),
                        language
                      ).map((line, i) => {
                        const discountMatch = line.match(/([0-9]+%\s*(?:de\s+desconto|off)?)/i);
                        const pillText = discountMatch ? discountMatch[1].toUpperCase() : null;

                        return (
                          <div key={i} className="ri-pricing-line">
                            <div className="ri-pricing-line-left">
                              <span className="ri-pricing-bullet" />
                              <span>{line}</span>
                            </div>
                            {pillText && (
                              <span className="ri-pricing-pill ri-pricing-pill--indigo">
                                {pillText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <a
                  href={discordUrl(selectedProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ri-modal-cta"
                >
                  <DiscordIcon className="w-4 h-4 text-[#5865F2]" />
                  <span>{L.wantReseller}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Lightbox ─── */}
      {lightboxIndex !== null && selectedProduct && (
        <div className="ri-lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="ri-lightbox-close" onClick={() => setLightboxIndex(null)} type="button">
            <X className="w-6 h-6" />
          </button>
          <button
            className="ri-lightbox-nav ri-lightbox-nav--prev"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const gallery = allProductImages(selectedProduct);
              setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={allProductImages(selectedProduct)[lightboxIndex]}
            className="ri-lightbox-img"
            onClick={(e) => e.stopPropagation()}
            alt=""
          />
          <button
            className="ri-lightbox-nav ri-lightbox-nav--next"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const gallery = allProductImages(selectedProduct);
              setLightboxIndex((lightboxIndex + 1) % gallery.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="ri-lightbox-count">
            {lightboxIndex + 1} / {allProductImages(selectedProduct).length}
          </div>
        </div>
      )}
    </div>
  );
}
