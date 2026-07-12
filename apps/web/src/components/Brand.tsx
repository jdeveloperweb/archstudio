/**
 * Marca ArchStudio: um nó isométrico (o átomo de todo diagrama) com um pulso
 * de dados na aresta. O glifo funciona de 14px a 64px.
 */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* face superior */}
      <path d="M16 4 27 10.5 16 17 5 10.5Z" fill="#a679ff" fillOpacity="0.9" />
      {/* face esquerda */}
      <path d="M5 10.5 16 17v11L5 21.5Z" fill="#6b46c1" fillOpacity="0.85" />
      {/* face direita */}
      <path d="M27 10.5 16 17v11l11-6.5Z" fill="#8b5cf6" fillOpacity="0.55" />
      {/* pulso de dados saindo do nó */}
      <circle cx="27" cy="24" r="3" fill="#5ee7ff" />
      <path d="M21.5 20.2 24.8 22.2" stroke="#5ee7ff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = '', withMark = true }: { className?: string; withMark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      {withMark && <Mark />}
      <span>
        <span className="text-accent">Arch</span>
        <span className="text-ink">Studio</span>
      </span>
    </span>
  );
}
