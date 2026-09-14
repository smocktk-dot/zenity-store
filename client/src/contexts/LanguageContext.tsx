import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "pt" | "en";

export interface Translations {
  // Login
  login_title: string;
  login_subtitle: string;
  login_reseller_access: string;
  login_sign_in_desc: string;
  login_username: string;
  login_username_placeholder: string;
  login_password: string;
  login_signing_in: string;
  login_sign_in: string;
  login_secure_access: string;
  login_copyright: string;
  login_fill_fields: string;
  login_success: string;

  // Nav
  nav_profile: string;
  nav_apps: string;
  nav_my_keys: string;
  nav_tickets: string;
  nav_stats: string;
  nav_admin_panel: string;
  nav_loading: string;
  nav_logout: string;
  nav_logout_success: string;

  // Profile
  profile_title: string;
  profile_member_since: string;
  profile_location: string;
  profile_email: string;
  profile_total_purchases: string;
  profile_current_discount: string;
  profile_next_level: string;
  profile_purchases: string;
  profile_balance: string;
  profile_buy_credits: string;
  profile_recent_transactions: string;
  profile_no_transactions: string;
  profile_add: string;
  profile_deduct: string;
  profile_type_credits: string;
  profile_type_percentage: string;
  profile_pix_payments: string;
  profile_no_pix: string;
  profile_status_pending: string;
  profile_status_paid: string;
  profile_status_expired: string;
  profile_status_cancelled: string;
  profile_status_refunded: string;
  profile_discount_level: string;
  profile_discount_after: string;

  // Buy Credits Modal
  buy_credits_title: string;
  buy_credits_subtitle: string;
  buy_credits_current_balance: string;
  buy_credits_quick_values: string;
  buy_credits_or_type: string;
  buy_credits_placeholder: string;
  buy_credits_rate: string;
  buy_credits_cancel: string;
  buy_credits_generate_pix: string;
  buy_credits_generating: string;
  buy_credits_amount_to_pay: string;
  buy_credits_will_add: string;
  buy_credits_or_copypaste: string;
  buy_credits_copy: string;
  buy_credits_copied: string;
  buy_credits_close: string;
  buy_credits_verify: string;
  buy_credits_auto_check: string;
  buy_credits_waiting: string;
  buy_credits_confirmed_title: string;
  buy_credits_confirmed_desc: string;
  buy_credits_error: string;
  buy_credits_invalid_amount: string;
  buy_credits_pix_copied: string;

  // Apps
  apps_title: string;
  apps_subtitle: string;
  apps_no_apps: string;
  apps_loading: string;
  apps_not_found: string;
  apps_available_plans: string;
  apps_no_plans: string;
  apps_features: string;
  apps_buy: string;
  apps_generate_key: string;
  apps_lifetime: string;
  apps_days: string;
  apps_overview: string;
  apps_buy_keys: string;
  apps_current_discount: string;
  apps_next_level: string;
  apps_original_price: string;
  apps_with_discount: string;
  apps_total: string;
  apps_plan: string;
  apps_select_plan: string;
  apps_quantity: string;
  apps_note: string;
  apps_note_placeholder: string;
  apps_price_per_key: string;
  apps_balance: string;
  apps_insufficient_credits: string;
  apps_generating: string;
  apps_confirm: string;
  apps_cancel: string;
  apps_loading_app: string;

  // Keys
  keys_title: string;
  keys_subtitle: string;
  keys_no_keys: string;
  keys_status_unused: string;
  keys_status_used: string;
  keys_status_revoked: string;
  keys_status_expired: string;
  keys_copy: string;
  keys_copied: string;
  keys_reset_hwid: string;
  keys_revoke: string;
  keys_plan: string;
  keys_duration: string;
  keys_created: string;
  keys_expires: string;
  keys_used_by: string;
  keys_loading: string;
  keys_search: string;
  keys_filter_all: string;
  keys_filter_unused: string;
  keys_filter_used: string;
  keys_filter_revoked: string;

