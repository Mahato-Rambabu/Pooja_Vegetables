import { Request, Response, NextFunction } from 'express'
import type { GeoPoint } from '@pooja-vegetables/types'

// Haversine formula — calculates distance between two lat/lng points in km
const haversineKm = (a: GeoPoint, b: GeoPoint): number => {
  const R = 6371 // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return R * 2 * Math.asin(Math.sqrt(h))
}

// Middleware — attach to local customer order routes only
export const geoFenceCheck = (req: Request, res: Response, next: NextFunction): void => {
  const { location } = req.body as { location?: GeoPoint }

  if (!location?.lat || !location?.lng) {
    res.status(400).json({
      success: false,
      error: 'Location is required to place an order',
      code: 'LOCATION_MISSING',
    })
    return
  }

  const shopLocation: GeoPoint = {
    lat: parseFloat(process.env['SHOP_LAT'] ?? '18.5204'),
    lng: parseFloat(process.env['SHOP_LNG'] ?? '73.8567'),
  }

  const maxKm = parseFloat(process.env['MAX_DELIVERY_KM'] ?? '4')
  const distanceKm = haversineKm(shopLocation, location)

  if (distanceKm > maxKm) {
    res.status(400).json({
      success: false,
      error: `Sorry, we only deliver within ${maxKm} km. You are ${distanceKm.toFixed(1)} km away.`,
      code: 'GEO_OUT_OF_RANGE',
    })
    return
  }

  next()
}
