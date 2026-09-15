import { useState } from "react";
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
import LightStreaks from "@/components/LightStreaks";

const DEFAULT_DISCORD_URL = "https://discord.gg/vgseller";

type Product = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  pricingCredits: string | null;
  pricingPercentage: string | null;
  imageUrl: string | null;
  galleryImages: string | null;
  discordUrl: string | null;
  sortOrder: number;
  status: string;
};

export default function ResellerInfoPage() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();
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
      <aside className="auth-left ri-left">
        <div className="auth-left-bg">
          <div className="galaxy-bg">
            <div className="galaxy-stars" />
            <div className="galaxy-shooting-star" />
            <div className="galaxy-shooting-star" style={{ animationDelay: "11s", top: "60%" }} />
          </div>
        </div>
        <div className="auth-left-grid" />
        <LightStreaks />

        {/* Top brand lockup */}
        <div className="auth-left-top">
          <div className="auth-brand-mark">
            <span className="auth-brand-glyph">VG</span>
          </div>
          <div className="auth-brand-text">
            <span className="auth-brand-name">VG SELLERS</span>
            <span className="auth-brand-sub">Reseller Program</span>
          </div>
        </div>

        {/* Center hero copy */}
        <div className="ri-left-hero">
          <div className="ri-eyebrow">
            <span className="ri-eyebrow-dot" />
            <span>Programa de Revenda</span>
          </div>
          <h1 className="ri-left-title">
            Torne-se um<br />
            <span className="ri-left-title-accent">Revendedor Oficial</span>
          </h1>
          <p className="ri-left-sub">
            Acesse tecnologia exclusiva, painéis profissionais e margens reais de lucro.
            Escolha o produto que combina com seu público e comece a vender hoje mesmo.
          </p>

          <div className="ri-left-features">
            <div className="ri-feature">
              <div className="ri-feature-icon">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="ri-feature-text">
                <span className="ri-feature-title">Tecnologia Exclusiva</span>
                <span className="ri-feature-desc">Servidores privados e zero detecção</span>
              </div>
            </div>
            <div className="ri-feature">
              <div className="ri-feature-icon">
                <Crown className="w-4 h-4" />
              </div>
              <div className="ri-feature-text">
                <span className="ri-feature-title">Painel Profissional</span>
                <span className="ri-feature-desc">Gestão completa de keys e estoque</span>
              </div>
            </div>
            <div className="ri-feature">
              <div className="ri-feature-icon">
                <Zap className="w-4 h-4" />
              </div>
              <div className="ri-feature-text">
                <span className="ri-feature-title">Geração Automática</span>
                <span className="ri-feature-desc">Keys entregues na hora via API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom status */}
        <div className="auth-left-foot">
          <div className="auth-status-pulse" />
          <span className="auth-status-label">Sistema Operacional</span>
        </div>
      </aside>

      {/* ─── Right content panel ─── */}
      <main className="auth-right ri-right">
        {/* Top bar */}
        <div className="auth-topbar">
          <div className="auth-topbar-brand">
            <div className="auth-topbar-glyph">VG</div>
            <span className="auth-topbar-name">Reseller Info</span>
          </div>
          <div className="auth-topbar-actions">
            <button
              onClick={() => navigate("/")}
              className="auth-topbar-link"
            >
              Voltar ao Login
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
              <span>Catálogo de Produtos</span>
            </div>
            <h2 className="ri-content-title">Produtos Disponíveis para Revenda</h2>
            <p className="ri-content-sub">
              Conheça cada produto, seus planos e formas de se tornar reseller.
              Clique em um produto para ver detalhes completos.
            </p>
          </div>

          {isLoading ? (
            <div className="ri-loading">
              <div className="ri-spinner" />
              <span>Carregando produtos...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="ri-empty">
              <Sparkles className="w-8 h-8" style={{ color: "rgba(255,255,255,0.2)" }} />
              <p>Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="ri-grid">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProduct(p)}
                  className="ri-card"
                >
                  {p.imageUrl ? (
                    <div className="ri-card-image" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                  ) : (
                    <div className="ri-card-image ri-card-image--placeholder">
                      <ImageIcon className="w-7 h-7" style={{ color: "rgba(255,255,255,0.15)" }} />
                    </div>
                  )}
                  <div className="ri-card-body">
                    <div className="ri-card-tag">
                      <span className="ri-card-tag-dot" />
                      <span>{p.status === "active" ? "Disponível" : "Em breve"}</span>
                    </div>
                    <h3 className="ri-card-title">{p.title}</h3>
                    {p.tagline && <p className="ri-card-tagline">{p.tagline}</p>}
                    <div className="ri-card-foot">
                      <span className="ri-card-cta">Ver detalhes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CTA bottom */}
          <div className="ri-cta-banner">
            <div className="ri-cta-content">
              <Lock className="w-5 h-5" style={{ color: "#34d399" }} />
              <div>
                <p className="ri-cta-title">Pronto para começar?</p>
                <p className="ri-cta-sub">Entre no nosso Discord e solicite seu acesso de reseller.</p>
              </div>
            </div>
            <a
              href={DEFAULT_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ri-cta-btn"
            >
              <span>Seja um Reseller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>

      {/* ─── Product detail modal ─── */}
      {selectedProduct && (
        <div className="ri-modal-overlay" onClick={closeProduct}>
          <div className="ri-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ri-modal-close" onClick={closeProduct}>
              <X className="w-5 h-5" />
            </button>

            <div className="ri-modal-scroll">
              {/* Header */}
              <div className="ri-modal-head">
                {selectedProduct.imageUrl ? (
                  <div className="ri-modal-cover" style={{ backgroundImage: `url(${selectedProduct.imageUrl})` }} />
                ) : (
                  <div className="ri-modal-cover ri-modal-cover--placeholder">
                    <ImageIcon className="w-10 h-10" style={{ color: "rgba(255,255,255,0.15)" }} />
                  </div>
                )}
                <div className="ri-modal-headtext">
                  <div className="ri-eyebrow">
                    <span className="ri-eyebrow-dot" />
                    <span>Produto</span>
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
                    <span>Galeria de Imagens</span>
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
                    <span>Descrição</span>
                  </div>
                  <div className="ri-description">
                    {selectedProduct.description.split("\n").map((line, i) => (
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
                      <h3 className="ri-pricing-title">Seller Credits</h3>
                      <p className="ri-pricing-sub">Painel de créditos — pague conforme vende</p>
                    </div>
                  </div>
                  <div className="ri-pricing-body">
                    {selectedProduct.pricingCredits.split("\n").map((line, i) => (
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
                      <h3 className="ri-pricing-title">Seller Porcentagem</h3>
                      <p className="ri-pricing-sub">Sem depósito — desconto direto nas keys</p>
                    </div>
                  </div>
                  <div className="ri-pricing-body">
                    {selectedProduct.pricingPercentage.split("\n").map((line, i) => (
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
                <span>Quero virar Reseller</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

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
