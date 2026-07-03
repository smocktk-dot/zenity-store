# CV Reseller Panel - TODO

## Fase 1: Banco de Dados
- [x] Schema: tabela resellers (usuário/senha própria, créditos, desconto, compras)
- [x] Schema: tabela categories (categorias de apps)
- [x] Schema: tabela apps (produtos/aplicações)
- [x] Schema: tabela reseller_apps (apps atribuídos a cada reseller)
- [x] Schema: tabela license_keys (keys geradas)
- [x] Schema: tabela credit_transactions (histórico de transações de crédito)
- [x] Aplicar migrações SQL

## Fase 2: Backend (tRPC Routers)
- [x] Router auth: login admin (usuário/senha), login reseller, logout, sessão JWT própria
- [x] Router admin.resellers: listar, criar, editar, ativar/desativar, adicionar créditos
- [x] Router admin.categories: listar, criar, editar, deletar
- [x] Router admin.apps: listar, criar, editar, deletar, atribuir a resellers
- [x] Router admin.keys: listar todas as keys
- [x] Router reseller.profile: perfil, créditos, desconto, progresso
- [x] Router reseller.apps: listar apps disponíveis
- [x] Router reseller.keys: listar keys, gerar keys (desconta créditos), resetar HWID, revogar
- [x] Middleware de autenticação separada (admin vs reseller) via JWT

## Fase 3: Frontend Admin
- [x] Tela de login (dark theme, campos usuário/senha, botão Sign In)
- [x] Layout admin com sidebar (dark theme)
- [x] Página: Gerenciar Resellers (tabela, criar, editar, ativar/desativar, adicionar créditos)
- [x] Página: Categorias (listar, criar, editar, deletar)
- [x] Página: Apps/Produtos (listar, criar, editar, deletar, atribuir resellers)
- [x] Página: Visualizar Keys (todas as keys do sistema)

## Fase 4: Frontend Reseller
- [x] Tela de login reseller (dark theme)
- [x] Layout reseller com header (dark theme)
- [x] Página: Perfil (créditos, desconto atual, progresso para próximo nível, histórico)
- [x] Página: Apps disponíveis (cards com detalhes de cada app)
- [x] Página: Detalhe do App (planos, gerar keys)
- [x] Página: Minhas Keys (listar, status, resetar HWID, revogar, copiar)
- [x] Modal: Gerar Keys (selecionar plano, quantidade, duração, preview de custo)

## Fase 5: Polimento e Testes
- [x] Design dark theme consistente (cores: vermelho #e53e3e, fundo #0a0a0a, cards #111)
- [x] Animações e micro-interações
- [x] Testes vitest para routers críticos (7 testes passando)
- [x] Checkpoint final

## Fase 6: Separação de Tipos de Reseller
- [x] Schema: adicionar campo resellerType (credits | percentage) na tabela resellers
- [x] Schema: adicionar campo pricePercentage nos plans
- [x] Backend: atualizar createReseller/updateReseller com resellerType
- [x] Backend: router reseller.buyKey para resellers de porcentagem (compra com desconto %)
- [x] Painel Admin: seleção de tipo ao criar/editar reseller
- [x] Painel Admin: separação de preços por tipo nos planos de apps
- [x] Painel Reseller Créditos: perfil mostra só créditos + botão Buy Credits, gerar keys
- [x] Painel Reseller Porcentagem: perfil mostra só desconto % + progresso, aba Comprar Keys
- [x] Corrigir perfil: substituir aba "Minhas Keys" por "Comprar Créditos" no tipo créditos
