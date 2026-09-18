# API de Revenda — VG Sellers

Domínio: `https://vgsellers.lat`

## Autenticação

Todas as requisições devem conter o header:

```
X-Api-Key: {chave_gerada_no_painel_admin}
```

---

## Endpoints

### 1. Verificar autenticação e saldo

```http
POST /api/reseller/v1/auth/verify
```

**Headers:**
```
X-Api-Key: SUA_CHAVE
Content-Type: application/json
```

**Resposta 200:**
```json
{
  "reseller": { ... },
  "balance": "1250.00"
}
```

---

### 2. Listar produtos disponíveis

```http
GET /api/reseller/v1/products
```

**Headers:**
```
X-Api-Key: SUA_CHAVE
```

**Resposta 200:**
```json
[
  {
    "id": 1,
    "name": "Meu App",
    "description": "...",
    "version": "1.0",
    "plans": [
      {
        "id": 3,
        "name": "Mensal",
        "durationDays": 30,
        "priceCredits": "50.00",
        "stockCount": 42
      },
      {
        "id": 4,
        "name": "Trimestral",
        "durationDays": 90,
        "priceCredits": "120.00",
        "stockCount": 15
      }
    ]
  }
]
```

---

### 3. Comprar/gerar key

```http
POST /api/reseller/v1/buy
```

**Headers:**
```
X-Api-Key: SUA_CHAVE
Content-Type: application/json
```

**Body (por nome do plano):**
```json
{
  "appId": 1,
  "planName": "mensal",
  "quantity": 1,
  "customer": "cliente@email.com",
  "note": "pedido #123"
}
```

Também pode usar `planId`:
```json
{
  "appId": 1,
  "planId": 3,
  "quantity": 1,
  "customer": "cliente@email.com"
}
```

- `appId` (obrigatório): ID do aplicativo
- `planId` (obrigatório): ID do plano (diário, trial, 15d, semanal, mensal, trimestral etc.)
- `quantity` (opcional): quantidade de keys, padrão 1, máx 100
- `customer` (opcional): identificação do cliente final
- `customMask` (opcional): máscara customizada da key
- `note` (opcional): observação interna

**Resposta 200:**
```json
{
  "keys": [
    "ABCD-EFGH-IJKL-MNOP"
  ],
  "cost": "45.00",
  "balanceAfter": "1205.00"
}
```

**Respostas de erro comuns:**

| HTTP | Motivo |
|------|--------|
| 401 | Chave API inválida |
| 403 | Não é reseller de créditos ou app não atribuído |
| 402 | Créditos insuficientes |
| 409 | Estoque insuficiente |
| 404 | App ou plano não encontrado |

---

## Exemplo em PHP

```php
<?php
$apiKey = "SUA_CHAVE";
$baseUrl = "https://vgsellers.lat";

$ch = curl_init("$baseUrl/api/reseller/v1/buy");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-Api-Key: $apiKey",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "appId" => 1,
    "planId" => 3,
    "quantity" => 1,
    "customer" => "cliente@email.com"
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 200) {
    echo "Key: " . $data["keys"][0];
    echo "Custo: " . $data["cost"] . " cr";
} else {
    echo "Erro: " . ($data["error"] ?? "desconhecido");
}
?>
```

---

## Exemplo em JavaScript (fetch)

```js
const API_KEY = "SUA_CHAVE";
const BASE_URL = "https://vgsellers.lat";

async function buyKey(appId, planId, customer) {
  const res = await fetch(`${BASE_URL}/api/reseller/v1/buy`, {
    method: "POST",
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ appId, planId, quantity: 1, customer })
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, key: data.keys[0], cost: data.cost };
  }
  return { success: false, error: data.error };
}
```

---

## APIs dedicadas por produto

Além da API genérica, existem bases dedicadas por app (mesma autenticação `X-Api-Key` ou `?apikey=`):

- `/api/public-emulator/v1/` — Public Emulator
- `/api/unlock-all/v1/` — Unlock All
- `/api/unlock-all-web/v1/` — Unlock All Web
- `/api/stock/v1/` — STOCK (DIARIO, TRIAL, SEMANAL, MENSAL, LIFETIME)

Cada base expõe:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/products` | Lista planos + estoque do app |
| GET | `/stock` | Estoque por plano |
| GET/POST | `/take` | Retira key (planId/planName + quantity) |
| GET | `/take/:plan` | Retira key por slug fixo na URL |

### Exemplo — URLs prontas para Purin Cash (STOCK)

```
GET https://vgsellers.lat/api/stock/v1/take/diario?apikey=SUA_CHAVE
GET https://vgsellers.lat/api/stock/v1/take/trial?apikey=SUA_CHAVE
GET https://vgsellers.lat/api/stock/v1/take/semanal?apikey=SUA_CHAVE
GET https://vgsellers.lat/api/stock/v1/take/mensal?apikey=SUA_CHAVE
GET https://vgsellers.lat/api/stock/v1/take/lifetime?apikey=SUA_CHAVE
```

Também aceitam `?qtd=N` e `?customer=email`.

**Resposta 200:**
```json
{
  "data": {
    "key": "ABCD-EFGH-IJKL-MNOP",
    "plan": { "id": 3, "name": "DIARIO", "durationDays": 1 }
  }
}
```

Os slugs também casam nomes equivalentes (ex.: `diario` → "1 Dia", `semanal` → "7 Dias", `mensal` → "30 Dias", `lifetime` → "Vitalício").

**Requisitos:** o reseller precisa da API key gerada no admin e do app STOCK atribuído à conta.

---

## Observações

- O reseller precisa ser do tipo **créditos**.
- Cada compra desconta créditos do saldo do reseller.
- A key é retirada do estoque (`app_stock`) e registrada como `license_key`.
- O atributo `durationDays` define se é diária, trial, 15 dias, semanal, mensal, trimestral etc.
