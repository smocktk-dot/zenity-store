import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import CyberNetwork from "@/components/CyberNetwork";
import { PublicNav, PublicFooter, DEFAULT_DISCORD_URL } from "@/components/PublicChrome";
import {
  Zap, Download, LayoutDashboard, Bitcoin, Paintbrush, ArrowRight, ShieldCheck,
} from "lucide-react";

type Product = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  pricingCredits: string | null;
  pricingPercentage: string | null;
  imageUrl: string | null;
  discordUrl: string | null;
  status: string;
};

const FEATURES = [
  { icon: Zap, title: "Geração Instantânea", desc: "Gere keys na hora pelo nosso painel web. Sem bots, sem filas." },
  { icon: Download, title: "Loader sem Marca", desc: "Download de loader white-label incluso. Venda com a sua marca." },
  { icon: LayoutDashboard, title: "Dashboard Completo", desc: "Acompanhe keys, resgates, vendas e gerencie tudo num só lugar." },
  { icon: Bitcoin, title: "Recarga Instantânea", desc: "Adicione saldo na hora com crypto. Seu saldo atualiza assim que a rede confirma." },
];

const CRYPTOS = ["BTC", "ETH", "LTC", "SOL", "USDT ERC20", "USDT SPL", "USDC ERC20", "USDC SPL"];

export default function Home() {
  const { data: products = [] } = trpc.auth.listResellerInfo.useQuery();
  const active = (products as Product[]).filter(p => p.status === "active");
  const discord = active.find(p => p.discordUrl)?.discordUrl || DEFAULT_DISCORD_URL;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <CyberNetwork nodeCount={60} />
        </div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,255,255,0.05), transparent 70%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.35em] text-zinc-500 uppercase mb-6">Plataforma de Revenda</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Premium Key<br />Reseller Panel
          </h1>
          <p className="mt-6 text-sm md:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto">
            Gere keys, gerencie seu estoque e faça seu negócio crescer com o nosso painel profissional de revenda.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <a href={discord} target="_blank" rel="noreferrer"
              className="h-11 px-6 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center gap-2 hover:bg-zinc-200 transition-colors">
              Contato pra começar a vender
            </a>
            <Link href="/login">
              <span className="h-11 px-6 rounded-lg border border-white/15 text-zinc-200 text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center hover:bg-white/[0.06] hover:border-white/30 transition-all cursor-pointer">
                Entrar
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Produtos ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xl font-bold tracking-tight">Produtos Disponíveis</h2>
          <p className="text-xs text-zinc-500 mt-2 tracking-wide">Selecione um produto para começar a revender</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {active.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/[0.14] hover:bg-white/[0.035] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[15px]">{p.title}</h3>
                <span className="text-[9px] font-bold tracking-[0.15em] px-2 py-0.5 rounded-full border border-white/15 text-zinc-400 uppercase">Ativo</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed min-h-[48px]">
                {p.tagline || p.description || "Painel completo de revenda com geração de keys, reset de HWID, loader sem marca e gestão de estoque em tempo real."}
              </p>
              <div className="flex gap-2 mt-6">
                <Link href="/resellerinfo">
                  <span className="flex-1 text-center text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 border border-white/[0.08] rounded-md px-3 py-2 hover:bg-white/[0.05] hover:text-zinc-200 transition-all cursor-pointer">
                    Web Panel
                  </span>
                </Link>
                <Link href="/login">
                  <span className="flex-1 text-center text-[10px] font-bold tracking-[0.12em] uppercase text-black bg-white rounded-md px-3 py-2 hover:bg-zinc-200 transition-all cursor-pointer">
                    Acessar Painel
                  </span>
                </Link>
              </div>
            </div>
          ))}
          {!active.length && (
            <div className="col-span-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center text-sm text-zinc-500">
              Nenhum produto publicado ainda.
            </div>
          )}
        </div>
      </section>

      {/* ── Tiers por produto ────────────────────────────────────────────── */}
      {active.some(p => p.pricingCredits || p.pricingPercentage) && (
        <section className="mx-auto max-w-5xl px-6 pb-20 space-y-14">
          {active.filter(p => p.pricingCredits || p.pricingPercentage).map(p => (
            <div key={p.id}>
              <div className="text-center mb-8">
                <h3 className="text-lg font-bold tracking-tight">{p.title} — Tiers de Revenda</h3>
                <p className="text-xs text-zinc-500 mt-1.5">Quanto maior o depósito, maior o desconto em cada key</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {p.pricingCredits && (
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
                    <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase mb-3">Créditos</p>
                    <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">{p.pricingCredits}</p>
                  </div>
                )}
                {p.pricingPercentage && (
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
                    <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase mb-3">Porcentagem</p>
                    <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">{p.pricingPercentage}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <f.icon className="w-4 h-4 text-zinc-400 mb-4" />
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 relative">
            <span className="absolute top-5 right-5 text-[9px] font-bold tracking-[0.15em] text-zinc-500 border border-white/10 rounded-full px-2 py-0.5 uppercase">Sob consulta</span>
            <Paintbrush className="w-4 h-4 text-zinc-400 mb-4" />
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2">Rebranding de Loader</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Rebranding do loader sob demanda. O valor depende do que você precisa — chama no Discord.</p>
            <a href={discord} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-300 hover:text-white mt-4 transition-colors">
              Peça um orçamento <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <ShieldCheck className="w-4 h-4 text-zinc-400 mb-4" />
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3">Criptos Aceitas</p>
            <div className="flex flex-wrap gap-2">
              {CRYPTOS.map(c => (
                <span key={c} className="text-[10px] font-mono font-semibold text-zinc-300 bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] py-16 px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pronto pra começar a vender?</h2>
          <p className="text-xs md:text-sm text-zinc-500 mt-4 max-w-md mx-auto leading-relaxed">
            Entre no nosso Discord pra começar. Nossa equipe configura sua conta de revendedor logo após o contato.
          </p>
          <a href={discord} target="_blank" rel="noreferrer"
            className="mt-8 h-11 px-6 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center hover:bg-zinc-200 transition-colors">
            Contato pra começar a vender
          </a>
        </div>
      </section>

      <PublicFooter discord={discord} />
    </div>
  );
}
