import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  color: string
  label?: string
}

export interface HeatPoint {
  lat: number
  lng: number
  /** Relative intensity, 0\u20131 \u2014 defaults to 0.6 if omitted. */
  weight?: number
}

interface LeafletMapProps {
  center: [number, number]
  zoom?: number
  markers?: MapMarker[]
  /** Renders a heat/density layer instead of (or alongside) pin markers. */
  heatPoints?: HeatPoint[]
  className?: string
  onMarkerClick?: (id: string) => void
  /** Hides zoom controls \u2014 useful for small decorative previews. */
  interactive?: boolean
}

/**
 * Free \u2014 OpenStreetMap tiles, no API key, no billing account. Markers are
 * plain colored div-icons (no image assets), so there's nothing for Vite's
 * bundler to mis-resolve the way it classically does with Leaflet's default
 * marker PNGs.
 */
export default function LeafletMap({
  center,
  zoom = 13,
  markers = [],
  heatPoints,
  className,
  onMarkerClick,
  interactive = true,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: interactive,
      // OpenStreetMap's usage policy requires attribution regardless of
      // whether the map itself is interactive \u2014 always keep this on.
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Leaflet sometimes computes its size before the flex/rounded-corner
    // container around it has settled into its final layout \u2014 that's a
    // classic cause of the map (and the whole page) overflowing sideways
    // on mobile. Re-measuring a beat later fixes it without a visible jump.
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100)
    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(containerRef.current)

    return () => {
      window.clearTimeout(resizeTimer)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recenter if the caller moves the target (e.g. GPS lock resolves).
  useEffect(() => {
    mapRef.current?.setView(center, zoom)
  }, [center, zoom])

  // Heat layer \u2014 added/removed/redrawn whenever the points change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    if (heatPoints && heatPoints.length > 0) {
      const points: Array<[number, number, number]> = heatPoints.map((p) => [p.lat, p.lng, p.weight ?? 0.6])
      heatLayerRef.current = L.heatLayer(points, {
        radius: 28,
        blur: 22,
        maxZoom: 16,
        gradient: { 0.3: '#3F7387', 0.55: '#D9A441', 0.8: '#B5502E', 1: '#B5502E' },
      }).addTo(map)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatPoints])

  // Redraw markers whenever the data changes, without recreating the map.
  useEffect(() => {
    const layer = markerLayerRef.current
    if (!layer) return
    layer.clearLayers()
    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${m.color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      const marker = L.marker([m.lat, m.lng], { icon })
      if (m.label) {
        const popupContent = document.createElement('span')
        popupContent.textContent = m.label
        marker.bindPopup(popupContent)
      }
      if (onMarkerClick) marker.on('click', () => onMarkerClick(m.id))
      marker.addTo(layer)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers])

  return <div ref={containerRef} className={className} />
}
