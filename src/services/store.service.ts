import * as storeRepository from '../repositories/store.repository';
import type { Store } from '../types/domain';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function list(lat?: number, lng?: number): Promise<Store[]> {
  const stores = await storeRepository.findAll();

  if (lat === undefined || lng === undefined) {
    return stores.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  return stores
    .map((store) => ({
      ...store,
      distanceKm: Math.round(haversineKm(lat, lng, store.lat, store.lng) * 10) / 10,
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
