export interface LatLng {
  lat?: number
  lng?: number
}

export function distanceKm(from: LatLng, to: LatLng): number {
  if (from.lat === undefined || from.lng === undefined || to.lat === undefined || to.lng === undefined) return Infinity
  const radians = (degrees: number) => degrees * Math.PI / 180
  const dLat = radians(to.lat - from.lat)
  const dLng = radians(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
