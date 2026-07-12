'use client';
import { useEffect, useRef } from 'react';

/**
 * Campo de parallax: filhos com [data-depth] deslocam com o scroll
 * (profundidade positiva = mais lento, flutua para cima ao rolar) e
 * [data-mouse] seguem o ponteiro. Um único rAF; respeita reduced motion.
 */
export function ParallaxField({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = ref.current!;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-depth], [data-mouse]'));
    els.forEach((el) => el.classList.add('plx'));
    let raf = 0;
    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;

    const apply = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const sy = -r.top; // quanto o campo já rolou
      mx += (tmx - mx) * 0.08;
      my += (tmy - my) * 0.08;
      for (const el of els) {
        const d = parseFloat(el.dataset.depth || '0');
        const m = parseFloat(el.dataset.mouse || '0');
        el.style.transform = `translate3d(${(mx * 28 * m).toFixed(1)}px, ${(sy * d + my * 20 * m).toFixed(1)}px, 0)`;
      }
      if (Math.abs(tmx - mx) + Math.abs(tmy - my) > 0.002) schedule();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onScroll = () => schedule();
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      tmx = 0;
      tmy = 0;
      schedule();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
