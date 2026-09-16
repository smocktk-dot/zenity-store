-- Seed para popular a tabela reseller_info_products com os 2 produtos iniciais
-- Execute com: psql "$DATABASE_URL" -f scripts/seed_reseller_info_products.sql
-- Ou rode no SQL Editor do Neon

INSERT INTO "reseller_info_products" (
  "title",
  "slug",
  "tagline",
  "description",
  "pricingCredits",
  "pricingPercentage",
  "imageUrl",
  "galleryImages",
  "discordUrl",
  "sortOrder",
  "status"
) VALUES (
  'PUBLIC EMULATOR',
  'public-emulator',
  'Tecnologia exclusiva de emulação Riot Games com zero detecção',
  $PDESC$# **VG - PUBLIC EMULATOR**

- COMO FUNCIONA O **PUBLIC EMULATOR**? / - How does the **Public Emulator** work?

<:Brasil:1489314663304003745>
`O Public Emulator Ele Funciona Emulando Uma Sessao Da Riot Games, e Faz Acreditar Que Voce Esta Entrando No Valorant Com o Vanguard, Mas Voce Entrara No Valorant Sem O Vanguard e Ainda Ira Poder Iniciar Qualquer Tipo de Queue Sem Ser Pego!`

🇺🇸
`The Public Emulator works by emulating a Riot Games session, making it appear as though you are launching Valorant with Vanguard enabled; however, you will actually enter the game without Vanguard and can even start any type of queue without getting caught!`

# **TECNOLOGIA EXCLUSIVA / - EXCLUSIVE TECHNOLOGY**

<:Brasil:1489314663304003745>
`Nosso emulador cria um servidor privado para cada usuário, totalmente customizável e individual.`
`Garantia VG: Zero erros de conexão, zero detecções e zero banimentos.`

🇺🇸
`Our emulator creates a fully customizable, individual private server for each user.`
`VG Guarantee: Zero connection errors, zero detections, and zero bans.`

## - <:Brasil:1489314663304003745> Para Se Tornar Reseller da VG Basta Acessar O Canal <#1541567852421718026>
## - 🇺🇸 To become a VG reseller, simply access the channel. <#1541567852421718026>

||@everyone @here ||$PDESC$,
  $PRC$<:Brasil:1489314663304003745> - Seller Credits

- Painel De Creditos Lancado e Disponivel !
Depósitos mínimo -

$300 <:caixa:1490812696474685631> 60% de desconto em chaves
$400 <:caixa:1490812696474685631> 70% de desconto em chaves

<:1287053196539330612:1490811915004284978> Unlimited Keys
$600 / mês$PRC$,
  $PRP$<:Brasil:1489314663304003745> - Seller Porcentagem

- Painel Porcentagem Disponivel
Sem Deposito Minimo -

`( VOCE COMECA COM 35% DE DESCONTO )`
`( SE VOCE FIZER MAIS 10 VENDAS O VALOR E AUMENTADO PARA 50% DE DESCONTO EM CADA KEY )`$PRP$,
  NULL,
  NULL,
  'https://discord.gg/vgseller',
  0,
  'active'
), (
  'UNLOCK ALL WEB',
  'unlock-all-web',
  'Desbloqueio de skins, chaveiros, skins Deluxe, rank e loadout web',
  $PDESC$# **UNLOCK ALL WEB**

UNLOCK ALL WEB desbloqueia todas as skins, chaveiros, skins Deluxe e todas as skins do Valorant. Você pode modificar as skins dentro da partida pelo painel web, fazer um loadout de skins no próprio site e alterar o rank da conta — tudo através de um site web.$PDESC$,
  $PRC$<:Brasil:1489314663304003745> - Seller Credits

- Painel De Creditos Lancado e Disponivel !
Depósitos mínimo -

R$ 1500 - MENSAL <a:money:1491961326694695102> ( Unlimited Keys )
$300 - MONTHLY <a:money:1491961326694695102> ( Unlimited Keys )$PRC$,
  $PRP$<:Brasil:1489314663304003745> - Seller Porcentagem

- Painel Porcentagem Disponivel
Sem Deposito Minimo -

`( VOCE COMECA COM 35% DE DESCONTO )`
`( SE VOCE FIZER MAIS 10 VENDAS O VALOR E AUMENTADO PARA 50% DE DESCONTO EM CADA KEY )`$PRP$,
  NULL,
  NULL,
  'https://discord.gg/vgseller',
  1,
  'active'
)
ON CONFLICT ("slug") DO NOTHING;
