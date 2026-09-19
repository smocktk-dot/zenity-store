# VG Auth — Multi Loader

Documentação completa do tipo de aplicação **Multi Loader** do VG Auth.

> **Diferença do Auth completo:** o Multi Loader **não usa license keys**.
> É um sistema de contas: os usuários criam conta com usuário + senha + email
> direto no seu programa C++, e você administra tudo pelo painel — banir,
> trocar senha, ver credenciais e acompanhar logs de atividade.

---

## 1. O que o Multi Loader faz

| Recurso | Auth completo | Multi Loader |
|---|---|---|
| License keys / geração de keys | ✅ | ❌ |
| Registro de conta (user+senha+email) | ✅ (consome key) | ✅ (sem key) |
| Login usuário + senha | ✅ | ✅ |
| Login direto por key (`license`) | ✅ | ❌ (`not_supported`) |
| Vínculo de HWID duplo | ✅ | ✅ |
| Ban de usuário (IP + HWID MB + HWID CPU) | ✅ | ✅ |
| Troca de senha pelo admin | ❌ | ✅ |
| Senha visível no painel | ❌ | ✅ (por usuário) |
| Logs de atividade | ✅ | ✅ |
| Heartbeat `check()` | ✅ | ✅ |
| Owner ID + Secret próprios | ✅ | ✅ |

## 2. Criando a aplicação

1. Painel admin → **VG AUTH** → **Nova Aplicação**
2. Selecione o tipo **Multi Loader**
3. Nomeie (ex: `MULTI LOADER`) e clique em **Criar**
4. O sistema gera automaticamente:
   - **Owner ID** — identificador público do app
   - **Secret** — chave que assina/valida as respostas

Anote os dois — vão no seu código C++.

## 3. Painel de gerenciamento

Na página do app (clique no nome na lista ou em **Gerenciar**):

- **Users** — todas as contas criadas pelos usuários, com:
  - Usuário, email e **senha em texto** (visível só pra você)
  - Status (active/banned), HWID da placa-mãe, HWID da CPU, IP, último login
  - Ações por usuário: **trocar senha** (ícone de chave), **banir/desbanir**, **deletar**
- **Bans** — bans globais (IP + HWIDs). Vale para **todos** os seus apps da auth.
- **Logs** — registro de contas criadas, logins, falhas, bans, mudanças de senha.

> Não existe aba Licenses nem ações em massa de keys — esse tipo de app não usa keys.

## 4. Protocolo da API

Endpoint: `POST https://vgsellers.lat/api/vgauth/v1` (JSON)

Toda resposta contém `ts` (timestamp) e `signature` (HMAC-SHA256 da resposta,
verificado pelo cliente com a Secret do app).

### 4.1 `init` — abrir sessão

```json
{ "type": "init", "name": "MULTI LOADER", "ownerid": "...", "secret": "...", "ver": "1.0" }
```

Resposta:

```json
{ "ts": 1730000000, "success": true, "message": "initialized",
  "sessionid": "abc...", "enckey": "...", "signature": "..." }
```

### 4.2 `register` — criar conta (sem key)

```json
{ "type": "register", "sessionid": "abc...",
  "username": "joao", "pass": "senha123", "email": "joao@x.com",
  "hwid_mb": "SERIAL_PLACA_MAE", "hwid_cpu": "PROCESSOR_ID" }
```

Resposta de sucesso:

```json
{ "success": true, "message": "registered", "sessionid": "abc...",
  "info": { "username": "joao", "subLevel": "loader", "expiresAt": "lifetime" } }
```

Erros possíveis: `username_taken`, `invalid_username`, `missing_params`,
`banned` (IP/HWID banido globalmente).

### 4.3 `login` — autenticar conta

```json
{ "type": "login", "sessionid": "abc...",
  "username": "joao", "pass": "senha123",
  "hwid_mb": "SERIAL_PLACA_MAE", "hwid_cpu": "PROCESSOR_ID" }
```

Resposta de sucesso: `{"success": true, "message": "logged_in", "info": {...}}`

Erros possíveis:
- `invalid_credentials` — usuário/senha errados
- `banned` — conta banida (vem com `banned: true` e `reason`)
- `hwid_mismatch` — HWID diferente do registrado na criação da conta

### 4.4 `check` — heartbeat

```json
{ "type": "check", "sessionid": "abc..." }
```

Chame a cada 30–60s. Se a conta for banida com o programa aberto, o próximo
`check` retorna `{"success": false, "message": "banned", "banned": true, "reason": "..."}`.

### 4.5 `log` — log customizado

```json
{ "type": "log", "sessionid": "abc...", "message": "inject ok" }
```

### 4.6 `license` — não existe no Multi Loader

Retorna `{"success": false, "message": "not_supported"}` — esse tipo de app
não tem keys.

## 5. Assinatura das respostas

```
signature = HMAC_SHA256(secret, "{success?1:0}|{message}|{sessionid}|{ts}")
```

O `.hpp` já verifica automaticamente — resposta sem assinatura válida ou com
`ts` fora da janela de 120s é descartada como `signature_mismatch`.

## 6. Segurança

- **HWID duplo**: no register, o servidor grava o serial da placa-mãe e o
  ProcessorId da CPU. Login de PC diferente → `hwid_mismatch`.
- **Ban global**: banir um usuário registra IP + ambos HWIDs. A pessoa não
  entra de novo — nem criando outra conta, em nenhum app seu.
- **Rate limit**: 12 tentativas de register/login por minuto por IP.
- **Senhas**: o painel mostra a senha em texto (requisito do sistema),
  mas internamente o login valida por hash bcrypt.

## 7. Integração C++

Arquivos:

| Arquivo | Descrição |
|---|---|
| `VgAuthLoader.hpp` | Cliente single-header (só Multi Loader) |
| `example_loader.cpp` | Exemplo completo comentado |

```cpp
#include "VgAuthLoader.hpp"

VgLoader::api auth("MULTI LOADER", "SEU_OWNER_ID", "SUA_SECRET");
if (!auth.init()) { /* auth.errorText() */ }

auth.registerUser("user", "pass", "email@x.com"); // criar conta
auth.login("user", "pass");                        // ou login

if (auth.banned) { /* auth.banReason */ }

// heartbeat a cada 30-60s:
auth.check();
```

API pública da classe:

| Membro | Descrição |
|---|---|
| `init()` | Abre sessão — obrigatório antes de tudo |
| `registerUser(u, p, email)` | Cria conta (email opcional) |
| `login(u, p)` | Autentica |
| `check()` | Heartbeat — false = ban/sessão morta |
| `log(msg)` | Envia log ao painel |
| `errorText()` | Mensagem PT-BR pronta pro usuário |
| `banned` / `banReason` | Estado de ban |
| `username` / `email` | Dados do usuário logado |
| `loggedIn` / `initialized` | Flags de estado |

## 8. Checklist de produção

- [ ] App criado como **Multi Loader** (não Auth completo)
- [ ] `OWNER_ID` e `SECRET` corretos no código
- [ ] `init()` chamado antes de register/login
- [ ] `check()` em loop de 30–60s numa thread
- [ ] Erros exibidos via `errorText()` (já traduz ban)
- [ ] Binário final protegido com VMProtect/Themida
- [ ] Lógica crítica do loader no servidor — o cliente nunca decide sozinho
