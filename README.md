# Trash Tracker — Frontend

A build-stage, multi-portal React + TypeScript + Tailwind app, backed by
Firebase Auth and Firestore. It reads real Firestore reports and does not
generate sample reports, crews, parks, or wallet transactions. Several
planned services are not connected yet (rewards, AI photo
classification, address lookup, and measured waste impact):

- **Citizen app** (`/citizen`) — mobile-first, email/password sign-in,
  nickname at sign-up, map of real geotagged reports, camera/GPS report
  flow, wallet history, and a profile screen.
- **Company portal** (`/company/overview`) — internal build-stage dashboard
  with green-belt records and an exportable all-reports view.
- **Operations portal** (`/operations/dispatch`) — same responsive
  dashboard shell: a dispatch queue where you select a ticket and assign
  it to an available crew (which updates the ticket's status and the
  crew's availability), a crew roster, and pilot analytics.

Submitting a citizen report writes it to Firestore, which the operations
review queue picks up live. Reports must be reviewed before dispatch; no
reward is issued.
Assigning a crew updates that report's status everywhere it's shown.
Changing a green belt's tier updates its Firestore record. All of this goes
through `src/lib/store.tsx`, which wraps Firestore's real-time
listeners (`onSnapshot`) behind the shared `useAppState()` hook.

## Built mobile-first

The citizen app is meant to be used on a phone, so it's built that way:
`CitizenShell` (`src/layouts/CitizenShell.tsx`) is full-bleed at every
screen size — no device mockup, no floating "phone preview" card, no dark
backdrop around it. The background fills the whole viewport; only the
content column is capped at a comfortable reading width (`max-w-md`) so
text and buttons don't stretch oddly wide on a desktop browser, with
safe-area padding for notches and a sticky header/bottom-tab-bar either
way. The company/operations dashboards follow the same real-app-not-mockup
idea: a left sidebar on desktop that collapses to a top bar + horizontal
tab strip below the `md:` breakpoint, rather than squeezing a 256px
sidebar onto a 375px phone screen.

## Build-stage status

Report submission, GPS capture, Firebase storage, the live report map,
crew assignment, manual review, and cleanup status updates are wired to
Firebase. The review flow is build-stage and is not protected by
server-side role enforcement. No reward is issued. AI classification,
reverse-geocoded addresses, measured weight, reward redemption, and
production access control need backend services and are not active. The
operations and company portals are internal build tools and are not
configured for external clients.

## Getting started

Authentication is handled by [Firebase](https://firebase.google.com) using
Email/Password for all three portals.
You need a free Firebase project before the app will run:

1. Go to the [Firebase Console](https://console.firebase.google.com),
   click **Add project**, and follow the prompts (Google Analytics is
   optional — you can turn it off).
2. Once the project's created, click the **Web** icon (`</>`) on the
   project overview page to register a web app. Give it any nickname —
   you don't need Firebase Hosting for this.
3. Firebase will show you a `firebaseConfig` object. Copy each value from
   it — you'll need `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, and `appId`.
4. `cp .env.example .env.local` and paste those values in against the
   matching `VITE_FIREBASE_...` keys.
5. In the Firebase Console sidebar, go to **Build → Authentication →
   Get started**, then under **Sign-in method** enable:
   - **Email/Password** — for citizen, company, and operations portals
6. Go to **Build → Firestore Database → Create database** (any region,
   start in **production mode**). Then publish the rules in
   [firestore.rules](firestore.rules): run
   `firebase deploy --only firestore:rules`, or paste the file into the
   **Rules** tab and press Publish.
7. Make yourself an admin: in Firestore, open your own document under
   `users` and add a boolean field `admin` set to `true`. Admins approve
   operations accounts at `/admin` by linking each one to a municipality
   (see `src/lib/municipalities.ts`); until then an operations account only
   sees a "Waiting for approval" screen.
8. Tag older records. Municipal accounts query reports and crews by their
   saved `municipalityId`, and the security rules only see that saved
   field. A report or crew created before municipalities existed has none,
   so **no municipal account can see or change it** until an admin opens
   `/admin` and presses **Tag older records** (the page shows a red warning
   while any untagged records remain). Do this straight after publishing
   the rules. New crews added by hand in the Firebase console need a
   `municipalityId` field (for example `ethekwini`) for the same reason.

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173) — you'll land
on the home page. "Get started" / "Sign in" takes you to `/start`, the
portal picker. Picking a portal takes you to that portal's sign-in page;
"sign up" from there creates an account and lands you straight in that
portal's home screen.

### How portal roles work right now

There's no full backend yet, so role assignment is intentionally simple:
the **first portal an account ever signs into is the only portal it can
use**. The first time a signed-in account is seen, `PortalGate`
(`src/components/PortalGate.tsx`) writes a `role` field to that user's
`/users/{uid}` Firestore document; every visit after that reads it back —
an account that already claimed "citizen" gets bounced to `/start` if it
tries to open a company or operations URL directly \u2014 with a visible banner
explaining why and offering a one-click sign-out, not a silent redirect
(`PortalGate` passes the reason via route state, `PortalPicker` renders it).

This is a pilot-stage simplification, not a real permission system: the
Firestore rule above only checks that you're reading/writing *your own*
document, not what role you're allowed to claim — fine for keeping demo
accounts apart, not something to trust once there's real money or data
behind these roles. When the fuller backend lands (see the requirements
spec), have a Cloud Function set the role server-side after signup instead
of trusting the client's first write.

## The real data model

Everything the app reads and writes is a real Firestore collection —
nothing is generated in the browser and thrown away on refresh:

| Collection | What's in it | Written by |
|---|---|---|
| `reports` | Every waste report: type, location, review decision, cleanup status, reporter, real GPS (`lat`/`lng`) when granted, a compressed photo thumbnail | Citizens (`submitReport`), operations staff (`reviewReport`/`assignCrew`/`markCleared`) |
| `crews` | Operational crews and current status/assignment | Provisioned as real Firebase records and updated by operations staff |
| `greenBelts` | Real parks/green belts and sponsorship tier | Provisioned as real Firebase records and updated by company staff |
| `users/{uid}` | One doc per account: `role`; `orgName` for company/operations accounts (set at sign-up); citizen profile fields (`nickname`, `points`, `reportsSubmitted`, ...) for citizen accounts | `PortalGate` (role), `EmailAuthPage` (orgName), `submitReport` (report count), `updateNickname` |
| `users/{uid}/wallet` | That citizen's own transaction history; reward writing is not connected | None in the current build |

**No demo records are generated by the client.** Empty `crews` and
`greenBelts` collections stay empty until real records are provisioned in
Firebase. Removing client-side seeding does not delete documents already
stored in Firebase.

**Report IDs:** each report has a Firestore document ID and a display ID
derived from that document ID. Both identify the same real report; store
actions use the Firestore document ID.

**Sign-up strength:** company/operations accounts require a password
meeting all five rules shown live at sign-up (8+ characters, upper,
lower, number, symbol), and Firebase sends a real verification email
before `PortalGate` lets them into the dashboard — see `EmailAuthPage.tsx`
and the `VerifyEmailNotice` inside `PortalGate.tsx`. Citizen accounts use
email/password and provide a nickname at sign-up; the nickname is editable
from the profile screen (`updateNickname` in `store.tsx`).

If a screen loads and nothing shows up (empty map or dispatch queue),
first check that the corresponding real Firestore records exist, then check
the browser console for a Firestore `permission-denied` — it usually means
the security rules above haven't been published yet, or don't match what's
in this README.

## Structure

```
src/
  lib/
    types.ts        shared domain types (Report, Crew, GreenBelt, ...)
    mapConfig.ts       default map viewport only; never used as report coordinates
    format.ts          formats Firestore Timestamps as "2m ago" / "Yesterday" / etc.
    store.tsx        global app state (React Context) wrapping Firestore `onSnapshot` + real writes
    firebase.ts       initializes the Firebase app, exports `auth` + `db`
    authContext.tsx    tracks Firebase sign-in state app-wide (`useAuthUser`)
  components/
    ui/                 Button, Badge, Card, StatCard, Logo
    PortalGate.tsx       route guard: requires sign-in + checks/claims portal role + initializes citizen profile defaults
    CameraCapture.tsx     real getUserMedia live camera + snapshot (no gallery/file picker)
    LeafletMap.tsx         reusable Leaflet + OpenStreetMap component \u2014 colored marker pins or a real heatmap layer (leaflet.heat), used on the citizen map, operations dispatch, and the home page's live preview
  layouts/
    CitizenShell.tsx    citizen app shell — full-bleed at every screen size, capped content width, bottom tab nav
    DashboardLayout.tsx  responsive shell for company & operations — sidebar on desktop, top bar + tab strip on mobile
  pages/
    Home.tsx              marketing-style landing page, loads at "/"
    PortalPicker.tsx        "/start" — choose citizen / company / operations
    auth/
      portalAuthConfig.ts    per-portal accent color, paths, redirect targets
      EmailAuthPage.tsx        email/password for all portals
    citizen/             MapScreen, ReportScreen, WalletScreen, ProfileScreen
    company/              Overview, Sponsorships, Reports
    operations/           Dispatch, Crews, Analytics
  App.tsx                 all routes (react-router-dom)
  main.tsx                 wraps the app in <AuthProvider>
```

## Design tokens

Colors and fonts live in `tailwind.config.js`:
`ink` `#10201A` · `paper` `#EEF0E2` · `moss` `#2F5233` (operations) ·
`gold` `#D9A441` (citizen/rewards) · `sky` `#3F7387` (company/ESG) ·
`rust` `#B5502E` (alerts). Fonts: **Plus Jakarta Sans** (display/headings) +
**Inter** (UI/body) + **IBM Plex Mono** (small-caps labels), loaded via
Google Fonts in `index.html`.

## Next steps

- Security rules live in [firestore.rules](firestore.rules). They limit
  municipal accounts to reading and changing reports and crews in their
  own municipality, but have not been run against the Firestore emulator
  yet (it needs a newer Java than 8). Check them in the console's Rules
  Playground before publishing.
- Auth is real (Firebase) — see "How portal roles work right now" above
  for the current pilot-stage limitation (one role per account, trusted on
  the client's first write) and what to replace it with once there's a
  fuller backend.
- The citizen screens here are a web preview of the phone UI. Camera and
  GPS are now genuinely real in the browser (`CameraCapture.tsx` uses
  `getUserMedia` for a live feed and snapshot, no gallery/file picker at
  all; `geolocation.ts` asks for the device's real coordinates at the
  review step) — but a **web** camera/GPS prompt is still weaker than
  what the shipped native app needs: a user can deny permission (the app
  falls back to the selected park's known coordinates so the report still
  gets a pin, but that's not a true GPS lock), and there's no way to stop
  someone using a virtual camera driver the way native EXIF/GPS locking
  can. For the actual shipped citizen app, port these screens into the
  Ionic/Angular + Capacitor build for that stronger guarantee — Firebase
  has an official AngularFire integration, so `firebase.ts` and
  `authContext.tsx` port over conceptually even if the components don't.
  **Both getUserMedia and geolocation require HTTPS** (or `localhost`) —
  they'll silently fail on a plain `http://` deployment.
- The captured photo is stored as a small compressed JPEG (max ~480px
  wide) directly on the report's Firestore document (`photoThumbnail`,
  a base64 data URL) — deliberately low-res so it stays well under
  Firestore's 1MB document limit without needing Firebase Storage set up.
  Good enough to confirm a report is real; not a substitute for
  full-resolution photo storage. When you're ready for that, add Firebase
  Storage (a new console step) and switch `submitReport` to upload the
  full image there instead, keeping just a URL on the report doc.
- The map (`MapScreen`, operations `Dispatch`) is real now — Leaflet +
  OpenStreetMap tiles, free, no API key, no Google Maps/Mapbox billing
  account, per the cost estimate in the pitch deck. Pins use a report's
  real captured GPS when available, falling back to its named park's
  known coordinates otherwise.
- Add staff-level roles *within* the operations portal (admin / driver /
  supervisor) once there's a backend to check them against — right now
  `PortalGate` only distinguishes citizen/company/operations, not roles
  inside a portal.
- Before the pilot goes live with real citizens, move the Firebase project
  from **Spark** to **Blaze** (pay-as-you-go) so phone numbers outside your
  test list actually receive real SMS codes — see the pitch deck's cost
  estimate for what that runs to at pilot volume.
