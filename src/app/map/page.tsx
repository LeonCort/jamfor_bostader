import { AccommodationsScaffold } from "@/components/accommodations/AccommodationsScaffold";

export default function MapPage() {
  // Prefer explicit custom env name the user mentioned, then standard NEXT_PUBLIC_ fallback
  const mapsApiKey = (process.env as any)["google-map-api-key"] ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return <AccommodationsScaffold mapsApiKey={mapsApiKey} />;
}

