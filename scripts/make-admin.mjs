import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const email = process.argv[2]?.trim()
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the service account key file path.')
  process.exit(1)
}

try {
  const app = initializeApp({ credential: applicationDefault() })
  const user = await getAuth(app).getUserByEmail(email)
  if (!user.emailVerified) {
    console.error('The user must verify their email before admin access can be granted.')
    process.exit(1)
  }

  const userRef = getFirestore(app).doc(`users/${user.uid}`)
  const profile = await userRef.get()
  await userRef.set(profile.exists ? { admin: true } : { admin: true, role: 'citizen' }, { merge: true })
  console.log(`Admin set for ${email}`)
} catch {
  console.error('Could not set admin. Check the service account credentials, project access, and email address.')
  process.exit(1)
}
