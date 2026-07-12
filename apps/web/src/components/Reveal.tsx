'use client';
import { useEffect, useRef } from 'react';

/** Revela o conteúdo ao entrar na viewport (CSS .reveal → .is-in). */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
