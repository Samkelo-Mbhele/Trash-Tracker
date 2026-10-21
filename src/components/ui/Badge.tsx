const styles: Record<string, string> = {
  neutral: 'bg-ink/8 text-ink/70',
  gold: 'bg-gold/18 text-gold',
  rust: 'bg-rust/15 text-rust',
  moss: 'bg-moss/15 text-moss',
  sky: 'bg-sky/15 text-sky',
}

export default function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: keyof typeof styles }) {
  return <span className={`tag px-2 py-1 rounded-full whitespace-nowrap ${styles[tone]}`}>{children}</span>
}
