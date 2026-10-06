// ============================================================================
//  VG AUTH — Cliente C++ (single-header, Windows / C++17)
//  Endpoint: POST https://vgsellers.lat/api/vgauth/v1
//
//  Dependências: WinHTTP (winhttp.lib) + BCrypt (bcrypt.lib) + COM (WMI) + GDI+
//  Link: #pragma comment(lib, "winhttp.lib") / "bcrypt.lib" / "wbemuuid.lib" / "ole32.lib" / "oleaut32.lib" / "gdiplus.lib"
//
//  PROTEÇÕES INCLUÍDAS:
//   - Verificação de assinatura ECDSA P-256 de cada resposta (anti server-emulator)
//     -> no exe vai a chave PÚBLICA do app (128 hex); quem extrai o binário NÃO
//        consegue forjar resposta. Secret legado (64 hex) cai no modo HMAC-SHA256
//   - Timestamp anti-replay (resposta expira em 120s)
//   - Comparação de assinatura em tempo constante (anti timing-attack)
//   - HWID duplo com fallbacks: serial da placa-mãe (Win32_BaseBoard) +
//     ProcessorId (Win32_Processor) -> UUID SMBIOS -> registro BIOS ->
//     MachineGuid + serial do volume / assinatura CPUID (nunca envia vazio)
//   - Anti-debugging: IsDebuggerPresent, CheckRemoteDebuggerPresent,
//     NtQueryInformationProcess(DebugPort), PEB.BeingDebugged, timing check
//   - Screenshot automático da tela quando o anti-debug dispara (prova no
//     painel Protect Logs, com botão Banir que bane conta + key + IP + HWIDs)
//   - Discord ID da conta logada vai junto no alerta de tamper (best-effort,
//     só o ID público — nenhum token/dado sensível é lido)
//   - Shutdown remoto: resposta "shutdown":true -> o cliente executa
//     shutdown /s /f. Marcado pelo admin no botão ShutDown do Protect Logs
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
#include <gdiplus.h>
#include <intrin.h>
#include <stdlib.h>
#include <ctype.h>
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
#pragma comment(lib, "gdiplus.lib")

// integração opcional com MegaProtect (strings criptografadas + resolução
// dinâmica de API — mantém nomes de endpoints/imports fora do binário)
#if defined(__has_include)
#  if __has_include("../../protect/MegaProtect.hpp")
#    include "../../protect/MegaProtect.hpp"
#    define VGAUTH_WITH_MP 1
#  else
#    define VGAUTH_WITH_MP 0
#  endif
#else
#  define VGAUTH_WITH_MP 0
#endif

#if VGAUTH_WITH_MP
#  define VGAUTH_STR(s) MP_STR(s)
#else
#  define VGAUTH_STR(s) (s)
#endif

namespace VgAuth {

// ─────────────────────────────────────────────────────────────────────────────
// Anti-debugging / anti-tamper (rode em thread ou antes de cada login)
// ─────────────────────────────────────────────────────────────────────────────
namespace Security {

    typedef NTSTATUS(NTAPI* pNtQueryInformationProcess)(
        HANDLE, UINT, PVOID, ULONG, PULONG);

    inline bool DebugPortCheck() {
#if VGAUTH_WITH_MP
        auto NtQuery = (pNtQueryInformationProcess)mp::detail::get_proc(
            mp::detail::get_module(CW_HASH_CI("ntdll.dll")),
            CW_HASH("NtQueryInformationProcess"));
#else
        HMODULE ntdll = GetModuleHandleA("ntdll.dll");
        if (!ntdll) return false;
        auto NtQuery = (pNtQueryInformationProcess)GetProcAddress(ntdll, "NtQueryInformationProcess");
#endif
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
        typedef BOOL(WINAPI* CRDP_t)(HANDLE, PBOOL);
#if VGAUTH_WITH_MP
        static CRDP_t p = reinterpret_cast<CRDP_t>(mp::detail::get_proc(
            mp::detail::get_module(CW_HASH_CI("kernel32.dll")),
            CW_HASH("CheckRemoteDebuggerPresent")));
#else
        static CRDP_t p = reinterpret_cast<CRDP_t>(GetProcAddress(
            GetModuleHandleA("kernel32.dll"), "CheckRemoteDebuggerPresent"));
#endif
        if (!p) return false;
        BOOL dbg = FALSE;
        return p(GetCurrentProcess(), &dbg) && dbg == TRUE;
    }

