# VG Auth — Documentação

Sistema de autenticação estilo KeyAuth para aplicativos **C++** e **sites**.

## Endpoint

```
POST https://vgsellers.lat/api/vgauth/v1
Content-Type: application/json
```

## Fluxo

1. **init** — valida o app e cria uma sessão (`sessionid` + `enckey`)
2. **register / login / license** — autentica o usuário (HWID verificado)
3. **check** — heartbeat que revalida licença/ban no servidor
4. **log** — envia log para o painel admin

Toda resposta contém `ts` + `signature` (HMAC-SHA256 com o `secret` do app).
O cliente **deve** verificar a assinatura — é o que impede emuladores de servidor.

## Campos da requisição

| Campo | init | register | login | license | check | log |
|-------|:----:|:--------:|:-----:|:-------:|:-----:|:---:|
| `type` | init | register | login | license | check | log |
| `name` | ✓ | | | | | |
| `ownerid` | ✓ | | | | | |
| `secret` | ✓ | | | | | |
| `ver` | ✓ | | | | | |
| `sessionid` | | ✓ | ✓ | ✓ | ✓ | ✓ |
| `username` | | ✓ | ✓ | | | |
| `pass` | | ✓ | ✓ | | | |
| `key` | | ✓ | | ✓ | | |
| `email` | | opc. | | | | |
| `hwid_mb` | | ✓ | ✓ | ✓ | | |
| `hwid_cpu` | | ✓ | ✓ | ✓ | | |
| `message` | | | | | | ✓ |

## Assinatura

```
signature = HMAC_SHA256_HEX(secret, "{success:0|1}|{message}|{sessionid}|{ts}")
```

Verifique no cliente: recomputar e comparar em **tempo constante**, e rejeitar
respostas com `ts` fora de ±120 segundos (anti-replay).

## HWID duplo (C++)

O `VgAuth.hpp` coleta automaticamente:
- **`hwid_mb`** — `Win32_BaseBoard.SerialNumber` (fallback: `Win32_ComputerSystemProduct.UUID`)
- **`hwid_cpu`** — `Win32_Processor.ProcessorId`

No primeiro uso da key os dois HWIDs são gravados. Logins seguintes exigem os
**mesmos** valores — 3 mismatches seguidos = ban automático (key + IP + HWIDs).

## Mensagens de erro

| message | Significado |
|---------|-------------|
| `invalid_app_credentials` | name/ownerid/secret errados |
| `app_disabled` | app desativado no painel |
| `invalid_session` | sessionid inválida/expirada |
| `rate_limited` | muitas tentativas — aguarde 1 min |
| `banned` | IP/HWID na lista global de bans |
| `invalid_credentials` | usuário/senha errados |
| `invalid_key` / `key_already_used` | key inválida ou já consumida |
| `key_paused` | licença pausada pelo admin |
| `subscription_expired` | licença vencida |
| `hwid_mismatch` | HWID diferente do registrado |

## Proteções recomendadas para o binário C++

1. **VMProtect/Themida** — virtualize `VgAuth::api` e os pontos de checagem.
2. **Não decida nada crítico só com o retorno do login** — baixe dados do seu
   próprio backend depois de autenticar.
3. **Heartbeat** — chame `check()` a cada ~30s; se a key for banida/pausada
   no painel, o cliente é derrubado.
4. **Certificate pinning** (opcional) — em públicos-alvo de emulador, valide
   a cadeia TLS do `vgsellers.lat` no WinHTTP.
