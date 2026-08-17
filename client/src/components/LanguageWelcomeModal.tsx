import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageWelcomeModal() {
  const { setLanguage } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if user has never chosen a language
    const stored = localStorage.getItem("zenity_language");
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleSelect = (lang: "pt" | "en") => {
    setLanguage(lang);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden w-full max-w-sm mx-4"
        style={{
          background: "linear-gradient(145deg, rgba(13,10,25,0.99) 0%, rgba(18,12,35,0.99) 100%)",
          border: "1px solid rgba(124,58,237,0.4)",
          boxShadow: "0 0 80px rgba(124,58,237,0.2), 0 30px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)" }}
        />

        {/* Logo / Header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(139,92,246,0.15))",
              border: "1px solid rgba(124,58,237,0.5)",
              boxShadow: "0 0 30px rgba(124,58,237,0.2)",
            }}
          >
            <span className="text-3xl">🌐</span>
          </div>
          <h2 className="text-white text-xl font-bold text-center leading-tight tracking-[0.2em]">
            SELLERS
          </h2>
          <p className="text-gray-400 text-sm text-center mt-1">
            Selecione seu idioma / Select your language
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Language options */}
        <div className="p-6 space-y-3">
          {/* Portuguese */}
          <button
            onClick={() => handleSelect("pt")}
            className="w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05))",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                🇧🇷
              </div>
              <div>
                <p className="text-white font-bold text-base">Português</p>
                <p className="text-gray-400 text-sm">Continuar em Português</p>
              </div>
              <div className="ml-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>
          </button>

          {/* English */}
          <button
            onClick={() => handleSelect("en")}
            className="w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}
              >
                🇺🇸
              </div>
              <div>
                <p className="text-white font-bold text-base">English</p>
                <p className="text-gray-400 text-sm">Continue in English</p>
              </div>
              <div className="ml-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
              </div>
            </div>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-gray-600 text-xs text-center pb-5 px-6">
          Você pode alterar o idioma a qualquer momento • You can change language anytime
        </p>
      </div>
    </div>
  );
}