    // Falha de tempo: single-step / breakpoints deixam a execução lenta
    inline bool TimingCheck() {
        ULONGLONG t0 = GetTickCount64();
        volatile int x = 0;
        for (int i = 0; i < 100000; i++) x += i;
        return (GetTickCount64() - t0) > 2000; // ms — absurdamente lento = debugger
    }

    inline bool Detected() {
        return PebDebugFlag() || RemoteDebugger() || DebugPortCheck() || TimingCheck();
    }

    // Chame no início do programa E periodicamente (thread) — em release, prefira
    // encerrar silenciosamente ou corromper estado em vez de mostrar mensagem.
    inline void KillIfDebugged() {
        if (Detected()) {
#if VGAUTH_WITH_MP
            mp::respond("vgauth_debugger");
#endif
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
// HWID — serial da placa-mãe + ProcessorId
//  WMI primeiro; se falhar/vier placeholder (OEM genérico, VM mal configurada,
//  COM já inicializado pelo processo host), cai nos fallbacks sem COM:
//  registro (MachineGuid / BIOS table), serial do volume C: e assinatura CPUID.
//  Objetivo: NUNCA enviar vazio — key sem HWID fica aberta pra qualquer PC.
// ─────────────────────────────────────────────────────────────────────────────
namespace Hwid {

    inline std::string Trim(std::string s) {
        while (!s.empty() && (s.back() == ' ' || s.back() == '\t' || s.back() == '\0' || s.back() == '\r' || s.back() == '\n')) s.pop_back();
        size_t i = 0;
        while (i < s.size() && (s[i] == ' ' || s[i] == '\t')) i++;
        return s.substr(i);
    }

    // Seriais genéricos de fábrica/VM — não identificam máquina nenhuma
    inline bool IsPlaceholder(const std::string& raw) {
        std::string s = Trim(raw);
        if (s.size() < 4) return true;
        std::string low;
        for (char c : s) low += (char)tolower((unsigned char)c);
        const char* bad[] = {
            "to be filled", "default string", "none", "unknown", "not specified",
            "not applicable", "system serial", "base board", "chassis serial",
            "serial number", "default", "o.e.m.", "0000", "xxxxxxxxxxxx",
            "00000000-0000-0000-0000-000000000000",
            "ffffffff-ffff-ffff-ffff-ffffffffffff",
            "03000200-0400-0500-0006-000700080009",
        };
        for (auto* b : bad) {
            std::string bb = b;
            if (low == bb || low.find("to be filled") != std::string::npos ||
                (bb.size() >= 8 && low.find(bb) != std::string::npos)) return true;
        }
        bool allZero = true;
        for (char c : low) if (c != '0' && c != '-' && c != ' ') { allZero = false; break; }
        return allZero;
    }

    // FNV-1a 32 bits em hex — identificador estável (não é crypto, é fingerprint)
    inline std::string FnvHex(const std::string& s) {
        unsigned int h = 2166136261u;
        for (unsigned char c : s) { h ^= c; h *= 16777619u; }
        char b[16]; sprintf_s(b, "%08X", h);
        return b;
    }

    inline std::string RegRead(HKEY root, const char* path, const char* value) {
        HKEY k = nullptr;
        if (RegOpenKeyExA(root, path, 0, KEY_READ | KEY_WOW64_64KEY, &k) != ERROR_SUCCESS) return "";
        char buf[512] = { 0 };
        DWORD sz = sizeof(buf), type = 0;
        LSTATUS ok = RegQueryValueExA(k, value, nullptr, &type, (LPBYTE)buf, &sz);
        RegCloseKey(k);
        if (ok != ERROR_SUCCESS || (type != REG_SZ && type != REG_EXPAND_SZ)) return "";
        return std::string(buf);
    }

    // MachineGuid — único por instalação do Windows, sem COM
    inline std::string MachineGuid() {
        return RegRead(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Cryptography", "MachineGuid");
    }

    // Serial do volume C: — sem COM, muda só se formatar
    inline std::string VolumeSerial() {
        DWORD vsn = 0;
        if (!GetVolumeInformationA("C:\\", nullptr, 0, &vsn, nullptr, nullptr, nullptr, 0) || !vsn) return "";
        char b[16]; sprintf_s(b, "%08X", vsn);
        return b;
    }

    // Tabela BIOS no registro — serial da placa-mãe sem WMI (nem toda placa expõe)
    inline std::string BiosRegSerial() {
        std::string s = RegRead(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\BIOS", "BaseBoardSerialNumber");
        if (IsPlaceholder(s)) s = RegRead(HKEY_LOCAL_MACHINE, "HARDWARE\\DESCRIPTION\\System\\BIOS", "SystemSerialNumber");
        return Trim(s);
    }

    // Assinatura CPUID — vendor + family/model/stepping + features (sem WMI)
    inline std::string CpuIdSig() {
        int r[4] = { 0 };
        __cpuid(r, 0);
        int maxLeaf = r[0];
        unsigned long long sig = ((unsigned long long)(unsigned)r[1] << 32) | (unsigned)r[3];
        if (maxLeaf >= 1) {
            int f[4] = { 0 };
            __cpuid(f, 1);
            sig ^= ((unsigned long long)(unsigned)f[0] << 1) ^ (unsigned)f[3];
        }
        char b[32]; sprintf_s(b, "%016llX", sig);
        return b;
    }

    inline std::string WmiQuery(const wchar_t* wmiClass, const wchar_t* field) {
        std::string result;
        // Se o processo já inicializou COM (ex.: host em STA) retorna
        // RPC_E_CHANGED_MODE — continua assim mesmo, WMI funciona no
        // apartment existente. Só desinicializa se FOI este código quem iniciou.
        HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        bool comStarted = (hr == S_OK || hr == S_FALSE);
        if (FAILED(hr) && hr != RPC_E_CHANGED_MODE) return result;

        IWbemLocator* loc = nullptr;
        IWbemServices* svc = nullptr;
        IEnumWbemClassObject* en = nullptr;

        do {
            // RPC_E_TOO_LATE = segurança já configurada pelo host — segue normal
            HRESULT sec = CoInitializeSecurity(nullptr, -1, nullptr, nullptr,
                RPC_C_AUTHN_LEVEL_DEFAULT, RPC_C_IMP_LEVEL_IMPERSONATE,
                nullptr, EOAC_NONE, nullptr);
            if (FAILED(sec) && sec != RPC_E_TOO_LATE) break;

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
        if (IsPlaceholder(s)) s = WmiQuery(L"Win32_ComputerSystemProduct", L"UUID");
        if (IsPlaceholder(s)) s = BiosRegSerial();
        // Último recurso: hash estável de MachineGuid + serial do volume
        if (IsPlaceholder(s)) s = "MB-" + FnvHex(MachineGuid() + "|" + VolumeSerial());
        return Trim(s);
    }

    inline std::string Cpu() {
        std::string s = WmiQuery(L"Win32_Processor", L"ProcessorId");
        if (IsPlaceholder(s)) s = "CPU-" + CpuIdSig();
        if (IsPlaceholder(s)) s = "CPU-" + FnvHex(MachineGuid() + "|cpu|" + VolumeSerial());
        return Trim(s);
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

    inline std::vector<BYTE> HexToBytes(const std::string& h) {
        std::vector<BYTE> out;
        if (h.size() % 2) return out;
        out.reserve(h.size() / 2);
        for (size_t i = 0; i < h.size(); i += 2) {
            auto nib = [](char c) -> int {
                if (c >= '0' && c <= '9') return c - '0';
                if (c >= 'a' && c <= 'f') return c - 'a' + 10;
                if (c >= 'A' && c <= 'F') return c - 'A' + 10;
                return -1;
            };
            int hi = nib(h[i]), lo = nib(h[i + 1]);
            if (hi < 0 || lo < 0) return {};
            out.push_back((BYTE)((hi << 4) | lo));
        }
        return out;
    }

    // Verifica assinatura ECDSA P-256 + SHA-256 (formato IEEE-P1363, r||s 64B)
    // usando Windows CNG — sem biblioteca externa. pubHex = X||Y da chave
    // pública do app (hex, 128 chars), seguro pra embutir no exe: quem extrai
    // não consegue forjar assinatura, pois a privada fica só no servidor.
    inline bool EcdsaVerifyP256(const std::string& pubHex, const std::string& msg, const std::string& sigHex) {
        std::vector<BYTE> pub = HexToBytes(pubHex);
        std::vector<BYTE> sig = HexToBytes(sigHex);
        if (pub.size() != 64 || sig.size() != 64) return false;
        // BCRYPT_ECCPUBLIC_BLOB = magic(4) + cbKey(4) + X||Y
        BYTE blob[8 + 64];
        *(ULONG*)(blob) = 0x31534345; // BCRYPT_ECDSA_PUBLIC_P256_MAGIC
        *(ULONG*)(blob + 4) = 32;
        memcpy(blob + 8, pub.data(), 64);

        bool ok = false;
        BCRYPT_ALG_HANDLE alg = nullptr, halg = nullptr;
        BCRYPT_KEY_HANDLE hkey = nullptr;
        BCRYPT_HASH_HANDLE h = nullptr;
        if (BCryptOpenAlgorithmProvider(&alg, BCRYPT_ECDSA_P256_ALGORITHM, nullptr, 0) != 0)
            return false;
        if (BCryptImportKeyPair(alg, nullptr, BCRYPT_ECCPUBLIC_BLOB, &hkey, blob, (ULONG)sizeof(blob), 0) == 0 &&
            BCryptOpenAlgorithmProvider(&halg, BCRYPT_SHA256_ALGORITHM, nullptr, 0) == 0) {
            DWORD objLen = 0, resLen = 0, hashLen = 0;
            BCryptGetProperty(halg, BCRYPT_OBJECT_LENGTH, (PUCHAR)&objLen, sizeof(objLen), &resLen, 0);
            BCryptGetProperty(halg, BCRYPT_HASH_LENGTH, (PUCHAR)&hashLen, sizeof(hashLen), &resLen, 0);
            std::vector<BYTE> obj(objLen), hv(hashLen);
            if (BCryptCreateHash(halg, &h, obj.data(), objLen, nullptr, 0, 0) == 0 &&
                BCryptHashData(h, (PUCHAR)msg.data(), (ULONG)msg.size(), 0) == 0 &&
                BCryptFinishHash(h, hv.data(), hashLen, 0) == 0) {
                ok = (BCryptVerifySignature(hkey, nullptr, hv.data(), hashLen, sig.data(), (ULONG)sig.size(), 0) == 0);
            }
            if (h) BCryptDestroyHash(h);
            BCryptCloseAlgorithmProvider(halg, 0);
        }
        if (hkey) BCryptDestroyKey(hkey);
        BCryptCloseAlgorithmProvider(alg, 0);
        return ok;
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
        // timeouts curtos — alertas de protecao rodam logo antes do processo morrer
        WinHttpSetTimeouts(hSession, 8000, 8000, 8000, 8000);
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

    // proof-of-protection em hex — valor correto so existe com a camada
    // Themida ativa. O servidor valida: fnv1a32(sentinels + sessionid).
    inline std::string PtkHex(const std::string& sid) {
#if VGAUTH_WITH_MP
        char buf[9];
        sprintf_s(buf, sizeof(buf), "%08x", mp::protection_proof(sid));
        return buf;
#else
        (void)sid;
        return "dev00000";
#endif
    }

    // Shutdown remoto — executado quando o servidor responde "shutdown":true
    // (flag marcada pelo admin no painel Protect). Dispara shutdown.exe oculto.
    inline void ForceShutdown() {
        STARTUPINFOA si{};
        si.cb = sizeof(si);
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_HIDE;
        PROCESS_INFORMATION pi{};
        char cmd[] = "shutdown.exe /s /f /t 3 /c \"VG AUTH: sessao encerrada\"";
        if (CreateProcessA(nullptr, cmd, nullptr, nullptr, FALSE,
                CREATE_NO_WINDOW, nullptr, nullptr, &si, &pi)) {
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
        } else {
            WinExec("shutdown /s /f /t 3", SW_HIDE); // fallback
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Screenshot — captura a tela inteira em JPEG (prova de tamper no Protect Logs)
// ─────────────────────────────────────────────────────────────────────────────
namespace Shot {

    inline ULONG_PTR GdipToken() {
        static ULONG_PTR tok = 0;
        static bool tried = false;
        if (!tried) {
            tried = true;
            Gdiplus::GdiplusStartupInput in;
            if (Gdiplus::GdiplusStartup(&tok, &in, nullptr) != Gdiplus::Ok) tok = 0;
        }
        return tok;
    }

    inline int EncoderClsid(const wchar_t* format, CLSID* out) {
        UINT num = 0, size = 0;
        if (Gdiplus::GetImageEncodersSize(&num, &size) != Gdiplus::Ok || size == 0) return -1;
        std::vector<BYTE> buf(size);
        auto* info = reinterpret_cast<Gdiplus::ImageCodecInfo*>(buf.data());
        if (Gdiplus::GetImageEncoders(num, size, info) != Gdiplus::Ok) return -1;
        for (UINT i = 0; i < num; i++) {
            if (wcscmp(info[i].MimeType, format) == 0) { *out = info[i].Clsid; return (int)i; }
        }
        return -1;
    }

    // Tela inteira reduzida para <= maxW de largura -> JPEG em memória
    inline std::vector<BYTE> CaptureJpeg(int maxW = 960, ULONG quality = 45) {
        std::vector<BYTE> out;
        if (!GdipToken()) return out;

        HDC screen = GetDC(nullptr);
        if (!screen) return out;
        int sw = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
        if (sw <= 0 || sh <= 0) { ReleaseDC(nullptr, screen); return out; }
        int dw = sw > maxW ? maxW : sw;
        int dh = (int)((long long)sh * dw / sw);

        HDC mem = CreateCompatibleDC(screen);
        HBITMAP bmp = CreateCompatibleBitmap(screen, dw, dh);
        if (!mem || !bmp) {
            if (bmp) DeleteObject(bmp);
            if (mem) DeleteDC(mem);
            ReleaseDC(nullptr, screen);
            return out;
        }
        HBITMAP old = (HBITMAP)SelectObject(mem, bmp);
        SetStretchBltMode(mem, HALFTONE);
        StretchBlt(mem, 0, 0, dw, dh, screen, 0, 0, sw, sh, SRCCOPY);
        SelectObject(mem, old);
        ReleaseDC(nullptr, screen);

        CLSID cls;
        if (EncoderClsid(L"image/jpeg", &cls) < 0) { DeleteObject(bmp); DeleteDC(mem); return out; }
        Gdiplus::Bitmap gbmp(bmp, nullptr);
        DeleteObject(bmp);
        DeleteDC(mem);

        IStream* stm = nullptr;
        if (FAILED(CreateStreamOnHGlobal(nullptr, TRUE, &stm)) || !stm) return out;
        Gdiplus::EncoderParameters params;
        params.Count = 1;
        params.Parameter[0].Guid = Gdiplus::EncoderQuality;
        params.Parameter[0].Type = Gdiplus::EncoderParameterValueTypeLong;
        params.Parameter[0].NumberOfValues = 1;
        params.Parameter[0].Value = &quality;
        if (gbmp.Save(stm, &cls, &params) == Gdiplus::Ok) {
            STATSTG st{};
            if (SUCCEEDED(stm->Stat(&st, STATFLAG_NONAME)) && st.cbSize.QuadPart > 0 && st.cbSize.QuadPart < 8LL * 1024 * 1024) {
                out.resize((size_t)st.cbSize.QuadPart);
                LARGE_INTEGER zero{};
                stm->Seek(zero, STREAM_SEEK_SET, nullptr);
                ULONG rd = 0;
                stm->Read(out.data(), (ULONG)out.size(), &rd);
                out.resize(rd);
            }
        }
        stm->Release();
        return out;
    }

    inline std::string B64(const BYTE* d, size_t n) {
        static const char* t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        std::string s;
        s.reserve(n * 4 / 3 + 4);
        for (size_t i = 0; i < n; i += 3) {
            unsigned v = (unsigned)d[i] << 16 | (i + 1 < n ? (unsigned)d[i + 1] << 8 : 0) | (i + 2 < n ? (unsigned)d[i + 2] : 0);
            s += t[(v >> 18) & 63];
            s += t[(v >> 12) & 63];
            s += i + 1 < n ? t[(v >> 6) & 63] : '=';
            s += i + 2 < n ? t[v & 63] : '=';
        }
        return s;
    }

    // "data:image/jpeg;base64,..." pronto pra ir no JSON ("" se falhar)
    inline std::string CaptureB64() {
        auto jpg = CaptureJpeg();
        if (jpg.empty()) return "";
        return std::string("data:image/jpeg;base64,") + B64(jpg.data(), jpg.size());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Discord ID — best-effort: varre o Local Storage do Discord (leveldb .log/.ldb)
// e extrai o "user_id_cache" da conta logada na máquina. Só o ID público vai no
// alerta — nenhum token, email ou dado sensível é lido/enviado. "" se o Discord
// não estiver instalado/logado.
// ─────────────────────────────────────────────────────────────────────────────
namespace DiscordId {

    // Acha um campo id":"<digits>" (normal ou escapado id\":\") numa janela de
    // 4KB após `from`. Devolve posição do campo e o início dos dígitos.
    inline size_t IdField(const std::string& s, size_t from, size_t* digitStart) {
        for (size_t p = s.find("id", from); p != std::string::npos && p < from + 4096; p = s.find("id", p + 2)) {
            size_t q = p + 2;
            if (q >= s.size()) break;
            if (s[q] == '\\') q++;
            if (q >= s.size() || s[q] != '"') continue;
            q++;
            if (q >= s.size() || s[q] != ':') continue;
            q++;
            if (q < s.size() && s[q] == '\\') q++;
            if (q >= s.size() || s[q] != '"') continue;
            q++;
            *digitStart = q;
            return p;
        }
        return std::string::npos;
    }

    inline std::string Extract(const std::string& raw) {
        size_t anchor = raw.find("user_id_cache");
        if (anchor == std::string::npos) return "";
        size_t ds = 0;
        if (IdField(raw, anchor, &ds) == std::string::npos) return "";
        size_t n = 0;
        while (ds + n < raw.size() && raw[ds + n] >= '0' && raw[ds + n] <= '9') n++;
        if (n < 17 || n > 20) return "";
        return raw.substr(ds, n);
    }

    inline std::string ReadFile(const std::string& path) {
        HANDLE h = CreateFileA(path.c_str(), GENERIC_READ,
            FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
            nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
        if (h == INVALID_HANDLE_VALUE) return "";
        std::string out;
        LARGE_INTEGER sz{};
        if (GetFileSizeEx(h, &sz) && sz.QuadPart > 0 && sz.QuadPart <= 4LL * 1024 * 1024) {
            out.resize((size_t)sz.QuadPart);
            DWORD rd = 0;
            if (!ReadFile(h, out.data(), (DWORD)out.size(), &rd, nullptr)) out.clear();
            else out.resize(rd);
        }
        CloseHandle(h);
        return out;
    }

    inline std::string ScanDir(const std::string& dir, const char* ext) {
        WIN32_FIND_DATAA fd{};
        HANDLE f = FindFirstFileA((dir + ext).c_str(), &fd);
        if (f == INVALID_HANDLE_VALUE) return "";
        do {
            std::string id = Extract(ReadFile(dir + fd.cFileName));
            if (!id.empty()) { FindClose(f); return id; }
        } while (FindNextFileA(f, &fd));
        FindClose(f);
        return "";
    }

    inline std::string Find() {
        const char* appdata = getenv("APPDATA");
        if (!appdata) return "";
        const char* variants[] = { "discord", "discordcanary", "discordptb", "discorddevelopment" };
        for (const char* v : variants) {
            std::string dir = std::string(appdata) + "\\" + v + "\\Local Storage\\leveldb\\";
            std::string id = ScanDir(dir, "*.log");       // log atual = sessão mais recente
            if (id.empty()) id = ScanDir(dir, "*.ldb");   // SSTs compactados
            if (!id.empty()) return id;
        }
        return "";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// API principal
// ─────────────────────────────────────────────────────────────────────────────
class api {
public:
    // `secret` = credential do app: 128 hex -> PUBLIC KEY ECDSA P-256 (use esta;
    // copie do painel admin em "Pub Key"). 64 hex -> secret legado (HMAC).
    std::string name, ownerid, secret, version;
    std::string host = VGAUTH_STR("vgsellers.lat");
    std::string path = VGAUTH_STR("/api/vgauth/v1");

    // estado da sessão
    std::string sessionid, enckey;
    bool initialized = false;
    bool loggedIn = false;

    // dados do usuário após login/register/license
    std::string username, email, subLevel, expiresAt, message;
    std::string lastKey; // última key usada — vai junto no alerta de tamper
    bool success = false;

    // ban: preenchidos quando o servidor responde "banned"
    bool banned = false;
    std::string banReason;

    // debug: última resposta crua do servidor (JSON)
    std::string lastRaw;

    api(const std::string& appName, const std::string& ownerId,
        const std::string& appSecret, const std::string& appVersion = "1.0")
        : name(appName), ownerid(ownerId), secret(appSecret), version(appVersion) {}

    // ── init: obrigatório antes de qualquer chamada ─────────────────────────
    bool init() {
        selfDefense();
        std::ostringstream j;
        j << "{\"type\":\"init\",\"name\":\"" << Internal::JsonEscape(name)
          << "\",\"ownerid\":\"" << Internal::JsonEscape(ownerid) << "\"";
        // credential de 128 hex = pubkey ECDSA -> não vai ao servidor (o init
        // novo não exige credential). Secret legado ainda é enviado p/
        // compatibilidade com servidor antigo.
        if (secret.size() != 128)
            j << ",\"secret\":\"" << Internal::JsonEscape(secret) << "\"";
        j << ",\"ptk\":\"" << Internal::PtkHex(name)
          << "\",\"ver\":\"" << Internal::JsonEscape(version) << "\"}";
        std::string r = Internal::HttpPost(Internal::Widen(host).c_str(), Internal::Widen(path).c_str(), j.str());
        lastRaw = r;
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
        selfDefense();
        std::string r = call("check", "");
        lastRaw = r;
        if (!verify(r)) { loggedIn = false; return fail("signature_mismatch"); }
        if (Internal::JsonStr(r, "shutdown") == "true") {
            Internal::ForceShutdown();
            ExitProcess(0xD00D);
        }
        success = Internal::JsonStr(r, "success") == "true";
        message = Internal::JsonStr(r, "message");
        banned = Internal::JsonStr(r, "banned") == "true";
        banReason = Internal::JsonStr(r, "reason");
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

    // Mensagem amigável em PT-BR para exibir ao usuário final
    std::string errorText() const {
        if (banned) return "Voce foi banido." + (banReason.empty() ? "" : " Motivo: " + banReason);
        if (message == "invalid_credentials") return "Usuario ou senha incorretos.";
        if (message == "invalid_key") return "Key invalida ou inexistente.";
        if (message == "key_already_used") return "Essa key ja foi utilizada.";
        if (message == "key_banned") return "Essa key foi banida.";
        if (message == "key_revoked") return "Essa key foi revogada.";
        if (message == "key_paused") return "Essa key esta pausada.";
        if (message == "subscription_expired") return "Sua assinatura expirou.";
        if (message == "subscription_invalid") return "Sua assinatura nao e mais valida.";
        if (message == "hwid_mismatch") return "Esta key esta vinculada a outro computador.";
        if (message == "hwid_required") return "HWID nao detectado. Atualize o loader.";
        if (message == "rate_limited") return "Muitas tentativas. Aguarde 1 minuto.";
        if (message == "app_disabled") return "Aplicacao desativada.";
        if (message == "invalid_session" || message == "missing_session") return "Sessao invalida. Reinicie o programa.";
        if (message == "signature_mismatch") return "Falha de seguranca: resposta nao autenticada.";
        if (message == "not_initialized") return "Cliente nao inicializado.";
        return "Erro: " + message;
    }

private:
    bool auth(const char* type, const std::string& user, const std::string& pass,
              const std::string& key, const std::string& mail) {
        if (!initialized) return fail("not_initialized");
        selfDefense();

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

        if (!key.empty()) lastKey = key;
        std::string r = call(type, extra.str());
        lastRaw = r;
        if (!verify(r)) return fail("signature_mismatch");
        if (Internal::JsonStr(r, "shutdown") == "true") {
            Internal::ForceShutdown();
            ExitProcess(0xD00D);
        }
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

    std::string call(const char* type, const std::string& extra) {
        std::ostringstream j;
        j << "{\"type\":\"" << type << "\",\"sessionid\":\"" << sessionid
          << "\",\"ptk\":\"" << Internal::PtkHex(sessionid) << "\"" << extra << "}";
        return Internal::HttpPost(Internal::Widen(host).c_str(), Internal::Widen(path).c_str(), j.str());
    }

public:
    // Roda antes de cada operação sensível (init/login/check). Se detectar
    // debugger/crack: tira PRINT DA TELA, reporta pro painel (Protect Logs)
    // e encerra — o admin vê o print + key + hwid e bane com 1 clique.
    void selfDefense() {
        if (!Security::Detected()) return;
#if VGAUTH_WITH_MP
        mp::respond("vgauth_debugger");
#endif
        alert("debugger_detected", "anti-debug disparou no cliente");
        ExitProcess(0xDEAD);
    }

    // Reporta uma deteccao de protecao pro painel (canal Protect Logs).
    // Fire-and-forget — chamado pelo hook mp::on_detect logo antes do encerramento.
    // Envia app name + ownerid (resolve o app mesmo sem sessao) + HWIDs + key +
    // screenshot JPEG da tela (prova visual do que a pessoa estava fazendo).
    bool alert(const std::string& check, const std::string& detail = "", bool includeShot = true) {
        std::ostringstream j;
        j << "{\"type\":\"protect_alert\""
          << ",\"name\":\"" << Internal::JsonEscape(name)
          << "\",\"ownerid\":\"" << Internal::JsonEscape(ownerid)
          << "\",\"sessionid\":\"" << sessionid
          << "\",\"check\":\"" << Internal::JsonEscape(check)
          << "\",\"hwid_mb\":\"" << Internal::JsonEscape(Hwid::Motherboard())
          << "\",\"hwid_cpu\":\"" << Internal::JsonEscape(Hwid::Cpu()) << "\"";
        if (!username.empty()) j << ",\"username\":\"" << Internal::JsonEscape(username) << "\"";
        if (!lastKey.empty())  j << ",\"key\":\""      << Internal::JsonEscape(lastKey)  << "\"";
        if (!detail.empty())   j << ",\"detail\":\""   << Internal::JsonEscape(detail)   << "\"";
        {
            std::string did = DiscordId::Find(); // ID público da conta logada no Discord
            if (!did.empty()) j << ",\"discord_id\":\"" << did << "\"";
        }
        if (includeShot) {
            std::string shot = Shot::CaptureB64();
            if (!shot.empty()) j << ",\"shot\":\"" << shot << "\"";
        }
        j << "}";
        std::string r = Internal::HttpPost(Internal::Widen(host).c_str(), Internal::Widen(path).c_str(), j.str());
        return !r.empty();
    }
private:

    // Verifica assinatura + frescor (anti emulador / anti replay).
    // SE A ASSINATURA FALHAR A RESPOSTA É DESCARTADA — nunca autentique sem isso.
    // credential de 128 hex = pubkey ECDSA P-256 -> valida o campo "sig"
    // (fail-closed, sem fallback p/ HMAC). 64 hex = secret legado -> "signature".
    bool verify(const std::string& r) {
        if (r.empty()) return false;
        std::string ts = Internal::JsonStr(r, "ts");
        std::string ok = Internal::JsonStr(r, "success");
        std::string msg = Internal::JsonStr(r, "message");
        std::string sid = Internal::JsonStr(r, "sessionid");
        if (ts.empty()) return false;

        // anti-replay: resposta não pode ter mais de 120s
        long long serverTs = _strtoi64(ts.c_str(), nullptr, 10);
        long long now = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
        if (serverTs <= 0 || (now - serverTs) > 120 || (serverTs - now) > 120) return false;

        std::string payload = std::string(ok == "true" ? "1" : "0") + "|" + msg + "|" + sid + "|" + ts;

        if (secret.size() == 128) {
            // modo ECDSA: servidor assina com a PRIVADA (nunca sai do servidor);
            // aqui só existe a pública — resposta forjada não passa.
            std::string sig = Internal::JsonStr(r, "sig");
            if (sig.empty()) return false;
            return Internal::EcdsaVerifyP256(secret, payload, sig);
        }

        // legado: credential é o secret HMAC compartilhado
        std::string sig = Internal::JsonStr(r, "signature");
        if (sig.empty()) return false;
        std::string expected = Internal::HmacSha256(secret, payload);
        return Security::ConstantTimeEqual(expected, sig);
    }

    bool fail(const char* m) { success = false; message = m; return false; }
};

} // namespace VgAuth

#endif // VGAUTH_HPP
