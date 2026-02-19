type BadgeVariant = 'current' | 'upcoming' | 'past' | 'default';

const VARIANTS: Record<BadgeVariant, string> = {
  current: 'bg-emerald-100 text-emerald-800',
  upcoming: 'bg-blue-100 text-blue-800',
  past: 'bg-zinc-100 text-zinc-600',
  default: 'bg-zinc-100 text-zinc-700',
};

export function Badge({ variant = 'default', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
