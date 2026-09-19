// ============================================================================
//  EXEMPLO — VG AUTH MULTI LOADER (C++)
// ----------------------------------------------------------------------------
//  Demonstra o fluxo completo de uma aplicação do tipo MULTI LOADER:
//  registro de conta (sem key), login, heartbeat e tratamento de ban.
//
//  Compile (MSVC):
//    cl /std:c++17 /EHsc example_loader.cpp
//  (as libs são linkadas via #pragma comment no .hpp)
// ============================================================================
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include "VgAuthLoader.hpp"

// Troque pelos dados do SEU app Multi Loader (painel admin -> VG AUTH -> app)
static const char* APP_NAME  = "MULTI LOADER";
static const char* OWNER_ID  = "COLE_SEU_OWNER_ID_AQUI";
static const char* APP_SECRET = "COLE_SUA_SECRET_AQUI";

int main() {
    VgLoader::api auth(APP_NAME, OWNER_ID, APP_SECRET, "1.0");

    // ── 1. INIT — obrigatório antes de tudo ──────────────────────────────────
    if (!auth.init()) {
        std::cout << "[-] Falha ao conectar: " << auth.errorText() << "\n";
        return 1;
    }
    std::cout << "[+] Conectado ao servidor.\n";

    // ── 2. Menu: registrar ou logar ──────────────────────────────────────────
    std::cout << "\n1) Criar conta\n2) Entrar\n> ";
    int op = 0; std::cin >> op;

    std::string user, pass, mail;
    std::cout << "Usuario: "; std::cin >> user;
    std::cout << "Senha:   "; std::cin >> pass;

    bool ok = false;
    if (op == 1) {
        std::cout << "Email:   "; std::cin >> mail;
        ok = auth.registerUser(user, pass, mail);   // SEM key — Multi Loader não usa keys
    } else {
        ok = auth.login(user, pass);
    }

    // ── 3. Tratamento de erro / ban ──────────────────────────────────────────
    if (!ok) {
        if (auth.banned) {
            std::cout << "[BAN] " << auth.errorText() << "\n";   // motivo do ban incluído
        } else {
            std::cout << "[-] " << auth.errorText() << "\n";
        }
        return 1;
    }

    std::cout << "[+] Logado como: " << auth.username << "\n";

    // ── 4. Heartbeat — revalida sessão e detecta ban em tempo real ───────────
    //     Se o admin banir a conta enquanto o programa roda, o próximo
    //     check() retorna false com auth.banned = true.
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(30));
        if (!auth.check()) {
            std::cout << "[!] Sessao invalidada: " << auth.errorText() << "\n";
            return 1;   // encerrar ou bloquear funcionalidades
        }
        // ... seu loader roda aqui (download, inject, etc.) ...
    }
}
