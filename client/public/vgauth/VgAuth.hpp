// ============================================================================
//  VG AUTH — Cliente C++ (single-header, Windows / C++17)
//  Endpoint: POST https://vgsellers.lat/api/vgauth/v1
//
//  Dependências: WinHTTP (winhttp.lib) + BCrypt (bcrypt.lib) + COM (WMI)
//  Link: #pragma comment(lib, "winhttp.lib") / "bcrypt.lib" / "wbemuuid.lib" / "ole32.lib" / "oleaut32.lib"
//
//  PROTEÇÕES INCLUÍDAS:
//   - Verificação de assinatura HMAC-SHA256 de cada resposta (anti server-emulator)
//   - Timestamp anti-replay (resposta expira em 120s)
//   - Comparação de assinatura em tempo constante (anti timing-attack)
//   - HWID duplo: serial da placa-mãe (Win32_BaseBoard) + ProcessorId (Win32_Processor)
//   - Anti-debugging: IsDebuggerPresent, CheckRemoteDebuggerPresent,
//     NtQueryInformationProcess(DebugPort), PEB.BeingDebugged, timing check
//   - Validação periódica de sessão (check()) — se o servidor banir/pausar,
//     o cliente é derrubado na próxima chamada
//
//  RECOMENDADO EM PRODUÇÃO:
//   - Rode VMProtect/Themida no binário final (virtualize VgAuth::api e os
//     pontos onde você checa o login)
//   - NÃO decida nada crítico só com o retorno de login(): baixe dados/
//     parâmetros essenciais do seu próprio backend APÓS autenticar
//   - Considere certificate pinning no WinHttp se o seu público for alvo de
//     emuladores (hosts-file redirect + CA falsa)
// ============================================================================
#pragma once

#ifndef VGAUTH_HPP
#define VGAUTH_HPP

#include <windows.h>
#include <winhttp.h>
#include <bcrypt.h>
#include <wbemidl.h>
#include <comdef.h>
#include <intrin.h>
#include <stdlib.h>
#include <string>
#include <vector>
#include <sstream>
#include <chrono>

#ifndef NT_SUCCESS
#define NT_SUCCESS(Status) (((long)(Status)) >= 0)
#endif

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")

namespace VgAuth {

// ─────────────────────────────────────────────────────────────────────────────
// Anti-debugging / anti-tamper (rode em thread ou antes de cada login)
// ─────────────────────────────────────────────────────────────────────────────
namespace Security {

    typedef NTSTATUS(NTAPI* pNtQueryInformationProcess)(
        HANDLE, UINT, PVOID, ULONG, PULONG);

    inline bool DebugPortCheck() {
        HMODULE ntdll = GetModuleHandleA("ntdll.dll");
        if (!ntdll) return false;
        auto NtQuery = (pNtQueryInformationProcess)GetProcAddress(ntdll, "NtQueryInformationProcess");
        if (!NtQuery) return false;
        DWORD debugPort = 0;
        NTSTATUS st = NtQuery(GetCurrentProcess(), 0x07 /* ProcessDebugPort */, &debugPort, sizeof(debugPort), nullptr);
        return NT_SUCCESS(st) && debugPort != 0;
    }

    inline bool PebDebugFlag() {
#ifdef _WIN64
        auto peb = (PBYTE)__readgsqword(0x60);
        return peb[2] != 0;
#else
        auto peb = (PBYTE)__readfsdword(0x30);
        return peb[2] != 0;
#endif
    }

    inline bool RemoteDebugger() {
        BOOL dbg = FALSE;
        CheckRemoteDebuggerPresent(GetCurrentProcess(), &dbg);
        return dbg == TRUE;
    }

    // Falha de tempo: single-step / breakpoints deixam a execução lenta
    inline bool TimingCheck() {
        ULONGLONG t0 = GetTickCount64();
        volatile int x = 0;
        for (int i = 0; i < 100000; i++) x += i;
        return (GetTickCount64() - t0) > 2000; // ms — absurdamente lento = debugger
    }

