import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import CyberNetwork from "@/components/CyberNetwork";
import { PublicNav, PublicFooter, DEFAULT_DISCORD_URL } from "@/components/PublicChrome";
import {
  Zap, Download, LayoutDashboard, Bitcoin, Paintbrush, ArrowRight,
  Package, ChevronRight, Sparkles,
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
];

const CRYPTOS = ["BTC", "ETH", "LTC", "SOL", "USDT ERC20", "USDT SPL", "USDC ERC20", "USDC SPL"];

const CREDIT_TIERS = [
  { name: "Entrada", price: "$0", unit: "sem depósito mínimo", off: "50% OFF", note: "em todas as keys" },
  { name: "Starter", price: "$200", unit: "depósito", off: "60% OFF", note: "em todas as keys" },
  { name: "Pro", price: "$300", unit: "depósito", off: "70% OFF", note: "em todas as keys" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export default function Home() {
  const { data: products = [] } = trpc.auth.listResellerInfo.useQuery();
  const active = (products as Product[]).filter(p => p.status === "active");
  const discord = active.find(p => p.discordUrl)?.discordUrl || DEFAULT_DISCORD_URL;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-400/30">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          <CyberNetwork nodeCount={70} />
        </div>
        {/* glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-emerald-500/[0.09] blur-[140px]" />
          <div className="absolute left-[15%] top-1/2 w-72 h-72 rounded-full bg-emerald-400/[0.05] blur-[100px]" />
          <div className="absolute right-[15%] top-1/3 w-72 h-72 rounded-full bg-teal-500/[0.05] blur-[100px]" />
        </div>
        {/* grid lines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          aria-hidden="true"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.35em] text-emerald-400/90 uppercase mb-8 border border-emerald-500/25 bg-emerald-500/[0.06] rounded-full px-5 py-2 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <Sparkles className="w-3 h-3" />
              Plataforma de Revenda
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.03]"
          >
            Premium Key<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              Reseller Panel
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-7 text-sm md:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto"
          >
            Gere keys, gerencie seu estoque e faça seu negócio crescer com o nosso painel profissional de revenda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-11 flex items-center justify-center gap-4 flex-wrap"
          >
            <a href={discord} target="_blank" rel="noreferrer"
              className="group h-12 px-7 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center gap-2 hover:bg-emerald-50 transition-all hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              Contato pra começar a vender
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
            <Link href="/login">
              <span className="h-12 px-7 rounded-lg border border-white/20 text-zinc-200 text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center hover:bg-white/[0.07] hover:border-emerald-400/40 hover:text-emerald-300 transition-all cursor-pointer hover:scale-[1.03]">
                Entrar
              </span>
            </Link>
          </motion.div>
        </div>

        {/* fade bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* ── Produtos ─────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl font-bold tracking-tight">Produtos Disponíveis</h2>
          <p className="text-xs text-zinc-500 mt-2 tracking-wide">Selecione um produto para começar a revender</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {active.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 hover:border-emerald-500/30 hover:shadow-[0_0_50px_rgba(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* top glow line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Package className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo
                </span>
              </div>

              <h3 className="font-bold text-base mb-2 group-hover:text-emerald-300 transition-colors">{p.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed min-h-[48px]">
                {p.tagline || p.description || "Painel completo de revenda com geração de keys, reset de HWID, loader sem marca e gestão de estoque em tempo real."}
              </p>
              <div className="flex gap-2 mt-6">
                <Link href="/resellerinfo">
                  <span className="flex-1 text-center text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 border border-white/[0.08] rounded-md px-3 py-2.5 hover:bg-white/[0.05] hover:text-zinc-200 transition-all cursor-pointer">
                    Web Panel
                  </span>
                </Link>
                <Link href="/login">
                  <span className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold tracking-[0.12em] uppercase text-black bg-white rounded-md px-3 py-2.5 hover:bg-emerald-300 transition-all cursor-pointer">
                    Acessar Painel <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </motion.div>
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
        <section className="mx-auto max-w-5xl px-6 pb-24 space-y-14">
          {active.filter(p => p.pricingCredits || p.pricingPercentage).map(p => (
            <motion.div key={p.id} {...fadeUp}>
              <div className="text-center mb-9">
                <h3 className="text-xl font-bold tracking-tight">
                  {p.title} — <span className="text-emerald-400">Tiers de Revenda</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1.5">Quanto maior o depósito, maior o desconto em cada key</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {p.pricingCredits && CREDIT_TIERS.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                    className={`relative rounded-2xl border p-6 text-center flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                      i === CREDIT_TIERS.length - 1
                        ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-500/[0.02] shadow-[0_0_45px_rgba(16,185,129,0.15)]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.035]"
                    }`}
                  >
                    {i === CREDIT_TIERS.length - 1 && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.2em] uppercase bg-emerald-400 text-black rounded-full px-3 py-1 whitespace-nowrap shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                        Melhor valor
                      </span>
                    )}
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-300 mb-3">{t.name}</p>
                    <p className="text-3xl font-extrabold tracking-tight">{t.price}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.unit}</p>
                    <div className="mt-auto pt-4">
                      <p className="text-sm font-bold text-emerald-400">{t.off}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{t.note}</p>
                    </div>
                  </motion.div>
                ))}
                {p.pricingPercentage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6 text-center flex flex-col hover:-translate-y-1 transition-all duration-300"
                  >
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-300 mb-3">Porcentagem</p>
                    <p className="text-sm font-bold text-zinc-100">Painel porcentagem disponível</p>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                      Único requisito: ter uma loja consolidada ou uma loja com 1k+ membros
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-emerald-500/25 hover:bg-white/[0.035] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <f.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2">{f.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <motion.div {...fadeUp} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 relative hover:border-emerald-500/25 transition-colors duration-300">
            <span className="absolute top-5 right-5 text-[9px] font-bold tracking-[0.15em] text-emerald-400/80 border border-emerald-500/25 bg-emerald-500/[0.07] rounded-full px-2.5 py-0.5 uppercase">Sob consulta</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Paintbrush className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2">Rebranding de Loader</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Rebranding do loader sob demanda. O valor depende do que você precisa — chama no Discord.</p>
            <a href={discord} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-emerald-400 hover:text-emerald-300 mt-4 transition-colors">
              Peça um orçamento <ArrowRight className="w-3 h-3" />
            </a>
          </motion.div>
          <motion.div {...fadeUp} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-emerald-500/25 transition-colors duration-300">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Bitcoin className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-2">Recarga Instantânea</p>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">Adicione saldo na hora com crypto. Seu saldo atualiza assim que a rede confirma.</p>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-600 mb-2">Criptos Aceitas</p>
            <div className="flex flex-wrap gap-1.5">
              {CRYPTOS.map(c => (
                <span key={c} className="text-[9px] font-mono font-semibold text-zinc-300 bg-white/[0.05] border border-white/[0.08] rounded px-2 py-1 hover:border-emerald-500/30 hover:text-emerald-300 transition-colors">{c}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div {...fadeUp} className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent py-16 px-8 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute left-1/2 -top-20 -translate-x-1/2 w-[500px] h-56 rounded-full bg-emerald-500/[0.1] blur-[90px]" />
          </div>
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pronto pra começar a vender?</h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-4 max-w-md mx-auto leading-relaxed">
              Entre no nosso Discord pra começar. Nossa equipe configura sua conta de revendedor logo após o contato.
            </p>
            <a href={discord} target="_blank" rel="noreferrer"
              className="group mt-8 h-12 px-7 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.12em] uppercase inline-flex items-center gap-2 hover:bg-emerald-50 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all">
              Contato pra começar a vender
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </motion.div>
      </section>

      <PublicFooter discord={discord} />
    </div>
  );
}
