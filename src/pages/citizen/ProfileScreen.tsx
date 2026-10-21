import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAppState } from '../../lib/store'
import { useAuthUser } from '../../lib/authContext'
import Button from '../../components/ui/Button'
export default function ProfileScreen() {
  const navigate = useNavigate()
  const { citizen, updateNickname } = useAppState()
  const { user } = useAuthUser()
  const phone = user?.phoneNumber ?? 'Unknown number'
  const displayName = citizen.nickname || phone
  const initials = citizen.nickname ? citizen.nickname.slice(0, 2).toUpperCase() : (user?.phoneNumber?.slice(-2) ?? 'TT')

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(citizen.nickname)
  const [saving, setSaving] = useState(false)

  const startEditing = () => {
    setDraft(citizen.nickname)
    setEditing(true)
  }

  const saveNickname = async () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await updateNickname(trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pt-1">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center font-display font-semibold text-gold shrink-0">
          {initials}
        </div>
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={24}
              className="min-w-0 flex-1 bg-transparent border border-paper/20 rounded-lg px-2.5 py-1.5 text-sm font-display font-semibold text-paper focus-visible:outline-gold"
            />
            <Button onClick={saveNickname} disabled={saving || !draft.trim()} className="!py-1.5 !px-3 text-xs shrink-0">
              {saving ? '\u2026' : 'Save'}
            </Button>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold truncate">{displayName}</p>
              <button onClick={startEditing} className="text-paper/40 hover:text-paper/70 shrink-0" aria-label="Edit nickname">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </div>
            {citizen.nickname && <p className="text-xs text-paper/35">{phone}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-paper/10 p-3.5">
          <p className="tag text-paper/45 mb-1">SUBMITTED</p>
          <p className="font-display text-xl font-medium">{citizen.reportsSubmitted}</p>
        </div>
        <div className="rounded-xl border border-paper/10 p-3.5">
          <p className="tag text-paper/45 mb-1">VERIFIED</p>
          <p className="font-display text-xl font-medium">{citizen.reportsVerified}</p>
        </div>
      </div>

      <div className="rounded-xl border border-paper/10 p-3.5 mb-6">
        <p className="font-semibold text-sm">Rewards are coming soon</p>
        <p className="text-xs text-paper/50 mt-1">Verified report rewards will appear here after the reward service is configured.</p>
      </div>

      <button type="button" onClick={async () => { await signOut(auth); navigate('/') }} className="w-full min-h-11 mt-8 rounded-xl border border-paper/20 text-sm text-paper/75 hover:bg-paper/5">Sign out</button>
    </div>
  )
}
