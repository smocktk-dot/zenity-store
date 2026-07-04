# ZENITY STORE — Reseller Panel

Sistema completo de painel de revenda de licenças de software.

## Stack

- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Node.js + Express + tRPC 11
- **Banco de dados:** MySQL (compatível com PlanetScale, Railway, TiDB)
- **Auth:** JWT customizado (admin + reseller)

## Setup do Banco de Dados

As migrations SQL estão em `drizzle/` e podem ser aplicadas em qualquer banco MySQL.

### Opção 1 — Railway (recomendado)
1. Crie um projeto em https://railway.app
2. Adicione um serviço MySQL
3. Copie a `DATABASE_URL` e configure no `.env`
4. Execute: `pnpm drizzle-kit migrate`

### Opção 2 — PlanetScale
1. Crie um banco em https://planetscale.com
2. Copie a connection string
3. Configure no `.env` e execute as migrations

### Opção 3 — VPS próprio
```bash
mysql -u root -p < drizzle/migrations/0000_initial.sql
```

## Variáveis de Ambiente

```env
DATABASE_URL=mysql://user:password@host:3306/dbname
JWT_SECRET=sua-chave-secreta-aqui
```

## Instalação

```bash
pnpm install
pnpm drizzle-kit migrate
pnpm dev
```

## Credenciais padrão (admin)

- **Usuário:** admin
- **Senha:** admin123

> Altere a senha após o primeiro login!

## Estrutura do Banco de Dados

| Tabela | Descrição |
|---|---|
| `admins` | Contas de administrador |
| `resellers` | Contas de reseller (créditos ou porcentagem) |
| `categories` | Categorias de apps |
| `apps` | Aplicações/produtos |
| `subscription_plans` | Planos de cada app (preço em créditos e em R$) |
| `reseller_apps` | Apps atribuídos a cada reseller |
| `license_keys` | Keys geradas/compradas |
| `credit_transactions` | Histórico de transações de crédito |
| `allowed_ips` | IPs com acesso ao painel admin |
