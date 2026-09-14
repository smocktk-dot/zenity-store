import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 rounded-lg p-0.5"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <button
        onClick={() => setLanguage("pt")}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
        style={
          language === "pt"
            ? {
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                border: "1px solid rgba(16,185,129,0.4)",
              }
            : { color: "#6b7280", border: "1px solid transparent" }
        }
      >
        <span>🇧🇷</span>
        <span>PT</span>
      </button>
      <button
        onClick={() => setLanguage("en")}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
        style={
          language === "en"
            ? {
                background: "rgba(16,185,129,0.15)",
                color: "#6ee7b7",
                border: "1px solid rgba(16,185,129,0.4)",
              }
            : { color: "#6b7280", border: "1px solid transparent" }
        }
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
