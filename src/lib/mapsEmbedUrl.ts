export type LatLng = { lat: number; lng: number };

function ensureKey(key?: string): string | undefined {
  const k = key?.trim();
  return k && k.length > 0 ? k : undefined;
}

export function buildPlaceEmbedUrl(key: string, q: string): string {
  const params = new URLSearchParams({ key, q });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

export function buildViewEmbedUrl(key: string, center: LatLng, zoom = 21): string {
  const params = new URLSearchParams({ key, center: `${center.lat},${center.lng}`, zoom: String(zoom) });
  return `https://www.google.com/maps/embed/v1/view?${params.toString()}`;
}

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";

export function buildDirectionsEmbedUrl(
  key: string,
  origin: string,
  destination: string,
  mode: TravelMode = "transit"
): string {
  const params = new URLSearchParams({ key, origin, destination, mode });
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
}

export function pickEmbedKey(preferred?: string): string | undefined {
  // Prefer explicit prop, then NEXT_PUBLIC var, then any fallback known names
  const fromProp = ensureKey(preferred);
  if (fromProp) return fromProp;
  // Note: only NEXT_PUBLIC_* are exposed to client bundles. Others will be undefined in the browser.
  const publicEnv = ensureKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined);
  // Some projects may use a custom name; keep a best-effort fallback for server components passing it through.
  const custom = ensureKey((process.env as any)["google-map-api-key"] as string | undefined);
  return fromProp ?? publicEnv ?? custom;
}