  // Payment method selection
  payment_select_method: string;
  payment_pix: string;
  payment_pix_desc: string;
  payment_crypto: string;
  payment_crypto_desc: string;
  payment_buy_with_pix: string;
  payment_buy_with_crypto: string;

  // PIX payment
  pix_title: string;
  pix_amount_to_pay: string;
  pix_keys_after_payment: string;
  pix_waiting: string;
  pix_copy_code: string;
  pix_copied: string;
  pix_or_copypaste: string;
  pix_close: string;
  pix_verify: string;
  pix_auto_check: string;
  pix_confirmed: string;
  pix_keys_delivered: string;
  pix_see_keys: string;
  pix_via: string;

  // LTC / Crypto payment
  ltc_title: string;
  ltc_amount_to_pay: string;
  ltc_keys_after_payment: string;
  ltc_waiting: string;
  ltc_address: string;
  ltc_copy_address: string;
  ltc_copied: string;
  ltc_amount_ltc: string;
  ltc_rate: string;
  ltc_expires_in: string;
  ltc_close: string;
  ltc_verify: string;
  ltc_auto_check: string;
  ltc_confirmed: string;
  ltc_keys_delivered: string;
  ltc_see_keys: string;
  ltc_network: string;
  ltc_warning: string;
  ltc_generating: string;
  ltc_via: string;
  ltc_brl_value: string;

  // Admin
  admin_dashboard: string;
  admin_resellers: string;
  admin_categories: string;
  admin_apps: string;
  admin_keys: string;
  admin_ip_whitelist: string;
  admin_security: string;
  admin_loading: string;
  admin_logout: string;

  // General
  general_loading: string;
  general_error: string;
  general_not_found: string;
  general_save: string;
  general_cancel: string;
  general_confirm: string;
  general_close: string;
  general_copy: string;
  general_copied: string;
  general_search: string;
  general_filter: string;
  general_all: string;
  general_active: string;
  general_inactive: string;
  general_status: string;
  general_actions: string;
  general_name: string;
  general_email: string;
  general_password: string;
  general_created_at: string;
  general_updated_at: string;
  general_yes: string;
  general_no: string;
  general_back: string;
  general_next: string;
  general_previous: string;
  general_total: string;
  general_credits: string;
  general_discount: string;
  general_price: string;
  general_quantity: string;
  general_description: string;
  general_type: string;
  general_version: string;
  general_plan: string;
  general_duration: string;
  general_days: string;
  general_lifetime: string;
  general_app: string;
  general_key: string;
  general_keys: string;
  general_balance: string;
  general_purchases: string;
  general_date: string;
  general_amount: string;
  general_payment: string;
  general_pix: string;
  general_crypto: string;
  general_ltc: string;
  general_brl: string;
  general_usd: string;
  general_select: string;
  general_select_plan: string;
  general_note: string;
  general_optional: string;
  general_required: string;
  general_min: string;
  general_max: string;
  general_per_key: string;
  general_insufficient: string;
  general_available: string;
  general_level: string;
  general_basic: string;
  general_premium: string;
  general_no_description: string;
  general_without_description: string;
  general_other_store: string;
}

