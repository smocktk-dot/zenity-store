// ============================================================================
//  VG AUTH — Exemplo de uso em C++
//  Compile com: VgAuth.hpp no include path + C++17
// ============================================================================
#include <iostream>
#include "VgAuth.hpp"

int main() {
    // Credenciais do app — copie do painel admin → VG Auth → seu app.
    // O 3º parâmetro é a PUBLIC KEY do app (campo "Pub Key", 128 hex) —
    // ela só valida assinaturas do servidor e pode ir embutida no exe
    // sem risco: quem extrai não consegue forjar resposta.
    VgAuth::api auth(
        "MeuApp",                                   // name
        "OWNER_ID_AQUI",                            // ownerid
        "PUB_KEY_128_HEX_AQUI",                     // public key (campo "Pub Key" do painel)
        "1.0"                                       // versão do seu binário
    );

    if (!auth.init()) {
        std::cerr << "Falha ao iniciar: " << auth.message << "\n";
        return 1;
    }

    std::cout << "1) Registrar   2) Login   3) Login por key\n> ";
    int op; std::cin >> op;

    if (op == 1) {
        std::string user, pass, key, mail;
        std::cout << "Usuario: "; std::cin >> user;
        std::cout << "Senha: ";   std::cin >> pass;
        std::cout << "Email: ";   std::cin >> mail;
        std::cout << "Key: ";     std::cin >> key;
        if (!auth.registerUser(user, pass, key, mail)) {
            // banned=true quando o IP/HWID esta na lista global de bans
            std::cerr << "Registro falhou: " << auth.errorText() << "\n";
            return 1;
        }
    } else if (op == 2) {
        std::string user, pass;
        std::cout << "Usuario: "; std::cin >> user;
        std::cout << "Senha: ";   std::cin >> pass;
        if (!auth.login(user, pass)) {
            if (auth.banned) {
                // Mostra mensagem de ban para o usuario
                std::cerr << auth.errorText() << "\n";
            } else {
                std::cerr << "Login falhou: " << auth.errorText() << "\n";
            }
            return 1;
        }
    } else {
        std::string key;
        std::cout << "Key: "; std::cin >> key;
        if (!auth.license(key)) {
            std::cerr << auth.errorText() << "\n";
            return 1;
        }
    }

    std::cout << "Autenticado! Sub: " << auth.subLevel
              << " | Expira: " << auth.expiresAt << "\n";

    // 3) Heartbeat — revalida com o servidor periodicamente.
    //    Se a key for banida/pausada no painel, check() retorna false.
    while (true) {
        auth.selfDefense(); // anti-debug + screenshot + reporta pro painel
        if (!auth.check()) {
            std::cerr << "Sessao invalidada: " << auth.errorText() << "\n";
            return 1;
        }
        Sleep(30000); // 30s
    }
}
