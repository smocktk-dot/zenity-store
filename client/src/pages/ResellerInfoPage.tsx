import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
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
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_DISCORD_URL = "https://discord.gg/vgseller";

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

function i18nField(p: Product, ptField: keyof Product, enField: keyof Product, lang: "pt" | "en"): string | null {
  const en = lang === "en" ? (p[enField] as string | null) : null;
  if (en && en.trim().length > 0) return en;
  return p[ptField] as string | null;
}

function ProductImageBanner({ product }: { product: Product }) {
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
    <div className="ri-modal-cover ri-modal-cover-banner">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="ri-modal-cover-slide"
          style={{ backgroundImage: `url(${images[idx]})` }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <button className="ri-modal-arrow ri-modal-arrow--prev" onClick={goPrev} type="button">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="ri-modal-arrow ri-modal-arrow--next" onClick={goNext} type="button">
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
    backToLogin: "Voltar ao Login",
    program: "Programa de Revenda",
    become: "Torne-se um",
    officialReseller: "Revendedor Oficial",
    heroSub: "Acesse tecnologia exclusiva, painéis profissionais e margens reais de lucro. Escolha o produto que combina com seu público e comece a vender hoje mesmo.",
    featureExclusive: "Tecnologia Exclusiva",
    featureExclusiveDesc: "Servidores privados e zero detecção",
    featurePanel: "Painel Profissional",
    featurePanelDesc: "Gestão completa de keys e estoque",
    featureAuto: "Geração Automática",
    featureAutoDesc: "Keys entregues na hora via API",
    catalog: "Catálogo de Produtos",
    available: "Produtos Disponíveis para Revenda",
    catalogSub: "Conheça cada produto, seus planos e formas de se tornar reseller. Clique em um produto para ver detalhes completos.",
    noProducts: "Nenhum produto cadastrado ainda.",
    availableStatus: "Disponível",
    soonStatus: "Em breve",
    viewDetails: "Ver detalhes",
    product: "Produto",
    description: "Descrição",
    gallery: "Galeria de Imagens",
    credits: "Seller Credits",
    percentage: "Seller Porcentagem",
    creditsSub: "Painel de créditos — pague conforme vende",
    percentageSub: "Sem depósito — desconto direto nas keys",
    ready: "Pronto para começar?",
    readySub: "Entre no nosso Discord e solicite seu acesso de reseller.",
    beReseller: "Seja um Reseller",
    wantReseller: "Quero virar Reseller",
    statSupport: "Suporte",
    statApi: "Própria",
    statDelivery: "Entrega",
    loading: "Carregando...",
    system: "Sistema Operacional",
  },
  en: {
    backToLogin: "Back to Login",
    program: "Reseller Program",
    become: "Become an",
    officialReseller: "Official Reseller",
    heroSub: "Get exclusive technology, professional panels and real profit margins. Choose the product that fits your audience and start selling today.",
    featureExclusive: "Exclusive Technology",
    featureExclusiveDesc: "Private servers and zero detection",
    featurePanel: "Professional Panel",
    featurePanelDesc: "Complete key and stock management",
    featureAuto: "Automatic Generation",
    featureAutoDesc: "Keys delivered instantly via API",
    catalog: "Product Catalog",
    available: "Products Available for Resale",
    catalogSub: "Learn about each product, its plans and how to become a reseller. Click a product to see full details.",
    noProducts: "No products registered yet.",
    availableStatus: "Available",
    soonStatus: "Coming soon",
    viewDetails: "View details",
    product: "Product",
    description: "Description",
    gallery: "Image Gallery",
    credits: "Seller Credits",
    percentage: "Seller Percentage",
    creditsSub: "Credits panel — pay as you sell",
    percentageSub: "No deposit — direct discount on keys",
    ready: "Ready to start?",
    readySub: "Join our Discord and request your reseller access.",
    beReseller: "Become a Reseller",
    wantReseller: "I want to be a Reseller",
    statSupport: "Support",
    statApi: "Own",
    statDelivery: "Auto",
    loading: "Loading...",
    system: "Operational System",
  },
};

