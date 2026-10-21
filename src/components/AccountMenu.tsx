import { signOut } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { useAuthUser } from '../lib/authContext'
import { useAppState } from '../lib/store'

export default function AccountMenu() {
  const { user } = useAuthUser()
  const { admin } = useAppState()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <details className="relative">
      <summary className="min-h-10 cursor-pointer list-none rounded-full border border-current/25 px-3 py-2 text-xs font-medium">
        Account
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-2 text-left text-ink shadow-xl">
        {user?.email && <p className="truncate px-3 py-2 text-xs text-slate-500">{user.email}</p>}
        {admin && <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-emerald-50">Admin</Link>}
        <button onClick={handleSignOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Sign out</button>
      </div>
    </details>
  )
}
