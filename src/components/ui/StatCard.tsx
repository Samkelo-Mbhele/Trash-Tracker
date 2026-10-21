import Card from './Card'

export default function StatCard({ label, value, accent = 'text-ink' }: { label: string; value: string; accent?: string }) {
  return (
    <Card>
      <p className="tag text-ink/50 mb-2">{label}</p>
      <p className={`font-display text-3xl font-medium ${accent}`}>{value}</p>
    </Card>
  )
}
