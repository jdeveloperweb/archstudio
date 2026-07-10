export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-mono font-bold tracking-tight ${className}`}>
      <span className="text-accent">Arch</span>
      <span className="text-ink">Studio</span>
    </span>
  );
}