    inline bool Detected() {
        return IsDebuggerPresent() || RemoteDebugger() || DebugPortCheck() || PebDebugFlag() || TimingCheck();
    }

    // Chame no início do programa E periodicamente (thread) — em release, prefira
    // encerrar silenciosamente ou corromper estado em vez de mostrar mensagem.
    inline void KillIfDebugged() {
        if (Detected()) {
            ExitProcess(0xDEAD);
        }
    }

    // Comparação em tempo constante — nunca use ==/strcmp para assinaturas
    inline bool ConstantTimeEqual(const std::string& a, const std::string& b) {
        if (a.size() != b.size()) return false;
        volatile unsigned char diff = 0;
        for (size_t i = 0; i < a.size(); i++) diff |= (unsigned char)(a[i] ^ b[i]);
        return diff == 0;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HWID — serial da placa-mãe + ProcessorId via WMI
// ─────────────────────────────────────────────────────────────────────────────
namespace Hwid {

    inline std::string WmiQuery(const wchar_t* wmiClass, const wchar_t* field) {
        std::string result;
        HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        bool comStarted = SUCCEEDED(hr);

        IWbemLocator* loc = nullptr;
        IWbemServices* svc = nullptr;
        IEnumWbemClassObject* en = nullptr;

        do {
            if (FAILED(CoInitializeSecurity(nullptr, -1, nullptr, nullptr,
                RPC_C_AUTHN_LEVEL_DEFAULT, RPC_C_IMP_LEVEL_IMPERSONATE,
                nullptr, EOAC_NONE, nullptr))) break;

            if (FAILED(CoCreateInstance(CLSID_WbemLocator, nullptr, CLSCTX_INPROC_SERVER,
                IID_IWbemLocator, (LPVOID*)&loc))) break;

            if (FAILED(loc->ConnectServer(_bstr_t(L"ROOT\\CIMV2"), nullptr, nullptr, nullptr,
                0, nullptr, nullptr, &svc))) break;

            if (FAILED(CoSetProxyBlanket(svc, RPC_C_AUTHN_WINNT, RPC_C_AUTHZ_NONE, nullptr,
                RPC_C_AUTHN_LEVEL_CALL, RPC_C_IMP_LEVEL_IMPERSONATE, nullptr, EOAC_NONE))) break;

            wchar_t query[256];
            swprintf_s(query, L"SELECT %s FROM %s", field, wmiClass);
            if (FAILED(svc->ExecQuery(_bstr_t(L"WQL"), _bstr_t(query),
                WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, nullptr, &en))) break;

            IWbemClassObject* obj = nullptr;
            ULONG ret = 0;
            if (en->Next(WBEM_INFINITE, 1, &obj, &ret) == S_OK && obj) {
                VARIANT v;
                VariantInit(&v);
                if (SUCCEEDED(obj->Get(field, 0, &v, nullptr, nullptr)) && v.vt == VT_BSTR && v.bstrVal) {
                    _bstr_t b(v.bstrVal);
                    result = (const char*)b;
                }
                VariantClear(&v);
                obj->Release();
            }
        } while (false);

        if (en) en->Release();
        if (svc) svc->Release();
        if (loc) loc->Release();
        if (comStarted) CoUninitialize();
        return result;
    }

    inline std::string Motherboard() {
        std::string s = WmiQuery(L"Win32_BaseBoard", L"SerialNumber");
        if (s.empty()) s = WmiQuery(L"Win32_ComputerSystemProduct", L"UUID");
        // trim espaços
        while (!s.empty() && (s.back() == ' ' || s.back() == '\t')) s.pop_back();
        return s;
    }

    inline std::string Cpu() {
        return WmiQuery(L"Win32_Processor", L"ProcessorId");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP + crypto internos
// ─────────────────────────────────────────────────────────────────────────────
namespace Internal {

    inline std::string HmacSha256(const std::string& key, const std::string& msg) {
        BCRYPT_ALG_HANDLE alg = nullptr;
        BCRYPT_HASH_HANDLE hash = nullptr;
        std::string out;
        if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_SHA256_ALGORITHM, nullptr, BCRYPT_ALG_HANDLE_HMAC_FLAG) != 0)
            return out;
        DWORD objLen = 0, resLen = 0;
        BCryptGetProperty(alg, BCRYPT_OBJECT_LENGTH, (PUCHAR)&objLen, sizeof(objLen), &resLen, 0);
        DWORD hashLen = 0;
        BCryptGetProperty(alg, BCRYPT_HASH_LENGTH, (PUCHAR)&hashLen, sizeof(hashLen), &resLen, 0);
        std::vector<BYTE> obj(objLen), mac(hashLen);
        if (BCryptCreateHash(alg, &hash, obj.data(), objLen,
                (PUCHAR)key.data(), (ULONG)key.size(), 0) == 0) {
            BCryptHashData(hash, (PUCHAR)msg.data(), (ULONG)msg.size(), 0);
            BCryptFinishHash(hash, mac.data(), hashLen, 0);
            BCryptDestroyHash(hash);
            const char* hex = "0123456789abcdef";
            for (BYTE b : mac) { out += hex[b >> 4]; out += hex[b & 0xF]; }
        }
        BCryptCloseAlgorithmProvider(alg, 0);
        return out;
    }

    inline std::wstring Widen(const std::string& s) {
        return std::wstring(s.begin(), s.end());
    }

    // POST JSON via WinHTTP (HTTPS)
    inline std::string HttpPost(const wchar_t* host, const wchar_t* path, const std::string& json) {
        std::string response;
        HINTERNET hSession = WinHttpOpen(L"VGAuth/1.0",
            WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
        if (!hSession) return response;
        HINTERNET hConnect = WinHttpConnect(hSession, host, INTERNET_DEFAULT_HTTPS_PORT, 0);
        if (!hConnect) { WinHttpCloseHandle(hSession); return response; }
        HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", path,
            nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
        if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return response; }

        std::wstring headers = L"Content-Type: application/json\r\n";
        BOOL sent = WinHttpSendRequest(hRequest, headers.c_str(), (DWORD)headers.size(),
            (LPVOID)json.data(), (DWORD)json.size(), (DWORD)json.size(), 0);
        if (sent && WinHttpReceiveResponse(hRequest, nullptr)) {
            DWORD size = 0;
            do {
                if (!WinHttpQueryDataAvailable(hRequest, &size) || size == 0) break;
                std::vector<char> buf(size + 1, 0);
                DWORD read = 0;
                if (WinHttpReadData(hRequest, buf.data(), size, &read) && read > 0)
                    response.append(buf.data(), read);
            } while (size > 0);
        }
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return response;
    }

    // Extrator JSON minimalista (campos string/number/bool flat + objeto "info")
    inline std::string JsonStr(const std::string& body, const std::string& key) {
        std::string needle = "\"" + key + "\"";
        size_t p = body.find(needle);
        if (p == std::string::npos) return "";
        p = body.find(':', p + needle.size());
        if (p == std::string::npos) return "";
        p++;
        while (p < body.size() && (body[p] == ' ' || body[p] == '\t')) p++;
        if (p >= body.size()) return "";
        if (body[p] == '"') {
            size_t end = body.find('"', p + 1);
            while (end != std::string::npos && body[end - 1] == '\\') end = body.find('"', end + 1);
            return end == std::string::npos ? "" : body.substr(p + 1, end - p - 1);
        }
        size_t end = body.find_first_of(",}\n", p);
        std::string v = body.substr(p, end == std::string::npos ? end : end - p);
        while (!v.empty() && (v.back() == ' ' || v.back() == '\t')) v.pop_back();
        return v;
    }

    inline std::string JsonEscape(const std::string& s) {
        std::string out;
        for (char c : s) {
            if (c == '"' || c == '\\') { out += '\\'; out += c; }
            else if (c == '\n') out += "\\n";
            else out += c;
        }
        return out;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// API principal
// ─────────────────────────────────────────────────────────────────────────────
class api {
public:
    std::string name, ownerid, secret, version;
    std::string host = "vgsellers.lat";
    std::string path = "/api/vgauth/v1";

    // estado da sessão
    std::string sessionid, enckey;
    bool initialized = false;
    bool loggedIn = false;

    // dados do usuário após login/register/license
    std::string username, email, subLevel, expiresAt, message;
    bool success = false;

    // ban: preenchidos quando o servidor responde "banned"
    bool banned = false;
    std::string banReason;

    api(const std::string& appName, const std::string& ownerId,
        const std::string& appSecret, const std::string& appVersion = "1.0")
        : name(appName), ownerid(ownerId), secret(appSecret), version(appVersion) {}

    // ── init: obrigatório antes de qualquer chamada ─────────────────────────
    bool init() {
        Security::KillIfDebugged();
        std::ostringstream j;
        j << "{\"type\":\"init\",\"name\":\"" << Internal::JsonEscape(name)
          << "\",\"ownerid\":\"" << Internal::JsonEscape(ownerid)
          << "\",\"secret\":\"" << Internal::JsonEscape(secret)
          << "\",\"ver\":\"" << Internal::JsonEscape(version) << "\"}";
        std::string r = Internal::HttpPost(Internal::Widen(host).c_str(), Internal::Widen(path).c_str(), j.str());
        if (!verify(r)) return fail("signature_mismatch");
        success = Internal::JsonStr(r, "success") == "true";
        message = Internal::JsonStr(r, "message");
        if (success) {
            sessionid = Internal::JsonStr(r, "sessionid");
            enckey = Internal::JsonStr(r, "enckey");
            initialized = true;
        }
        return success;
    }

    // ── register: cria conta (user + senha + email) consumindo uma key ──────
    bool registerUser(const std::string& user, const std::string& pass,
                      const std::string& key, const std::string& mail = "") {
        return auth("register", user, pass, key, mail);
    }

    // ── login: usuário + senha (HWID verificado no servidor) ────────────────
    bool login(const std::string& user, const std::string& pass) {
        return auth("login", user, pass, "", "");
    }

    // ── license: login direto por key, sem conta ────────────────────────────
    bool license(const std::string& key) {
        return auth("license", "", "", key, "");
    }

    // ── check: heartbeat — revalida licença/ban no servidor ────────────────
    bool check() {
        if (!initialized) return false;
        Security::KillIfDebugged();
        std::string r = call("check", "");
        if (!verify(r)) { loggedIn = false; return fail("signature_mismatch"); }
        success = Internal::JsonStr(r, "success") == "true";
        message = Internal::JsonStr(r, "message");
        if (!success) loggedIn = false;
        return success;
    }

    // ── log: envia log ao painel ────────────────────────────────────────────
    bool log(const std::string& msg) {
        if (!initialized) return false;
        std::string r = call("log", ",\"message\":\"" + Internal::JsonEscape(msg) + "\"");
        if (!verify(r)) return false;
        return Internal::JsonStr(r, "success") == "true";
    }

private:
    bool auth(const char* type, const std::string& user, const std::string& pass,
              const std::string& key, const std::string& mail) {
        if (!initialized) return fail("not_initialized");
        Security::KillIfDebugged();

        // Coleta HWID duplo — enviado em TODA chamada de auth
        std::string hwidMb = Hwid::Motherboard();
        std::string hwidCpu = Hwid::Cpu();

        std::ostringstream extra;
        extra << ",\"hwid_mb\":\"" << Internal::JsonEscape(hwidMb)
              << "\",\"hwid_cpu\":\"" << Internal::JsonEscape(hwidCpu) << "\"";
        if (!user.empty()) extra << ",\"username\":\"" << Internal::JsonEscape(user) << "\"";
        if (!pass.empty()) extra << ",\"pass\":\"" << Internal::JsonEscape(pass) << "\"";
        if (!key.empty()) extra << ",\"key\":\"" << Internal::JsonEscape(key) << "\"";
        if (!mail.empty()) extra << ",\"email\":\"" << Internal::JsonEscape(mail) << "\"";

        std::string r = call(type, extra.str());
        if (!verify(r)) return fail("signature_mismatch");
        success = Internal::JsonStr(r, "success") == "true";
        message = Internal::JsonStr(r, "message");
        banned = Internal::JsonStr(r, "banned") == "true";
        banReason = Internal::JsonStr(r, "reason");
        if (success) {
            username = Internal::JsonStr(r, "username");
            email = Internal::JsonStr(r, "email");
            subLevel = Internal::JsonStr(r, "subLevel");
            expiresAt = Internal::JsonStr(r, "expiresAt");
            loggedIn = true;
        }
        return success;
    }

    // Mensagem amigável em PT-BR para exibir ao usuário final
    std::string errorText() const {
        if (banned) return "Voce foi banido." + (banReason.empty() ? "" : " Motivo: " + banReason);
        if (message == "invalid_credentials") return "Usuario ou senha incorretos.";
        if (message == "invalid_key") return "Key invalida ou inexistente.";
        if (message == "key_already_used") return "Essa key ja foi utilizada.";
        if (message == "key_paused") return "Essa key esta pausada.";
        if (message == "subscription_expired") return "Sua assinatura expirou.";
        if (message == "subscription_invalid") return "Sua assinatura nao e mais valida.";
        if (message == "hwid_mismatch") return "Esta key esta vinculada a outro computador.";
        if (message == "rate_limited") return "Muitas tentativas. Aguarde 1 minuto.";
        if (message == "app_disabled") return "Aplicacao desativada.";
        if (message == "invalid_session" || message == "missing_session") return "Sessao invalida. Reinicie o programa.";
        if (message == "signature_mismatch") return "Falha de seguranca: resposta nao autenticada.";
        if (message == "not_initialized") return "Cliente nao inicializado.";
        return "Erro: " + message;
    }

    std::string call(const char* type, const std::string& extra) {
        std::ostringstream j;
        j << "{\"type\":\"" << type << "\",\"sessionid\":\"" << sessionid << "\"" << extra << "}";
        return Internal::HttpPost(Internal::Widen(host).c_str(), Internal::Widen(path).c_str(), j.str());
    }

    // Verifica assinatura HMAC + frescor (anti emulador / anti replay).
    // SE A ASSINATURA FALHAR A RESPOSTA É DESCARTADA — nunca autentique sem isso.
    bool verify(const std::string& r) {
        if (r.empty()) return false;
        std::string sig = Internal::JsonStr(r, "signature");
        std::string ts = Internal::JsonStr(r, "ts");
        std::string ok = Internal::JsonStr(r, "success");
        std::string msg = Internal::JsonStr(r, "message");
        std::string sid = Internal::JsonStr(r, "sessionid");
        if (sig.empty() || ts.empty()) return false;

        // anti-replay: resposta não pode ter mais de 120s
        long long serverTs = _strtoi64(ts.c_str(), nullptr, 10);
        long long now = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
        if (serverTs <= 0 || (now - serverTs) > 120 || (serverTs - now) > 120) return false;

        std::string payload = std::string(ok == "true" ? "1" : "0") + "|" + msg + "|" + sid + "|" + ts;
        std::string expected = Internal::HmacSha256(secret, payload);
        return Security::ConstantTimeEqual(expected, sig);
    }

    bool fail(const char* m) { success = false; message = m; return false; }
};

} // namespace VgAuth

#endif // VGAUTH_HPP
