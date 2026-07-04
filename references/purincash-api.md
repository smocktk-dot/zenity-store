# Purin Cash API - Referência

Base URL: https://api.purincash.com
Auth: `Authorization: Bearer ps_live_...`

## Criar Cobrança Pix Avulsa (USAR ESTE)
POST /v1/charges
```json
{
  "valueCents": 1000,
  "description": "Compra de créditos - ZENITY STORE",
  "callbackUrl": "https://cvreseller-n3qqggx2.manus.space/api/webhooks/purincash",
  "customer": { "name": "...", "email": "...", "externalId": "reseller_id" },
  "metadata": "{\"resellerId\": \"123\", \"credits\": 10}"
}
```
Resposta:
```json
{
  "paymentId": "psc_...",
  "status": "pending",
  "amountCents": 1000,
  "pix": {
    "brCode": "00020126...",
    "qrCodeImage": "https://..."
  },
  "expiresAt": "2026-..."
}
```

## Consultar Cobrança
GET /v1/charges/:paymentId
Resposta inclui `status`: pending | paid | expired | refunded | cancelled

## Webhook (callback)
Quando pago, Purin Cash faz POST na callbackUrl com:
```json
{
  "paymentId": "psc_...",
  "status": "paid",
  "amountCents": 1000,
  "paidAt": "..."
}
```

## Criar Pagamento via Produto
POST /v1/payments
```json
{ "productId": "...", "callbackUrl": "..." }
```

## Status
- pending: aguardando pagamento
- paid: pago
- expired: expirado (30 min)
- refunded: estornado
- cancelled: cancelado

## Conversão de créditos
1 crédito = R$ 1,00 = 100 centavos
