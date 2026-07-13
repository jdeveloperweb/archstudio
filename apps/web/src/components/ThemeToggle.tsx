'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, MoonStar, Palette, Sun } from 'lucide-react';

type Choice = 'light' | 'dark' | 'midnight' | 'system';

const OPTIONS: { id: Choice; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon },
  { id: 'midnight', label: 'Meia-noite', icon: MoonStar },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

function resolve(choice: Choice): 'light' | 'dark' | 'midnight' {
  if (choice === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return choice;
}

function apply(choice: Choice) {
  const theme = resolve(choice);
  const el = document.documentElement;
  if (theme === 'light') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('light');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem('as-theme') as Choice) || 'light';
    setChoice(saved);
    // segue o SO quando em "Sistema"
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSys = () => {
      if ((localStorage.getItem('as-theme') as Choice) === 'system') apply('system');
    };
    mq.addEventListener('change', onSys);
    return () => mq.removeEventListener('change', onSys);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(id: Choice) {
    setChoice(id);
    localStorage.setItem('as-theme', id);
    apply(id);
    setOpen(false);
  }

  const Active = OPTIONS.find((o) => o.id === choice)?.icon ?? Palette;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-focus flex h-9 w-9 items-center justify-center rounded-lg text-dim transition hover:bg-panel2 hover:text-ink"
        aria-label="Tema"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Tema"
      >
        <Active size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className="surface absolute right-0 top-11 z-40 w-44 overflow-hidden p-1.5"
        >
          <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Tema</div>
          {OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = choice === id;
            return (
              <button
                key={id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(id)}
                className={`btn-focus flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                  active ? 'bg-accent/12 text-ink' : 'text-dim hover:bg-panel2 hover:text-ink'
                }`}
              >
                <Icon size={15} className={active ? 'text-accent' : ''} />
                {label}
                {active && <Check size={14} className="ml-auto text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
