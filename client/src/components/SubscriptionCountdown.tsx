import { useEffect, useState } from "react";
import { Clock, CalendarClock, Infinity as InfinityIcon } from "lucide-react";

function useCountdown(expiresAt?: Date | string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const exp = expiresAt ? new Date(expiresAt).getTime() : null;
  const remaining = exp ? Math.max(0, exp - now) : null;
  if (remaining == null) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: null as number | null, exp: null as number | null };
  const total = Math.floor(remaining / 1000);
  return {
    expired: remaining <= 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
    exp,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Linha compacta: "29d 14h 32m 05s" com ícone de relógio */
export function SubscriptionCountdownInline({ expiresAt }: { expiresAt?: Date | string | null }) {
  const c = useCountdown(expiresAt);
  if (c.expired) {
    return <span className="text-red-400 font-mono font-bold">Expirada — renove para reativar</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-violet-300">
      <Clock className="w-3.5 h-3.5 text-violet-400" />
      {c.days > 0 && <span>{c.days}d</span>}
      <span>{pad(c.hours)}h</span>
      <span>{pad(c.minutes)}m</span>
      <span>{pad(c.seconds)}s</span>
    </span>
  );
}

/** Painel grande com relógio ao vivo + data de expiração */
export function SubscriptionPanel({ expiresAt, compact = false }: { expiresAt?: Date | string | null; compact?: boolean }) {
  const c = useCountdown(expiresAt);
  const expDate = c.exp ? new Date(c.exp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
          <CalendarClock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Assinatura</p>
          {c.expired ? (
            <p className="text-red-400 font-bold text-sm">Expirada — peça renovação ao admin</p>
          ) : (
            <p className="text-white font-bold font-mono text-sm leading-tight mt-0.5">
              {c.days > 0 && `${c.days}d `}{pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}
              <span className="block text-[10px] font-normal text-violet-300/80">expira em {expDate}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <InfinityIcon className="w-4 h-4 text-violet-400" />
        <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Assinatura Unlimited</p>
      </div>
      {c.expired ? (
        <div>
          <p className="text-3xl font-bold text-red-400 font-mono mb-2">Expirada</p>
          <p className="text-zinc-400 text-xs">Sua assinatura terminou. Peça ao administrador para renovar e reativar seu acesso.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3">
            {[
              { v: c.days, l: "dias" },
              { v: c.hours, l: "horas" },
              { v: c.minutes, l: "min" },
              { v: c.seconds, l: "seg" },
            ].map(({ v, l }) => (
              <div key={l} className="min-w-[64px] px-3 py-2.5 rounded-xl bg-black/40 border border-violet-500/20">
                <p className="text-2xl sm:text-3xl font-bold text-white font-mono leading-none tabular-nums">{pad(v)}</p>
                <p className="text-[10px] text-violet-300/80 uppercase tracking-wider mt-1">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-400 text-xs">
            Expira em <span className="text-white font-medium">{expDate}</span>
          </p>
          <p className="text-zinc-500 text-[11px] mt-1">Após o vencimento sua conta fica inativa até a renovação pelo administrador.</p>
        </>
      )}
    </div>
  );
}
