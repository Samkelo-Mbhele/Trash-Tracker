import type { Timestamp } from 'firebase/firestore'

export function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return 'Just now'
  const date = ts.toDate()
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.round(diffHr / 24)
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}
