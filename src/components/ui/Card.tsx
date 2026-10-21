export default function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`rounded-2xl border border-[--line] bg-paper p-5 ${className}`}>{children}</div>
}
