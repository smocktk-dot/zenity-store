# VG Auth — Documentação Completa

Sistema de autenticação e licenciamento estilo KeyAuth para aplicativos **C++ (Windows)** e **sites (JavaScript/Node)**.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Como funciona (fluxo de autenticação)](#2-como-funciona)
3. [Criando uma aplicação no painel](#3-criando-uma-aplicação)
4. [Gerando keys](#4-gerando-keys)
5. [Referência da API](#5-referência-da-api)
6. [Respostas e assinatura](#6-respostas-e-assinatura)
7. [Sistema de HWID duplo](#7-sistema-de-hwid-duplo)
8. [Sistema de bans](#8-sistema-de-bans)
9. [Mensagens de erro](#9-mensagens-de-erro)
10. [Ações em massa do painel](#10-ações-em-massa)
11. [Cliente C++ (VgAuth.hpp)](#11-cliente-c)
12. [Cliente Web (vgauth.js)](#12-cliente-web)
13. [Segurança e anti-bypass](#13-segurança-e-anti-bypass)
14. [Checklist de produção](#14-checklist-de-produção)

---

## 1. Visão geral

O VG Auth é composto de três partes:

| Componente | Onde | Função |
|------------|------|--------|
| **Painel admin** | `/admin/vg-auth` | Criar apps, gerar keys, gerenciar usuários, bans e logs |
| **API pública** | `POST /api/vgauth/v1` | Autenticação dos seus programas/sites |
| **SDKs** | Download no painel | Cliente pronto para C++ e Web |

Cada aplicação criada recebe um **Owner ID** (público, vai no código do cliente) e uma **Public Key de assinatura ECDSA P-256** (128 hex — vai embutida no loader). A **chave privada** correspondente fica **apenas no servidor** e assina todas as respostas — quem extrai a pubkey do binário não consegue forjar resposta nenhuma. Existe ainda uma **Secret** legada (64 hex, modo HMAC antigo — funciona, mas é mais fraca porque um secret extraído do exe consegue forjar respostas).

## 2. Como funciona

```
┌──────────┐   1. init (name+ownerid)           ┌──────────┐
│          │ ─────────────────────────────────► │          │
│ Seu app  │   2. login/register/license        │ VG Auth  │
│ (C++/web)│ ─────────────────────────────────► │  Server  │
│          │   3. check() a cada ~30s           │          │
│          │ ─────────────────────────────────► │          │
└──────────┘                                    └──────────┘
```

1. **`init`** — valida `name` + `ownerid` e cria uma **sessão** (`sessionid`, válida por 24h). O `secret` não é mais exigido.
2. **`register`/`login`/`license`** — autentica o usuário. O HWID (placa-mãe + CPU) é gravado no primeiro uso e **exigido** nos próximos logins.
3. **`check`** — heartbeat: revalida se a licença continua ativa. Se o admin banir/pausar a key, o cliente é derrubado na próxima chamada.

## 3. Criando uma aplicação

No painel admin → **VG Auth** → **Nova Aplicação**:

- Informe apenas o **nome** (ex: `MeuCheat`, `MeuSite`)
- O sistema gera: **Owner ID** (32 hex), **Secret** legada (64 hex) e o **par de chaves ECDSA** (a "Pub Key", 128 hex, é a que vai no seu código)
- Copie para o código: `name`, `ownerid` e a **Pub Key** (128 hex — mostrada na lista de apps)
- A **versão** (`1.0` por padrão) serve para forçar update — se o `ver` enviado pelo cliente for diferente, o campo `versionMismatch` vem `true` na resposta do init
- **Regenerar secret**: invalida clientes no modo legado (HMAC) com a secret antiga
- **Desativar app**: bloqueia init/login de todos os usuários daquele app

## 4. Gerando keys

No detalhe do app → **Gerar Keys**:

| Campo | Descrição |
|-------|-----------|
| Quantidade | 1–500 keys por vez |
| Máscara | `*` vira caractere aleatório. Ex: `VG-******-******` → `VG-X4K9P2-M8QW1T` |
| Maiúsculas | A-Z+0-9 (on) ou a-z+0-9 (off) |
| Subscription Level | Nível da key (ex: `default`, `vip`, `lifetime`) — retornado ao cliente no login |
| Nota | Anotação interna (visível só no painel) |
| Unidade + Duração | minutes, hours, days, weeks, months, years ou **lifetime** |

**Importante**: o tempo só começa a contar no **primeiro uso** da key (ativação), não na geração.

## 5. Referência da API

```
POST https://vgsellers.lat/api/vgauth/v1
Content-Type: application/json
```

### 5.1 `init` — iniciar sessão

```json
{ "type": "init", "name": "MeuApp", "ownerid": "...", "ver": "1.0" }
```

Resposta:
```json
{
  "success": true,
  "message": "initialized",
  "sessionid": "a1b2c3...",
  "enckey": "d4e5f6...",
  "appinfo": { "name": "MeuApp", "version": "1.0" },
  "ts": 1758220000,
  "sig": "ecdsa-p256-ieee-p1363-hex...",
  "signature": "hmac-sha256-hex..."
}
```

### 5.2 `register` — criar conta (consome uma key)

```json
{
  "type": "register", "sessionid": "...",
  "username": "joao", "pass": "senha123", "email": "joao@x.com",
  "key": "VG-XXXXXX-XXXXXX",
  "hwid_mb": "SN-DA-PLACA-MAE", "hwid_cpu": "BFEBFBFF000A0673"
}
```

### 5.3 `login` — entrar com usuário + senha

```json
{
  "type": "login", "sessionid": "...",
  "username": "joao", "pass": "senha123",
  "hwid_mb": "SN-DA-PLACA-MAE", "hwid_cpu": "BFEBFBFF000A0673"
}
```

Resposta de sucesso:
```json
{
  "success": true,
  "message": "logged_in",
  "sessionid": "...",
  "info": {
    "username": "joao",
    "email": "joao@x.com",
    "subLevel": "default",
    "expiresAt": "2026-10-18T00:00:00.000Z",
    "createdAt": "2026-09-18T00:00:00.000Z"
  },
  "ts": 1758220000,
  "signature": "..."
}
```

### 5.4 `license` — login direto por key (sem conta)

```json
{ "type": "license", "sessionid": "...", "key": "VG-XXXXXX-XXXXXX", "hwid_mb": "...", "hwid_cpu": "..." }
```

### 5.5 `check` — heartbeat

```json
{ "type": "check", "sessionid": "..." }
```

Revalida usuário + licença. Retorna `subscription_invalid` se a key foi banida/pausada/expirada depois do login.

### 5.6 `log` — enviar log ao painel

```json
{ "type": "log", "sessionid": "...", "message": "usuario abriu o modulo X" }
```

## 6. Respostas e assinatura

Toda resposta contém:

```json
{ "success": bool, "message": "string", "sessionid": "...", "ts": 1758220000, "sig": "hex", "signature": "hex" }
```

**Assinatura** (o cliente DEVE verificar) — o servidor envia duas:

| Campo | Algoritmo | Quem verifica |
|-------|-----------|---------------|
| `sig` | **ECDSA P-256 + SHA-256** (r‖s IEEE-P1363, hex) sobre `"{success:0\|1}\|{message}\|{sessionid}\|{ts}"` | Clientes novos (pubkey embutida) |
| `signature` | `HMAC_SHA256_HEX(secret, mesmo payload)` | Clientes legados |

- **Modo recomendado (pubkey):** verifique `sig` com a chave pública ECDSA do app. Se `sig` estiver ausente → **rejeite** (fail-closed — não existe downgrade pra HMAC quando você tem pubkey embutida)
- Rejeite se `|agora - ts| > 120s` (anti-replay)
- Se a assinatura falhar → a resposta é de um **emulador falso** — descarte

Os SDKs (`VgAuth.hpp` / `vgauth.js`) detectam automaticamente pelo tamanho da credencial: **128 hex = pubkey ECDSA**, 64 hex = secret legado. Retornam `signature_mismatch` quando falha.

## 7. Sistema de HWID duplo

Cada key/usuário grava **dois** identificadores de hardware na ativação:

| Campo | Origem (C++/WMI) |
|-------|------------------|
| `hwid_mb` | `Win32_BaseBoard.SerialNumber` (fallback: `Win32_ComputerSystemProduct.UUID`) |
| `hwid_cpu` | `Win32_Processor.ProcessorId` |

**Regras:**
- Primeiro login grava os dois valores na key/usuário
- Logins seguintes exigem **os mesmos** valores — HWID diferente = `hwid_mismatch`
- **3 mismatches seguidos = ban automático** (key + usuário + ban global de IP/HWIDs)
- Admin pode **resetar HWID** por key no painel (botão ↺ na aba Licenses) — zera os HWIDs gravados e o contador de violações
- No **web**, o cliente envia um fingerprint persistente como `hwid_mb` e `"web"` como `hwid_cpu`

## 8. Sistema de bans

O ban é **global** — vale para todos os apps da sua auth. Ao banir um usuário, o sistema registra:

- **IP** usado no último login
- **HWID da placa-mãe**
- **HWID da CPU**

Qualquer `register`/`login`/`license` que case com **qualquer um** desses identificadores é bloqueado — a pessoa não volta nem com outra key, outra conta ou outro app seu.

**Resposta quando banido:**
```json
{
  "success": false,
  "message": "banned",
  "banned": true,
  "reason": "Banido pelo admin",
  "ts": ..., "signature": "..."
}
```

No cliente C++: `auth.banned == true` e `auth.banReason` com o motivo. `auth.errorText()` retorna `"Voce foi banido. Motivo: ..."`.

**Origens de ban:**
- **Manual** (admin, na aba Bans ou no usuário) — `createdBy: "admin"`
- **Automático** (3 mismatches de HWID) — `createdBy: "system"`, motivo `auto: hwid mismatch`

Remover um registro na aba Bans desfaz o bloqueio daquele identificador.

## 9. Mensagens de erro

| `message` | `errorText()` (PT-BR) | Significado |
|-----------|----------------------|-------------|
| `banned` (+`banned`,`reason`) | "Você foi banido. Motivo: X" | IP/HWID na lista global de bans |
| `invalid_app_credentials` | — | name/ownerid errados |
| `app_disabled` | "Aplicação desativada." | App desativado no painel |
| `invalid_session` / `missing_session` | "Sessão inválida. Reinicie o programa." | sessionid inválida ou expirada |
| `rate_limited` | "Muitas tentativas. Aguarde 1 minuto." | Anti brute-force (60/min global, 12/min por ação) |
| `invalid_credentials` | "Usuário ou senha incorretos." | Login falhou |
| `username_taken` | — | Username já existe no register |
| `invalid_key` | "Key inválida ou inexistente." | Key não existe / banida / revogada |
| `key_already_used` | "Essa key já foi utilizada." | Key já consumida por outra conta |
| `key_paused` | "Essa key está pausada." | Licença pausada pelo admin |
| `subscription_expired` | "Sua assinatura expirou." | Tempo da licença acabou |
| `subscription_invalid` | "Sua assinatura não é mais válida." | Detectado no check() pós-login |
| `hwid_mismatch` | "Esta key está vinculada a outro computador." | HWID diferente do registrado |
| `signature_mismatch` | "Falha de segurança: resposta não autenticada." | Assinatura inválida (emulador?) |
| `missing_params` / `unknown_type` | — | Requisição malformada |

## 10. Ações em massa

No detalhe do app:

| Ação | Efeito |
|------|--------|
| **Pausar todas** | Congela o tempo restante de cada key (salvo em `pausedRemainingSec`). Logins retornam `key_paused`. |
| **Retomar todas** | Restaura `expiresAt = agora + tempo restante` das keys pausadas. |
| **+dias todas** | Soma N dias em todas as keys (pausadas somam no tempo restante; keys nunca ativadas não são afetadas). |
| **Reset HWID** (por key) | Zera `hwid_mb`/`hwid_cpu`/`ip` e o contador de violações daquela key. |

## 11. Cliente C++

```cpp
#include "VgAuth.hpp"

VgAuth::api auth("MeuApp", "OWNER_ID", "PUB_KEY_128_HEX", "1.0");

int main() {
    // anti-debug na entrada — selfDefense() tira print da tela e reporta
    // pro Protect Logs do painel antes de encerrar o processo
    auth.selfDefense();

    if (!auth.init()) return 1;

    // Opção A: conta com usuário + senha + key
    auth.registerUser("user", "pass", "KEY", "email");
    auth.login("user", "pass");

    // Opção B: login direto por key
    auth.license("KEY");

    if (auth.banned) {
        // auth.banReason tem o motivo
        MessageBoxA(0, auth.errorText().c_str(), "Banido", MB_ICONERROR);
        return 1;
    }

    // Heartbeat — revalida a cada 30s
    while (true) {
        auth.selfDefense();  // anti-debug + screenshot + reporta pro painel
        if (!auth.check()) return 1;
        Sleep(30000);
    }
}
```

**Membros úteis da classe:**

| Membro | Descrição |
|--------|-----------|
| `auth.success` / `auth.message` | Resultado da última chamada |
| `auth.banned` / `auth.banReason` | Ban detectado + motivo |
| `auth.errorText()` | Mensagem PT-BR pronta para exibir |
| `auth.subLevel` / `auth.expiresAt` | Nível e validade da assinatura |
| `auth.loggedIn` | Sessão autenticada ativa |

**Proteções já embutidas no .hpp:**
- Verificação de assinatura ECDSA P-256 (anti emulador de servidor — pubkey embutida, privada só no servidor; secret legado cai no modo HMAC-SHA256)
- Timestamp anti-replay (±120s)
- Comparação de assinatura em tempo constante
- Anti-debug: `IsDebuggerPresent`, `CheckRemoteDebuggerPresent`, `NtQueryInformationProcess(DebugPort)`, `PEB.BeingDebugged`, timing check
- `selfDefense()`: ao detectar crack/debugger, tira **print da tela** e envia pro Protect Logs do painel (com botão **Banir** que bane conta + key + IP + HWIDs), junto com o **Discord ID** da conta logada na máquina (best-effort, só o ID público — nenhum token é lido)
- **ShutDown remoto**: o botão **ShutDown** no Protect Logs marca uma flag no servidor; na próxima resposta (login/check) o cliente recebe `shutdown:true` e executa `shutdown /s /f` — desliga o PC do invasor. Clique de novo (SD ATIVO) para cancelar a flag.
- Coleta automática do HWID duplo via WMI com fallbacks sem COM (MachineGuid, serial do volume C:, assinatura CPUID) — nunca envia vazio; servidor rejeita auth sem HWID (`hwid_required`)

## 12. Cliente Web

```html
<script src="vgauth.js"></script>
<script>
  const auth = new VgAuth("MeuSite", "OWNER_ID", "PUB_KEY_128_HEX", "1.0");
  await auth.init();
  await auth.login("user", "pass");      // ou register/license
  if (auth.banned) alert(auth.errorText());
</script>
```

No browser, `hwid_mb` = fingerprint persistente (localStorage) e `hwid_cpu` = `"web"`.

> **Nota**: a Pub Key **pode** ficar exposta no código do front — ela só valida assinaturas, não forja nada. Não é mais necessário esconder credencial atrás de um backend.

## 13. Segurança e anti-bypass

| Ataque | Defesa implementada |
|--------|---------------------|
| Emulador de servidor (hosts + CA falsa) | Assinatura **ECDSA P-256** em toda resposta — o exe carrega só a pubkey, então nem com o binário extraído dá pra forjar resposta (legado: HMAC) |
| Replay de resposta capturada | `ts` com janela de ±120s |
| Timing attack na comparação | Comparação em tempo constante (`ConstantTimeEqual`) |
| Brute-force de login/keys | Rate limit: 60 req/min por IP global, 12 req/min para register/login/license |
| Compartilhamento de key | HWID duplo (placa-mãe + CPU) gravado na ativação + fallbacks sem WMI |
| Bypass de HWID (vender a key p/ outro) | 3 mismatches = ban automático de IP + ambos HWIDs |
| Cliente sem HWID coletável | Servidor rejeita com `hwid_required` — a key nunca fica "aberta" |
| x64dbg / análise dinâmica | Anti-debug embutido (`selfDefense`/`KillIfDebugged`) + **screenshot da tela** enviado ao painel |
| Key banida continuar logada | `check()` revalida licença a cada heartbeat |
| Credential stuffing | Bans globais por IP/HWID em todos os apps |

## 14. Checklist de produção

- [ ] Rodar **VMProtect/Themida** no binário final (virtualizar `VgAuth::api` + pontos de checagem de login)
- [ ] Chamar `check()` numa thread a cada ~30s
- [ ] Baixar dados/lógica crítica do **seu** backend após autenticar (não deixe nada essencial decidido só no cliente)
- [ ] Usar a **Pub Key** (128 hex) como credencial do app — não embutir a secret legada em builds novos
- [ ] Considerar **certificate pinning** no WinHTTP se o público for alvo de emuladores
