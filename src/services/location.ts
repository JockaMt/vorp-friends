export interface LocationResult {
  place_id?: number;
  osm_id?: number;
  osm_type?: string;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  importance?: number;
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.trim().length < 1) return [];

  try {
    const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      console.warn('[services/location] proxy returned', res.status);
      return [];
    }
    const data = await res.json();
    return data as LocationResult[];
  } catch (err) {
    console.error('[services/location] error', err);
    return [];
  }
}
