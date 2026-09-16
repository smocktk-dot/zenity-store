import { useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Download,
  Key,
  Package,
  User,
  Settings,
  LogOut,
  AppWindow,
} from "lucide-react";

interface UserMenuDropdownProps {
  username: string;
  email?: string;
  resellerType?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

export default function UserMenuDropdown({
  username,
  email,
  resellerType,
  isAdmin,
  onLogout,
  open,
  onClose,
}: UserMenuDropdownProps) {
  const [, navigate] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const roleLabel = isAdmin
    ? "ADMIN"
    : resellerType === "percentage"
    ? "RESELLER %"
    : resellerType === "credits"
    ? "RESELLER CRÉDITOS"
    : "RESELLER";

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150"
      style={{
        background: "rgba(9, 10, 14, 0.98)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* ─── Top User Profile Section ─── */}
      <div className="pt-6 pb-4 px-4 flex flex-col items-center justify-center text-center border-b border-white/[0.06]">
        {/* Avatar Monogram */}
        <div className="relative mb-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white uppercase"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            {username[0] || "U"}
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#090a0e]" />
        </div>

        {/* Role Pill */}
        <span className="text-[10px] font-mono tracking-widest font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 mb-1">
          {roleLabel}
        </span>

        {/* Username */}
        <p className="text-white text-sm font-bold tracking-tight">{username}</p>
        {email && <p className="text-zinc-500 text-xs mt-0.5 truncate max-w-[200px]">{email}</p>}
      </div>

      {/* ─── 2x3 Grid of Shortcuts ─── */}
      <div className="grid grid-cols-2 text-left">
        {/* Item 1: Dashboard */}
        <div
          onClick={() => handleNavigate("/reseller")}
          className="flex items-center gap-3 p-3.5 border-b border-r border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Dashboard</p>
          </div>
        </div>

        {/* Item 2: Downloads / Apps */}
        <div
          onClick={() => handleNavigate("/reseller/apps")}
          className="flex items-center gap-3 p-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Downloads</p>
          </div>
        </div>

        {/* Item 3: Resgatar / Gerar Key */}
        <div
          onClick={() => handleNavigate("/reseller/keys")}
          className="flex items-center gap-3 p-3.5 border-b border-r border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Minhas Keys</p>
          </div>
        </div>

        {/* Item 4: Área do Cliente / Catálogo */}
        <div
          onClick={() => handleNavigate("/reseller/apps")}
          className="flex items-center gap-3 p-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <AppWindow className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Softwares</p>
          </div>
        </div>

        {/* Item 5: Minhas Compras */}
        <div
          onClick={() => handleNavigate("/reseller/keys")}
          className="flex items-center gap-3 p-3.5 border-r border-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Compras</p>
          </div>
        </div>

        {/* Item 6: Perfil */}
        <div
          onClick={() => handleNavigate("/reseller")}
          className="flex items-center gap-3 p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/[0.12] transition-colors shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">Perfil</p>
          </div>
        </div>
      </div>

      {/* ─── Bottom Actions Bar ─── */}
      <div className="p-3 bg-white/[0.01] border-t border-white/[0.06] flex items-center justify-between">
        <button
          onClick={() => handleNavigate("/reseller")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configurações</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 transition-all"
          title="Sair da conta"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
