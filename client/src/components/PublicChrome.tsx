import { Link } from "wouter";

export const DEFAULT_DISCORD_URL = "https://discord.gg/vgseller";

export function PublicNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center text-[10px] font-black tracking-tight">VG</div>
            <span className="text-white text-xs font-bold tracking-[0.2em] uppercase">Sellers</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/rules">
            <span className="text-[11px] font-semibold tracking-[0.15em] text-zinc-500 hover:text-white transition-colors uppercase cursor-pointer">
              Rules
            </span>
          </Link>
          <Link href="/login">
            <span className="text-[11px] font-semibold tracking-[0.15em] text-zinc-300 hover:text-white border border-white/15 hover:border-white/40 rounded-md px-3 py-1.5 transition-all uppercase cursor-pointer">
              Sign In
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter({ discord = DEFAULT_DISCORD_URL }: { discord?: string }) {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center text-[8px] font-black">VG</div>
          <span className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Sellers</span>
        </div>
        <nav className="flex items-center gap-5">
          <a href={discord} target="_blank" rel="noreferrer" className="text-[10px] font-semibold tracking-[0.15em] text-zinc-600 hover:text-zinc-300 uppercase transition-colors">Discord</a>
          <Link href="/rules"><span className="text-[10px] font-semibold tracking-[0.15em] text-zinc-600 hover:text-zinc-300 uppercase cursor-pointer transition-colors">Rules</span></Link>
          <Link href="/login"><span className="text-[10px] font-semibold tracking-[0.15em] text-zinc-600 hover:text-zinc-300 uppercase cursor-pointer transition-colors">Sign In</span></Link>
        </nav>
      </div>
    </footer>
  );
}