const ptTranslations: Translations = {
  // Login
  login_title: "Reseller Management Panel",
  login_subtitle: "Reseller Management Panel",
  login_reseller_access: "Reseller Access",
  login_sign_in_desc: "Sign in to your reseller account",
  login_username: "Username",
  login_username_placeholder: "Digite seu usuário",
  login_password: "Password",
  login_signing_in: "Entrando...",
  login_sign_in: "Sign In",
  login_secure_access: "Secure reseller access for SELLERS",
  login_copyright: "© 2025 SELLERS. All rights reserved.",
  login_fill_fields: "Preencha todos os campos",
  login_success: "Login realizado com sucesso!",

  // Nav
  nav_profile: "Perfil",
  nav_apps: "Apps",
  nav_my_keys: "Minhas Keys",
  nav_tickets: "Tickets",
  nav_stats: "Estatísticas",
  nav_admin_panel: "Admin Panel",
  nav_loading: "Carregando...",
  nav_logout: "Logout",
  nav_logout_success: "Logout realizado",

  // Profile
  profile_title: "Meu Perfil",
  profile_member_since: "Membro desde",
  profile_location: "Localização",
  profile_email: "Email",
  profile_total_purchases: "Total de compras",
  profile_current_discount: "Desconto atual",
  profile_next_level: "Próximo nível",
  profile_purchases: "compras",
  profile_balance: "Saldo",
  profile_buy_credits: "Comprar Créditos",
  profile_recent_transactions: "Transações Recentes",
  profile_no_transactions: "Nenhuma transação ainda",
  profile_add: "Adicionado",
  profile_deduct: "Deduzido",
  profile_type_credits: "Créditos",
  profile_type_percentage: "Porcentagem",
  profile_pix_payments: "Pagamentos Pix",
  profile_no_pix: "Nenhum pagamento Pix ainda",
  profile_status_pending: "Pendente",
  profile_status_paid: "Pago",
  profile_status_expired: "Expirado",
  profile_status_cancelled: "Cancelado",
  profile_status_refunded: "Estornado",
  profile_discount_level: "após",
  profile_discount_after: "compras",

  // Buy Credits Modal
  buy_credits_title: "Comprar Créditos",
  buy_credits_subtitle: "Pagamento via Pix • Instantâneo",
  buy_credits_current_balance: "Saldo atual",
  buy_credits_quick_values: "Valores rápidos",
  buy_credits_or_type: "Ou digite o valor",
  buy_credits_placeholder: "Ex: 150",
  buy_credits_rate: "1 crédito = R$ 1,00 • Pix expira em 30 minutos",
  buy_credits_cancel: "Cancelar",
  buy_credits_generate_pix: "Gerar Pix",
  buy_credits_generating: "Gerando...",
  buy_credits_amount_to_pay: "Valor a pagar",
  buy_credits_will_add: "créditos na sua conta",
  buy_credits_or_copypaste: "Ou use o código Pix Copia e Cola",
  buy_credits_copy: "Copiar código",
  buy_credits_copied: "Copiado!",
  buy_credits_close: "Fechar",
  buy_credits_verify: "Verificar",
  buy_credits_auto_check: "Verificação automática a cada 4 segundos",
  buy_credits_waiting: "Aguardando pagamento...",
  buy_credits_confirmed_title: "Pagamento confirmado!",
  buy_credits_confirmed_desc: "créditos adicionados à sua conta",
  buy_credits_error: "Erro ao criar cobrança Pix",
  buy_credits_invalid_amount: "Informe uma quantidade válida",
  buy_credits_pix_copied: "Código Pix copiado!",

  // Apps
  apps_title: "Apps Disponíveis",
  apps_subtitle: "Escolha um app para gerar ou comprar keys",
  apps_no_apps: "Nenhum app disponível",
  apps_loading: "Carregando apps...",
  apps_not_found: "App não encontrado",
  apps_available_plans: "Planos Disponíveis",
  apps_no_plans: "Nenhum plano disponível",
  apps_features: "Features",
  apps_buy: "Comprar",
  apps_generate_key: "Gerar Key",
  apps_lifetime: "Lifetime",
  apps_days: "dias",
  apps_overview: "Overview",
  apps_buy_keys: "Comprar Keys",
  apps_current_discount: "Seu desconto atual:",
  apps_next_level: "Próximo nível:",
  apps_original_price: "Preço original:",
  apps_with_discount: "Com",
  apps_total: "Total",
  apps_plan: "Plano",
  apps_select_plan: "Selecione um plano",
  apps_quantity: "Quantidade (1-100)",
  apps_note: "Nota (opcional)",
  apps_note_placeholder: "Nota para estas keys...",
  apps_price_per_key: "Preço por key:",
  apps_balance: "Saldo",
  apps_insufficient_credits: "⚠ Créditos insuficientes",
  apps_generating: "Gerando...",
  apps_confirm: "Confirmar",
  apps_cancel: "Cancelar",
  apps_loading_app: "Carregando...",

  // Keys
  keys_title: "Minhas Keys",
  keys_subtitle: "Gerencie suas licenças",
  keys_no_keys: "Nenhuma key ainda",
  keys_status_unused: "Não usada",
  keys_status_used: "Usada",
  keys_status_revoked: "Revogada",
  keys_status_expired: "Expirada",
  keys_copy: "Copiar",
  keys_copied: "Copiada!",
  keys_reset_hwid: "Reset HWID",
  keys_revoke: "Revogar",
  keys_plan: "Plano",
  keys_duration: "Duração",
  keys_created: "Criada",
  keys_expires: "Expira",
  keys_used_by: "Usada por",
  keys_loading: "Carregando keys...",
  keys_search: "Buscar key...",
  keys_filter_all: "Todas",
  keys_filter_unused: "Não usadas",
  keys_filter_used: "Usadas",
  keys_filter_revoked: "Revogadas",

  // Payment method selection
  payment_select_method: "Selecione o método de pagamento",
  payment_pix: "PIX",
  payment_pix_desc: "Pagamento instantâneo via PIX",
  payment_crypto: "Crypto (LTC)",
  payment_crypto_desc: "Pagamento em Litecoin",
  payment_buy_with_pix: "Pagar com PIX",
  payment_buy_with_crypto: "Pagar com Crypto",

  // PIX payment
  pix_title: "Comprar Key",
  pix_amount_to_pay: "Valor a pagar",
  pix_keys_after_payment: "key(s) serão entregues após o pagamento",
  pix_waiting: "Aguardando pagamento...",
  pix_copy_code: "Copiar código",
  pix_copied: "Copiado!",
  pix_or_copypaste: "Ou use o código Pix Copia e Cola",
  pix_close: "Fechar",
  pix_verify: "Verificar",
  pix_auto_check: "Verificação automática a cada 4 segundos",
  pix_confirmed: "Pagamento confirmado!",
  pix_keys_delivered: "key(s) gerada(s) com sucesso",
  pix_see_keys: "Ver Minhas Keys",
  pix_via: "Pagamento via Pix",

  // LTC / Crypto payment
  ltc_title: "Comprar Key — Crypto (LTC)",
  ltc_amount_to_pay: "Valor a pagar",
  ltc_keys_after_payment: "key(s) serão entregues após o pagamento",
  ltc_waiting: "Aguardando pagamento...",
  ltc_address: "Endereço LTC",
  ltc_copy_address: "Copiar endereço",
  ltc_copied: "Copiado!",
  ltc_amount_ltc: "Valor em LTC",
  ltc_rate: "Cotação",
  ltc_expires_in: "Expira em 25 minutos",
  ltc_close: "Fechar",
  ltc_verify: "Verificar",
  ltc_auto_check: "Verificação automática a cada 4 segundos",
  ltc_confirmed: "Pagamento confirmado!",
  ltc_keys_delivered: "key(s) gerada(s) com sucesso",
  ltc_see_keys: "Ver Minhas Keys",
  ltc_network: "Rede Litecoin (LTC)",
  ltc_warning: "Envie exatamente o valor indicado para o endereço acima",
  ltc_generating: "Gerando cobrança...",
  ltc_via: "Pagamento via Crypto (LTC)",
  ltc_brl_value: "Valor em BRL",

  // Admin
  admin_dashboard: "Dashboard",
  admin_resellers: "Resellers",
  admin_categories: "Categorias",
  admin_apps: "Apps",
  admin_keys: "License Keys",
  admin_ip_whitelist: "Whitelist IPs",
  admin_security: "Segurança",
  admin_loading: "Carregando...",
  admin_logout: "Logout",

  // General
  general_loading: "Carregando...",
  general_error: "Erro",
  general_not_found: "Não encontrado",
  general_save: "Salvar",
  general_cancel: "Cancelar",
  general_confirm: "Confirmar",
  general_close: "Fechar",
  general_copy: "Copiar",
  general_copied: "Copiado!",
  general_search: "Buscar",
  general_filter: "Filtrar",
  general_all: "Todos",
  general_active: "Ativo",
  general_inactive: "Inativo",
  general_status: "Status",
  general_actions: "Ações",
  general_name: "Nome",
  general_email: "Email",
  general_password: "Senha",
  general_created_at: "Criado em",
  general_updated_at: "Atualizado em",
  general_yes: "Sim",
  general_no: "Não",
  general_back: "Voltar",
  general_next: "Próximo",
  general_previous: "Anterior",
  general_total: "Total",
  general_credits: "créditos",
  general_discount: "desconto",
  general_price: "Preço",
  general_quantity: "Quantidade",
  general_description: "Descrição",
  general_type: "Tipo",
  general_version: "Versão",
  general_plan: "Plano",
  general_duration: "Duração",
  general_days: "dias",
  general_lifetime: "Lifetime",
  general_app: "App",
  general_key: "Key",
  general_keys: "Keys",
  general_balance: "Saldo",
  general_purchases: "Compras",
  general_date: "Data",
  general_amount: "Valor",
  general_payment: "Pagamento",
  general_pix: "PIX",
  general_crypto: "Crypto",
  general_ltc: "LTC",
  general_brl: "BRL",
  general_usd: "USD",
  general_select: "Selecionar",
  general_select_plan: "Selecione um plano",
  general_note: "Nota",
  general_optional: "opcional",
  general_required: "obrigatório",
  general_min: "Mín",
  general_max: "Máx",
  general_per_key: "por key",
  general_insufficient: "insuficiente",
  general_available: "disponível",
  general_level: "nível",
  general_basic: "básico",
  general_premium: "premium",
  general_no_description: "Sem descrição",
  general_without_description: "Sem descrição",
  general_other_store: "Other Store",
};

