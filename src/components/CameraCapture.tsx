import { useCallback, useEffect, useRef, useState } from 'react'
import Button from './ui/Button'

type CameraState = 'initializing' | 'requesting' | 'live' | 'denied' | 'unsupported' | 'insecure' | 'error'
interface CameraCaptureProps { onCapture: (dataUrl: string) => void; capturedDataUrl: string | null; onRetake: () => void }

export default function CameraCapture({ onCapture, capturedDataUrl, onRetake }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const [state, setState] = useState<CameraState>('initializing')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [showSettingsHelp, setShowSettingsHelp] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async () => {
    stopStream()
    setReady(false)
    setMessage('')
    if (!window.isSecureContext) { setState('insecure'); return }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') { setState('unsupported'); return }
    setState('requesting')
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      } catch (err) {
        // Some mobile browsers reject facingMode constraints even when they
        // have a usable camera. Retry with the browser's default live camera.
        const name = err instanceof Error ? err.name : ''
        if (name !== 'OverconstrainedError' && name !== 'ConstraintNotSatisfiedError' && name !== 'TypeError') throw err
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) { stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; setState('error'); return }
      video.srcObject = stream
      await video.play()
      if (mountedRef.current) { setState('live'); setReady(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) }
    } catch (err) {
      if (!mountedRef.current) return
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') { setState('denied'); setMessage('Camera permission is required to report waste.') }
      else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') { setState('unsupported'); setMessage('No camera was found on this device.') }
      else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setState('error')
        setMessage('The camera could not start. Close other apps using it, then try again.')
      }
      else if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') { setState('error'); setMessage('This camera cannot meet the requested settings. Try again.') }
      else if (name === 'SecurityError') { setState('insecure'); setMessage('Camera access requires HTTPS or localhost.') }
      else { setState('error'); setMessage('The camera could not start. Check browser permissions and try again.') }
      stopStream()
    }
  }, [stopStream])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; stopStream() }
  }, [stopStream])

  const capture = () => {
    const video = videoRef.current
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 480 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) { setMessage('Photo capture failed. Try again.'); return }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.6))
    stopStream()
  }

  const retry = () => { onRetake(); void startCamera() }
  const statusText = state === 'initializing' ? 'Preparing camera...' : state === 'requesting' ? 'Camera permission required' : state === 'live' ? 'Camera ready' : state === 'denied' ? 'Camera permission needed' : state === 'unsupported' ? 'Camera unavailable' : state === 'insecure' ? 'Secure connection required' : 'The camera could not start'

  return <div>
    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-black relative flex items-center justify-center">
      <video ref={videoRef} className={`w-full h-full object-cover ${state === 'live' && !capturedDataUrl ? '' : 'hidden'}`} autoPlay playsInline muted onLoadedData={() => { if (videoRef.current?.videoWidth) setReady(true) }} />
      {capturedDataUrl && <img src={capturedDataUrl} alt="Captured waste report" className="absolute inset-0 w-full h-full object-cover" />}
      {!capturedDataUrl && state !== 'live' && <div className="text-center px-5">
        <p className="font-semibold mb-2">{statusText}</p>
        <p className="text-sm text-paper/65">{message || (state === 'unsupported' ? 'This browser or device cannot provide camera access.' : state === 'insecure' ? 'Camera access requires HTTPS or localhost.' : state === 'denied' ? 'Allow camera access in your browser settings, then try again.' : 'Camera testing is best done on a physical device.')}</p>
        {(state === 'initializing' || state === 'denied' || state === 'error') && <button type="button" onClick={() => void startCamera()} className="mt-3 min-h-11 text-gold underline">{state === 'initializing' ? 'Enable camera' : 'Try again'}</button>}
        {state === 'denied' && <><button type="button" className="mt-2 min-h-11 text-gold underline" onClick={() => {
          if (/Chrome/.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent)) window.open('chrome://settings/content/camera', '_blank', 'noopener,noreferrer')
          else setShowSettingsHelp(true)
        }}>Open camera settings</button>{showSettingsHelp && <p className="text-xs text-paper/50 mt-1">Open your browser or device settings, find this site&apos;s permissions, and allow camera access.</p>}</>}
      </div>}
      {!capturedDataUrl && state === 'live' && <span className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs">{ready ? 'Camera live' : 'Preparing preview...'}</span>}
    </div>
    {capturedDataUrl ? <><p className="text-sm text-green-300 mb-2">Photo captured</p><button type="button" onClick={retry} className="min-h-11 text-sm text-gold underline">Retake</button></> : state === 'live' && <Button type="button" onClick={capture} disabled={!ready} className="w-full min-h-14">{ready ? 'Take photo' : 'Preparing camera...'}</Button>}
  </div>
}

