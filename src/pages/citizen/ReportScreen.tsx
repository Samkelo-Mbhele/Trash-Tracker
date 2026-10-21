import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../../lib/store'
import Button from '../../components/ui/Button'
import CameraCapture from '../../components/CameraCapture'
import { getCurrentPosition, type Coords } from '../../lib/geolocation'
import type { WasteType } from '../../lib/types'

const wasteTypes: WasteType[] = ['Plastic', 'Organic', 'Hazardous']

export default function ReportScreen() {
  const navigate = useNavigate()
  const { submitReport } = useAppState()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [photo, setPhoto] = useState<string | null>(null)
  const [capturedAt, setCapturedAt] = useState<Date | null>(null)
  const [wasteType, setWasteType] = useState<WasteType>('Plastic')
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locking' | 'locked' | 'denied'>('idle')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 2 || coords || gpsStatus !== 'idle') return
    setGpsStatus('locking')
    getCurrentPosition().then((position) => { setCoords(position); setGpsStatus('locked') }).catch((error) => {
      console.error('Location lookup failed:', error)
      setGpsStatus('denied')
    })
  }, [step, coords, gpsStatus])

  const area = coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : ''

  if (submittedId) return <div className="pt-10 flex flex-col items-center text-center">
    <div className="w-14 h-14 rounded-full bg-gold/18 flex items-center justify-center mb-4 text-gold text-2xl"></div>
    <h1 className="font-display text-2xl font-semibold mb-2">Report submitted!</h1>
    <p className="text-sm text-paper/70 mb-2">Report ID: <span className="text-gold">{submittedId}</span></p>
    <p className="text-sm text-paper/60 mb-6">Pending verification. Any reward will be issued after the report is verified.</p>
    <Button onClick={() => navigate('/citizen/wallet')}>View wallet</Button>
  </div>

  return <div className="pt-1">
    <div className="flex items-center gap-2 mb-5" aria-label={`Step ${step} of 4`}>{[1, 2, 3, 4].map((n) => <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-gold' : 'bg-paper/15'}`} />)}</div>

    {step === 1 && <section>
      <p className="tag text-gold mb-2">STEP 1  |  CAPTURE</p>
      <h1 className="font-display text-2xl font-semibold mb-1">Capture the waste</h1>
      <p className="text-sm text-paper/65 mb-4">Take a live photo of the waste you want to report.</p>
      <CameraCapture capturedDataUrl={photo} onCapture={(image) => { setPhoto(image); setCapturedAt(new Date()) }} onRetake={() => { setPhoto(null); setCapturedAt(null) }} />
      <p className="text-sm text-paper/65 mt-4">Location will be checked next. Camera access is used only to take the report photo.</p>
      {photo && <Button onClick={() => setStep(2)} className="w-full mt-4 min-h-12">Use this photo</Button>}
    </section>}

    {step === 2 && <section>
      <p className="tag text-gold mb-2">STEP 2  |  LOCATION</p>
      <h1 className="font-display text-2xl font-semibold mb-4">Verify your location</h1>
      <div className="rounded-2xl border border-paper/15 p-4 mb-4">
        <p className="text-xs uppercase tracking-wider text-paper/50">Current area</p>
        {gpsStatus === 'locking' && <p className="mt-2">Checking GPS...</p>}
        {gpsStatus === 'locked' && coords && <><p className="mt-2 text-lg font-semibold">{area}</p><p className="text-sm text-green-300 mt-1"> GPS coordinates captured</p><p className="text-xs text-paper/50 mt-1">GPS accuracy: about {Math.round(coords.accuracy)} m</p></>}
        {gpsStatus === 'denied' && <><p className="mt-2 text-sm">Location access is needed to verify this report.</p><button className="text-gold underline mt-3 min-h-11" onClick={() => { setCoords(null); setGpsStatus('idle') }}>Try location again</button></>}
      </div>
      <Button onClick={() => setStep(3)} disabled={!coords} className="w-full min-h-12">Continue</Button>
    </section>}

    {step === 3 && <section>
      <p className="tag text-gold mb-2">STEP 3  |  IDENTIFY</p>
      <h1 className="font-display text-2xl font-semibold mb-2">What kind of waste?</h1>
      <p className="text-sm text-paper/65 mb-4">Automatic photo classification is not connected yet. Choose the closest match.</p>
      <div className="grid gap-2 mb-5">{wasteTypes.map((type) => <button key={type} type="button" aria-pressed={wasteType === type} onClick={() => setWasteType(type)} className={`text-left px-4 py-4 min-h-14 rounded-2xl border ${wasteType === type ? 'border-gold bg-gold/10 text-gold' : 'border-paper/20'}`}>{type}</button>)}</div>
      <Button onClick={() => setStep(4)} className="w-full min-h-12">Review report</Button>
    </section>}

    {step === 4 && <section>
      <p className="tag text-gold mb-2">STEP 4  |  REVIEW</p>
      <h1 className="font-display text-2xl font-semibold mb-4">Review your report</h1>
      {photo && <img src={photo} alt="Waste report preview" className="w-full aspect-[4/3] object-cover rounded-2xl mb-4" />}
      <div className="rounded-2xl border border-paper/15 p-4 mb-4 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-paper/55">Waste type</span><span>{wasteType}</span></div>
        <div className="flex justify-between"><span className="text-paper/55">Location</span><span>{area}</span></div>
        <div className="flex justify-between"><span className="text-paper/55">Captured</span><span>{capturedAt?.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-paper/55">Status</span><span>Pending verification</span></div>
        <div className="flex justify-between"><span className="text-paper/55">Reward</span><span className="text-paper/70">Coming soon</span></div>
      </div>
      {submitError && <p role="alert" className="text-sm text-red-300 mb-3">{submitError}</p>}
      <Button onClick={async () => {
        if (!coords || !photo) return
        setSubmitting(true); setSubmitError('')
        try { const report = await submitReport(wasteType, area, { lat: coords.lat, lng: coords.lng, photoThumbnail: photo }); setSubmittedId(report.displayId) }
        catch (error) { console.error('Report submission failed:', error); setSubmitError('Your report could not be submitted. Check your connection and try again.') }
        finally { setSubmitting(false) }
      }} disabled={submitting || !coords || !photo} className="w-full min-h-12">{submitting ? 'Submitting...' : 'Submit report'}</Button>
    </section>}
  </div>
}
