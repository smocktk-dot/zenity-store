import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PublicNav, PublicFooter, DEFAULT_DISCORD_URL } from "@/components/PublicChrome";

const RULES = [
  {
    title: "Respeite o Preço Mínimo",
    body: "Todo produto listado na plataforma tem um preço mínimo de venda publicado — o piso. O piso existe para proteger todos os revendedores e manter o mercado estável. Vender abaixo do piso, diretamente ou por meio de descontos escondidos, prejudica todos os outros revendedores e danifica o ecossistema. Você pode montar seus próprios bundles, kits de ativação ou descontos por volume — desde que o preço efetivo por key fique no piso ou acima. Se você for pego vendendo abaixo, seu acesso ao painel será revogado.",
  },
  {
    title: "Vendas em Volume Permitidas — Proibido Revender Painel Ilimitado",
    body: "Você pode vender keys em volume com preço com desconto para compradores que adquirem grandes quantidades. O que você não pode fazer é vender, alugar ou fornecer acesso ilimitado ao painel de geração — seu login, suas API keys ou qualquer ferramenta que permita a outra pessoa gerar keys por demanda usando a sua conta. Oferecer geração ilimitada de keys, sub-painéis ou acesso ao painel como produto para terceiros é estritamente proibido — você vende keys, não a capacidade de criá-las. Toda geração é rastreada de volta ao painel de origem, então se a sua conta for encontrada gerando keys em nome de outra pessoa, ela será suspensa.",
  },
  {
    title: "Suporte aos Seus Próprios Compradores",
    body: "Quando alguém compra uma key sua, essa pessoa vira seu cliente — não nosso. Você é responsável por instruções de instalação, dúvidas de configuração, reembolsos e qualquer problema que surgir. A equipe da plataforma não presta suporte a usuários finais de keys vendidas por revendedores. Nós só intervimos durante janelas de detecção, indisponibilidade da plataforma ou situações que afetem todos os usuários de forma global. Todo o resto é entre você e o seu comprador.",
  },
  {
    title: "Proibido Personificação",
    body: "Você deve sempre se apresentar como um revendedor autorizado, nunca como a plataforma em si. Isso significa não clonar páginas de checkout que imitem o site da VG Sellers, não usar domínios que se pareçam com URLs oficiais da plataforma, e não fingir ser membro da equipe em nenhuma comunicação. Se um comprador perguntar de onde a key vem, diga honestamente que ela é emitida pela plataforma VG Sellers. Deturpar o seu relacionamento com a plataforma corrói a confiança de todos os envolvidos.",
  },
  {
    title: "Keys São Intransferíveis",
    body: "Uma vez que a key é resgatada numa conta específica, ela fica permanentemente vinculada a ela. Você não pode transferir keys entre clientes diferentes, revender keys que já foram ativadas, nem distribuir códigos de keys em canais públicos, servidores ou fóruns para atrair atenção. Cada key é rastreada até o fim. Se um lote de keys for encontrado vazado ou distribuído publicamente, o lote inteiro será revogado imediatamente e nenhum crédito de saldo será emitido pelas keys perdidas.",
  },
  {
    title: "Você Responde Pelos Chargebacks",
    body: "Se um dos seus compradores abrir uma disputa ou chargeback, o valor é debitado diretamente do seu saldo ou cobrado do seu plano ativo. A plataforma não absorve custos de chargeback de transações de revendedores. Para se proteger, filtre seus compradores com cuidado antes de vender, guarde registros e comprovantes de entrega de cada transação e evite vender para pessoas em quem você não pode confiar. Levar chargebacks a sério faz parte de uma operação de revenda responsável.",
  },
  {
    title: "Violações das Regras",
    body: "Qualquer violação das regras listadas acima resultará na suspensão imediata da sua conta de revendedor, sem aviso prévio. Dependendo da gravidade, a suspensão pode ser temporária ou permanente. Violações graves e deliberadas — especialmente vendas abaixo do piso, revenda de acesso ilimitado, personificação ou vazamento de keys — são tratadas como motivo de banimento permanente, sem direito a apelação. O seu saldo restante pode ser retido. Essas regras existem para manter a plataforma justa para todo revendedor, e o cumprimento delas é estrito.",
  },
];

export default function RulesPage() {
  const { data: products = [] } = trpc.auth.listResellerInfo.useQuery();
  const discord = (products as { discordUrl?: string | null }[]).find(p => p.discordUrl)?.discordUrl || DEFAULT_DISCORD_URL;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <PublicNav />

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 text-center px-6">
        <p className="text-[10px] font-bold tracking-[0.35em] text-zinc-500 uppercase mb-6">Política da Plataforma</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Regras de Revenda</h1>
        <p className="mt-5 text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Todos os revendedores da plataforma VG Sellers devem seguir estas regras.
          Descumpri-las resulta em suspensão ou remoção permanente da conta.
        </p>
      </section>

      {/* ── Regras ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-20 space-y-5">
        {RULES.map((r, i) => (
          <div key={r.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 flex gap-5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3 text-zinc-100">{r.title}</h2>
              <p className="text-[13px] text-zinc-500 leading-relaxed">{r.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Dúvidas sobre as regras? Fale com a equipe no Discord antes de presumir.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <a href={discord} target="_blank" rel="noreferrer"
              className="h-10 px-6 rounded-lg bg-white text-black text-[10px] font-bold tracking-[0.15em] uppercase inline-flex items-center hover:bg-zinc-200 transition-colors">
              Entrar no Discord
            </a>
            <Link href="/">
              <span className="h-10 px-6 rounded-lg border border-white/15 text-zinc-300 text-[10px] font-bold tracking-[0.15em] uppercase inline-flex items-center hover:bg-white/[0.06] hover:border-white/30 transition-all cursor-pointer">
                Voltar pro Início
              </span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter discord={discord} />
    </div>
  );
}
