import { Link } from "wouter";
import {
  Scale, Boxes, Headset, UserX, KeyRound, Landmark, ShieldAlert, ArrowLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PublicNav, PublicFooter, DEFAULT_DISCORD_URL } from "@/components/PublicChrome";

const RULES = [
  {
    icon: Scale,
    title: "Respeite o Preço Mínimo",
    body: "Todo produto listado na plataforma tem um preço mínimo de venda publicado — o piso. O piso existe para proteger todos os revendedores e manter o mercado estável. Vender abaixo do piso, diretamente ou por meio de descontos escondidos, prejudica todos os outros revendedores e danifica o ecossistema. Você pode montar seus próprios bundles, kits de ativação ou descontos por volume — desde que o preço efetivo por key fique no piso ou acima. Se você for pego vendendo abaixo, seu acesso ao painel será revogado.",
  },
  {
    icon: Boxes,
    title: "Vendas em Volume Permitidas — Proibido Revender Painel Ilimitado",
    body: "Você pode vender keys em volume com preço com desconto para compradores que adquirem grandes quantidades. O que você não pode fazer é vender, alugar ou fornecer acesso ilimitado ao painel de geração — seu login, suas API keys ou qualquer ferramenta que permita a outra pessoa gerar keys por demanda usando a sua conta. Oferecer geração ilimitada de keys, sub-painéis ou acesso ao painel como produto para terceiros é estritamente proibido — você vende keys, não a capacidade de criá-las. Toda geração é rastreada de volta ao painel de origem, então se a sua conta for encontrada gerando keys em nome de outra pessoa, ela será suspensa.",
  },
  {
    icon: Headset,
    title: "Suporte aos Seus Próprios Compradores",
    body: "Quando alguém compra uma key sua, essa pessoa vira seu cliente — não nosso. Você é responsável por instruções de instalação, dúvidas de configuração, reembolsos e qualquer problema que surgir. A equipe da plataforma não presta suporte a usuários finais de keys vendidas por revendedores. Nós só intervimos durante janelas de detecção, indisponibilidade da plataforma ou situações que afetem todos os usuários de forma global. Todo o resto é entre você e o seu comprador.",
  },
  {
    icon: UserX,
    title: "Proibido Personificação",
    body: "Você deve sempre se apresentar como um revendedor autorizado, nunca como a plataforma em si. Isso significa não clonar páginas de checkout que imitem o site da VG Sellers, não usar domínios que se pareçam com URLs oficiais da plataforma, e não fingir ser membro da equipe em nenhuma comunicação. Se um comprador perguntar de onde a key vem, diga honestamente que ela é emitida pela plataforma VG Sellers. Deturpar o seu relacionamento com a plataforma corrói a confiança de todos os envolvidos.",
  },
  {
    icon: KeyRound,
    title: "Keys São Intransferíveis",
    body: "Uma vez que a key é resgatada numa conta específica, ela fica permanentemente vinculada a ela. Você não pode transferir keys entre clientes diferentes, revender keys que já foram ativadas, nem distribuir códigos de keys em canais públicos, servidores ou fóruns para atrair atenção. Cada key é rastreada até o fim. Se um lote de keys for encontrado vazado ou distribuído publicamente, o lote inteiro será revogado imediatamente e nenhum crédito de saldo será emitido pelas keys perdidas.",
  },
  {
    icon: Landmark,
    title: "Você Responde Pelos Chargebacks",
    body: "Se um dos seus compradores abrir uma disputa ou chargeback, o valor é debitado diretamente do seu saldo ou cobrado do seu plano ativo. A plataforma não absorve custos de chargeback de transações de revendedores. Para se proteger, filtre seus compradores com cuidado antes de vender, guarde registros e comprovantes de entrega de cada transação e evite vender para pessoas em quem você não pode confiar. Levar chargebacks a sério faz parte de uma operação de revenda responsável.",
  },
];

const VIOLATION = {
  title: "Violações das Regras",
  body: "Qualquer violação das regras listadas acima resultará na suspensão imediata da sua conta de revendedor, sem aviso prévio. Dependendo da gravidade, a suspensão pode ser temporária ou permanente. Violações graves e deliberadas — especialmente vendas abaixo do piso, revenda de acesso ilimitado, personificação ou vazamento de keys — são tratadas como motivo de banimento permanente, sem direito a apelação. O seu saldo restante pode ser retido. Essas regras existem para manter a plataforma justa para todo revendedor, e o cumprimento delas é estrito.",
};

export default function RulesPage() {
  const { data: products = [] } = trpc.auth.listResellerInfo.useQuery();
  const discord = (products as { discordUrl?: string | null }[]).find(p => p.discordUrl)?.discordUrl || DEFAULT_DISCORD_URL;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-20 text-center px-6 overflow-hidden">
        {/* glow central */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        </div>

        <div className="relative">
          <p className="text-[10px] font-bold tracking-[0.35em] text-emerald-400/80 uppercase mb-6 inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.06] rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Política da Plataforma
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Regras de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">Revenda</span>
          </h1>
          <p className="mt-6 text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Todos os revendedores da plataforma VG Sellers devem seguir estas regras.
            Descumpri-las resulta em suspensão ou remoção permanente da conta.
          </p>
        </div>
      </section>

      {/* ── Regras ───────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-6 pb-24">
        {/* linha vertical da timeline */}
        <div className="absolute left-[38px] md:left-[38px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-white/[0.07] to-transparent hidden sm:block" aria-hidden="true" />

        <div className="space-y-6">
          {RULES.map((r, i) => (
            <div
              key={r.title}
              className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.035] hover:border-white/[0.12] transition-all duration-300 p-7 flex gap-5"
            >
              <div className="relative flex flex-col items-center flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  <r.icon className="w-5 h-5" />
                </div>
                <span className="mt-2 text-[9px] font-bold tracking-widest text-zinc-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm md:text-[15px] font-bold tracking-wide text-zinc-100 mb-3">
                  {r.title}
                </h2>
                <p className="text-[13px] text-zinc-400 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}

          {/* Regra 7 — destaque vermelho */}
          <div className="relative rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-7 flex gap-5">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="mt-2 text-[9px] font-bold tracking-widest text-red-500/60">07</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-[15px] font-bold tracking-wide text-red-300 mb-3">
                {VIOLATION.title}
              </h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">{VIOLATION.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 md:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute left-1/2 -top-24 -translate-x-1/2 w-96 h-48 rounded-full bg-emerald-500/[0.08] blur-[80px]" />
          </div>
          <div className="relative">
            <h3 className="text-lg font-bold mb-2">Dúvidas sobre as regras?</h3>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
              Fale com a equipe no Discord antes de presumir — interpretar errado também é violação.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <a href={discord} target="_blank" rel="noreferrer"
                className="h-11 px-7 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase inline-flex items-center hover:bg-zinc-200 transition-colors">
                Entrar no Discord
              </a>
              <Link href="/">
                <span className="h-11 px-7 rounded-lg border border-white/15 text-zinc-300 text-[11px] font-bold tracking-[0.15em] uppercase inline-flex items-center gap-2 hover:bg-white/[0.06] hover:border-white/30 transition-all cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar pro Início
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter discord={discord} />
    </div>
  );
}
