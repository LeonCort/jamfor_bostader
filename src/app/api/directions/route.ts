export const dynamic = "force-dynamic";

// Minimal proxy to Google Directions API to compute a single transit time (in minutes)
// Query params:
// - origin: string (address)
// - destination: string (address)
// - mode: 'transit' | 'driving' | 'bicycling' | 'walking' (default: 'transit')
// - arriveBy: 'HH:MM' optional (uses next Monday by default)
// - departAt: 'HH:MM' optional (ignored if arriveBy provided)
//
// Returns: { minutes: number }

function nextMondayAtLocalTime(hhmm: string): number {
  const [hh, mm] = hhmm.split(":" ).map((x) => parseInt(x, 10));
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun..6=Sat
  // Compute days to next Monday (1)
  const delta = ((8 - (day || 7)) % 7) || 7; // if Monday today, pick next Monday
  d.setDate(d.getDate() + delta);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const mode = (searchParams.get("mode") || "transit").toLowerCase();
  const arriveBy = searchParams.get("arriveBy");
  const departAt = searchParams.get("departAt");

  if (!origin || !destination) {
    return new Response("Missing origin or destination", { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return new Response("Missing Google Maps API key (set GOOGLE_MAPS_API_KEY)", { status: 500 });
  }

  const params: Record<string, string> = {
    origin,
    destination,
    mode,
    key,
  };

  // Prefer arrival_time for public transit when provided
  if (mode === "transit" && arriveBy) {
    params.arrival_time = String(nextMondayAtLocalTime(arriveBy));
  } else if (departAt) {
    // Use departure_time for any mode when provided (Directions API ignores for some modes)
    const [hh, mm] = departAt.split(":" ).map((x) => parseInt(x, 10));
    const d = new Date();
    d.setHours(hh || 0, mm || 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    params.departure_time = String(Math.floor(d.getTime() / 1000));
  } else if (mode === "transit") {
    params.departure_time = String(Math.floor(Date.now() / 1000));
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`Directions fetch failed: ${resp.status}`);
    const data = await resp.json();
    if (data.status !== "OK" || !data.routes?.length) {
      return Response.json({ minutes: null, status: data.status ?? "NO_ROUTE" }, { status: 200 });
    }
    const leg = data.routes[0]?.legs?.[0];
    const seconds = leg?.duration?.value;
    const minutes = seconds != null ? Math.round(seconds / 60) : null;
    return Response.json({ minutes, status: data.status });
  } catch (err: any) {
    return new Response(`Directions API error: ${err?.message ?? String(err)}`, { status: 500 });
  }
}