export default function ResellerInfoPage() {
  const [location, navigate] = useLocation();
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
      {/* ─── Left brand panel ─── */}
      <motion.aside
        className="auth-left ri-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-left-bg">
          <div className="galaxy-bg">
            <div className="galaxy-stars" />
            <div className="galaxy-shooting-star" />
            <div className="galaxy-shooting-star" style={{ animationDelay: "11s", top: "60%" }} />
          </div>
        </div>
        <div className="auth-left-grid" />

        {/* Top brand lockup */}
        <div className="auth-left-top">
          <div className="auth-brand-mark">
            <span className="auth-brand-glyph">VG</span>
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">VG SELLERS</span>
            <span className="auth-brand-sub">{L.program}</span>
          </div>
        </div>

        {/* Center hero copy */}
        <div className="ri-left-hero">
          <div className="ri-hero-glow" aria-hidden="true" />
          <motion.div
            className="ri-hero-card"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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

        {/* Bottom stats */}
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
            <span className="ri-left-stat-value">Auto</span>
            <span className="ri-left-stat-label">{L.statDelivery}</span>
          </div>
        </div>

        {/* Bottom status */}
        <div className="auth-left-foot">
          <div className="auth-status-pulse" />
          <span className="auth-status-label">{L.system}</span>
        </div>
      </motion.aside>

      {/* ─── Right content panel ─── */}
      <motion.main
        className="auth-right ri-right"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top bar */}
        <div className="auth-topbar ri-topbar">
          <div className="ri-topbar-pill">
            <button
              onClick={() => navigate("/")}
              className="auth-topbar-link"
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
              {products.map((p, i) => (
                <motion.button
                  key={p.id}
                  onClick={() => openProduct(p)}
                  className="ri-card"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  {p.imageUrl ? (
                    <div className="ri-card-image" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                  ) : (
                    <div
                      className="ri-card-image ri-card-image--placeholder"
                      style={{ background: productGradient(p.title) }}
                    >
                      <span className="ri-card-initial">{productInitial(p.title)}</span>
                    </div>
                  )}
                  <div className="ri-card-body">
                    <div className="ri-card-tag">
                      <span className="ri-card-tag-dot" />
                      <span>{p.status === "active" ? L.availableStatus : L.soonStatus}</span>
                    </div>
                    <h3 className="ri-card-title">{p.title}</h3>
                    {p.tagline && <p className="ri-card-tagline">{p.tagline}</p>}
                    <div className="ri-card-foot">
                      <span className="ri-card-cta">{L.viewDetails}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* CTA bottom */}
          <div className="ri-cta-banner">
            <div className="ri-cta-content">
              <Lock className="w-5 h-5" style={{ color: "#34d399" }} />
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
              <span>{L.beReseller}</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="ri-modal"
              onClick={(e: any) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
            <button className="ri-modal-close" onClick={closeProduct}>
              <X className="w-5 h-5" />
            </button>

            <div className="ri-modal-scroll">
              {/* Header */}
              <div className="ri-modal-head">
                <ProductImageBanner product={selectedProduct} />
                <div className="ri-modal-headtext">
                  <div className="ri-eyebrow">
                    <span className="ri-eyebrow-dot" />
                    <span>{L.product}</span>
                  </div>
                  <h2 className="ri-modal-title">{selectedProduct.title}</h2>
                  {selectedProduct.tagline && <p className="ri-modal-tagline">{selectedProduct.tagline}</p>}
                </div>
              </div>

              {/* Gallery */}
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
                    {(i18nField(selectedProduct, "description", "descriptionEn", language) || "").split("\n").map((line, i) => (
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
                    {(i18nField(selectedProduct, "pricingCredits", "pricingCreditsEn", language) || "").split("\n").map((line, i) => (
                      <div key={i} className="ri-pricing-line">
                        <span className="ri-pricing-bullet" />
                        <span>{line}</span>
                      </div>
                    ))}
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
                    {(i18nField(selectedProduct, "pricingPercentage", "pricingPercentageEn", language) || "").split("\n").map((line, i) => (
                      <div key={i} className="ri-pricing-line">
                        <span className="ri-pricing-bullet" />
                        <span>{line}</span>
                      </div>
                    ))}
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
          <button className="ri-lightbox-close" onClick={() => setLightboxIndex(null)}>
            <X className="w-6 h-6" />
          </button>
          <button
            className="ri-lightbox-nav ri-lightbox-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              const gallery = galleryFor(selectedProduct);
              setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={galleryFor(selectedProduct)[lightboxIndex]}
            className="ri-lightbox-img"
            onClick={(e) => e.stopPropagation()}
            alt=""
          />
          <button
            className="ri-lightbox-nav ri-lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              const gallery = galleryFor(selectedProduct);
              setLightboxIndex((lightboxIndex + 1) % gallery.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="ri-lightbox-count">
            {lightboxIndex + 1} / {galleryFor(selectedProduct).length}
          </div>
        </div>
      )}
    </div>
  );
}