const enTranslations: Translations = {
  // Login
  login_title: "Reseller Management Panel",
  login_subtitle: "Reseller Management Panel",
  login_reseller_access: "Reseller Access",
  login_sign_in_desc: "Sign in to your reseller account",
  login_username: "Username",
  login_username_placeholder: "Enter your username",
  login_password: "Password",
  login_signing_in: "Signing in...",
  login_sign_in: "Sign In",
  login_secure_access: "Secure reseller access for SELLERS",
  login_copyright: "© 2025 SELLERS. All rights reserved.",
  login_fill_fields: "Please fill in all fields",
  login_success: "Login successful!",

  // Nav
  nav_profile: "Profile",
  nav_apps: "Apps",
  nav_my_keys: "My Keys",
  nav_tickets: "Tickets",
  nav_stats: "Statistics",
  nav_admin_panel: "Admin Panel",
  nav_loading: "Loading...",
  nav_logout: "Logout",
  nav_logout_success: "Logged out",

  // Profile
  profile_title: "My Profile",
  profile_member_since: "Member since",
  profile_location: "Location",
  profile_email: "Email",
  profile_total_purchases: "Total purchases",
  profile_current_discount: "Current discount",
  profile_next_level: "Next level",
  profile_purchases: "purchases",
  profile_balance: "Balance",
  profile_buy_credits: "Buy Credits",
  profile_recent_transactions: "Recent Transactions",
  profile_no_transactions: "No transactions yet",
  profile_add: "Added",
  profile_deduct: "Deducted",
  profile_type_credits: "Credits",
  profile_type_percentage: "Percentage",
  profile_pix_payments: "Pix Payments",
  profile_no_pix: "No Pix payments yet",
  profile_status_pending: "Pending",
  profile_status_paid: "Paid",
  profile_status_expired: "Expired",
  profile_status_cancelled: "Cancelled",
  profile_status_refunded: "Refunded",
  profile_discount_level: "after",
  profile_discount_after: "purchases",

  // Buy Credits Modal
  buy_credits_title: "Buy Credits",
  buy_credits_subtitle: "Payment via Pix • Instant",
  buy_credits_current_balance: "Current balance",
  buy_credits_quick_values: "Quick values",
  buy_credits_or_type: "Or enter the amount",
  buy_credits_placeholder: "e.g. 150",
  buy_credits_rate: "1 credit = R$ 1.00 • Pix expires in 30 minutes",
  buy_credits_cancel: "Cancel",
  buy_credits_generate_pix: "Generate Pix",
  buy_credits_generating: "Generating...",
  buy_credits_amount_to_pay: "Amount to pay",
  buy_credits_will_add: "credits to your account",
  buy_credits_or_copypaste: "Or use the Pix Copy & Paste code",
  buy_credits_copy: "Copy code",
  buy_credits_copied: "Copied!",
  buy_credits_close: "Close",
  buy_credits_verify: "Check",
  buy_credits_auto_check: "Automatic check every 4 seconds",
  buy_credits_waiting: "Waiting for payment...",
  buy_credits_confirmed_title: "Payment confirmed!",
  buy_credits_confirmed_desc: "credits added to your account",
  buy_credits_error: "Error creating Pix charge",
  buy_credits_invalid_amount: "Please enter a valid amount",
  buy_credits_pix_copied: "Pix code copied!",

  // Apps
  apps_title: "Available Apps",
  apps_subtitle: "Choose an app to generate or buy keys",
  apps_no_apps: "No apps available",
  apps_loading: "Loading apps...",
  apps_not_found: "App not found",
  apps_available_plans: "Available Plans",
  apps_no_plans: "No plans available",
  apps_features: "Features",
  apps_buy: "Buy",
  apps_generate_key: "Generate Key",
  apps_lifetime: "Lifetime",
  apps_days: "days",
  apps_overview: "Overview",
  apps_buy_keys: "Buy Keys",
  apps_current_discount: "Your current discount:",
  apps_next_level: "Next level:",
  apps_original_price: "Original price:",
  apps_with_discount: "With",
  apps_total: "Total",
  apps_plan: "Plan",
  apps_select_plan: "Select a plan",
  apps_quantity: "Quantity (1-100)",
  apps_note: "Note (optional)",
  apps_note_placeholder: "Note for these keys...",
  apps_price_per_key: "Price per key:",
  apps_balance: "Balance",
  apps_insufficient_credits: "⚠ Insufficient credits",
  apps_generating: "Generating...",
  apps_confirm: "Confirm",
  apps_cancel: "Cancel",
  apps_loading_app: "Loading...",

  // Keys
  keys_title: "My Keys",
  keys_subtitle: "Manage your licenses",
  keys_no_keys: "No keys yet",
  keys_status_unused: "Unused",
  keys_status_used: "Used",
  keys_status_revoked: "Revoked",
  keys_status_expired: "Expired",
  keys_copy: "Copy",
  keys_copied: "Copied!",
  keys_reset_hwid: "Reset HWID",
  keys_revoke: "Revoke",
  keys_plan: "Plan",
  keys_duration: "Duration",
  keys_created: "Created",
  keys_expires: "Expires",
  keys_used_by: "Used by",
  keys_loading: "Loading keys...",
  keys_search: "Search key...",
  keys_filter_all: "All",
  keys_filter_unused: "Unused",
  keys_filter_used: "Used",
  keys_filter_revoked: "Revoked",

  // Payment method selection
  payment_select_method: "Select payment method",
  payment_pix: "PIX",
  payment_pix_desc: "Instant payment via PIX",
  payment_crypto: "Crypto (LTC)",
  payment_crypto_desc: "Payment in Litecoin",
  payment_buy_with_pix: "Pay with PIX",
  payment_buy_with_crypto: "Pay with Crypto",

  // PIX payment
  pix_title: "Buy Key",
  pix_amount_to_pay: "Amount to pay",
  pix_keys_after_payment: "key(s) will be delivered after payment",
  pix_waiting: "Waiting for payment...",
  pix_copy_code: "Copy code",
  pix_copied: "Copied!",
  pix_or_copypaste: "Or use the Pix Copy & Paste code",
  pix_close: "Close",
  pix_verify: "Check",
  pix_auto_check: "Automatic check every 4 seconds",
  pix_confirmed: "Payment confirmed!",
  pix_keys_delivered: "key(s) generated successfully",
  pix_see_keys: "View My Keys",
  pix_via: "Payment via Pix",

  // LTC / Crypto payment
  ltc_title: "Buy Key — Crypto (LTC)",
  ltc_amount_to_pay: "Amount to pay",
  ltc_keys_after_payment: "key(s) will be delivered after payment",
  ltc_waiting: "Waiting for payment...",
  ltc_address: "LTC Address",
  ltc_copy_address: "Copy address",
  ltc_copied: "Copied!",
  ltc_amount_ltc: "Amount in LTC",
  ltc_rate: "Exchange rate",
  ltc_expires_in: "Expires in 25 minutes",
  ltc_close: "Close",
  ltc_verify: "Check",
  ltc_auto_check: "Automatic check every 4 seconds",
  ltc_confirmed: "Payment confirmed!",
  ltc_keys_delivered: "key(s) generated successfully",
  ltc_see_keys: "View My Keys",
  ltc_network: "Litecoin (LTC) Network",
  ltc_warning: "Send exactly the indicated amount to the address above",
  ltc_generating: "Generating charge...",
  ltc_via: "Payment via Crypto (LTC)",
  ltc_brl_value: "BRL Value",

  // Admin
  admin_dashboard: "Dashboard",
  admin_resellers: "Resellers",
  admin_categories: "Categories",
  admin_apps: "Apps",
  admin_keys: "License Keys",
  admin_ip_whitelist: "IP Whitelist",
  admin_security: "Security",
  admin_loading: "Loading...",
  admin_logout: "Logout",

  // General
  general_loading: "Loading...",
  general_error: "Error",
  general_not_found: "Not found",
  general_save: "Save",
  general_cancel: "Cancel",
  general_confirm: "Confirm",
  general_close: "Close",
  general_copy: "Copy",
  general_copied: "Copied!",
  general_search: "Search",
  general_filter: "Filter",
  general_all: "All",
  general_active: "Active",
  general_inactive: "Inactive",
  general_status: "Status",
  general_actions: "Actions",
  general_name: "Name",
  general_email: "Email",
  general_password: "Password",
  general_created_at: "Created at",
  general_updated_at: "Updated at",
  general_yes: "Yes",
  general_no: "No",
  general_back: "Back",
  general_next: "Next",
  general_previous: "Previous",
  general_total: "Total",
  general_credits: "credits",
  general_discount: "discount",
  general_price: "Price",
  general_quantity: "Quantity",
  general_description: "Description",
  general_type: "Type",
  general_version: "Version",
  general_plan: "Plan",
  general_duration: "Duration",
  general_days: "days",
  general_lifetime: "Lifetime",
  general_app: "App",
  general_key: "Key",
  general_keys: "Keys",
  general_balance: "Balance",
  general_purchases: "Purchases",
  general_date: "Date",
  general_amount: "Amount",
  general_payment: "Payment",
  general_pix: "PIX",
  general_crypto: "Crypto",
  general_ltc: "LTC",
  general_brl: "BRL",
  general_usd: "USD",
  general_select: "Select",
  general_select_plan: "Select a plan",
  general_note: "Note",
  general_optional: "optional",
  general_required: "required",
  general_min: "Min",
  general_max: "Max",
  general_per_key: "per key",
  general_insufficient: "insufficient",
  general_available: "available",
  general_level: "level",
  general_basic: "basic",
  general_premium: "premium",
  general_no_description: "No description",
  general_without_description: "No description",
  general_other_store: "Other Store",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "pt",
  setLanguage: () => {},
  t: ptTranslations,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("zenity_language");
    if (stored === "en" || stored === "pt") return stored;
    return "pt";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("zenity_language", lang);
  };

  const t = language === "en" ? enTranslations : ptTranslations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
