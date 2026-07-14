# Purin Cash LTC - Referência

## Criar Pagamento LTC
POST /v1/payments
```json
{
  "valueCents": 1990,
  "description": "Plano mensal",
  "paymentMethod": "ltc",
  "callbackUrl": "https://seu-site.com/api/webhooks/purincash",
  "customer": { "name": "...", "email": "...", "externalId": "reseller_id" },
  "metadata": "{\"resellerId\": \"123\", \"paymentType\": \"key\", ...}"
}
```

## Resposta LTC
```json
{
  "paymentId": "psa_9f2c1a7e5b3d4c8a0e6f1b2d3c4e5a6f",
  "status": "pending",
  "type": "one_time",
  "paymentMethod": "ltc",
  "amountCents": 1990,
  "currency": "BRL",
  "productName": "Plano mensal",
  "environment": "live",
  "ltc": {
    "address": "ltc1q...",
    "amount": 0.03412345,
    "amountBrl": 19.9,
    "ltcPriceBrl": 583.21
  },
  "expiresAt": "2026-07-11T15:25:00.000Z"
}
```

## Webhook LTC (mesmo endpoint do PIX)
```json
{
  "event": "payment.paid",
  "paymentId": "psa_abc123",
  "amountCents": 1990,
  "status": "paid",
  "paidAt": "2026-07-11T14:32:10.000Z",
  "customer": { "name": "...", "email": "...", "externalId": "user_42" },
  "metadata": "{\"resellerId\": \"123\", \"paymentType\": \"key\", ...}"
}
```

## Notas
- LTC não disponível em sandbox (apenas ps_live_)
- Expira em 25 minutos
- paymentMethod: "pix" | "ltc"
- Erro 503: LTC wallet not configured for this store
- Erro 502: LTC price unavailable
- O webhook usa o MESMO endpoint do PIX
- O campo paymentId começa com "psa_" (igual ao PIX)
