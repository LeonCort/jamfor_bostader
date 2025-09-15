export const dynamic = "force-dynamic";

// Minimal DTO compatible with PropertyData plus source links
export type HemnetScrapeDto = {
  // Core
  price: number | null;
  monthlyFee: number | null;
  operatingCost: number | null;
  address: string | null;
  postort: string | null;
  kommun: string | null;
  region: string | null;
  livingArea: number | null;
  supplementalArea: number | null; // biarea
  landArea: number | null; // tomtarea
  rooms: number | null;
  constructionYear: number | null;
  squareMeterPrice: number | null;
  // Meta
  type: string | null; // housingForm.name
  tenure: string | null; // tenure.name
  energyClass: string | null; // A-G
  daysOnHemnet: number | null;
  timesViewed: number | null;
  labels: string[];
  // Media
  imageUrl: string | null; // primary/thumbnail
  images: string[]; // gallery
  floorPlans: string[];
  // Open house
  openHouses: { start: string; end: string; description?: string }[];
  // Sources
  hemnetUrl?: string;
  realtorUrl?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new Response("Missing url", { status: 400 });

  try {
    const html = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "sv,en;q=0.9",
      },
      // Next.js fetch defaults are fine; no need for cache here
    }).then((r) => {
      if (!r.ok) throw new Error(`Hemnet fetch failed: ${r.status}`);
      return r.text();
    });

    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return new Response("No __NEXT_DATA__", { status: 422 });

    const next = JSON.parse(m[1]);
    const state = next?.props?.pageProps?.__APOLLO_STATE__;
    const listingId = next?.props?.pageProps?.listingId;
    if (!state || !listingId) return new Response("Malformed state", { status: 422 });

    const listingKey = Object.keys(state).find(
      (k) => k.startsWith("ActivePropertyListing:") && k.endsWith(String(listingId))
    );
    if (!listingKey) return new Response("Listing node not found", { status: 422 });

    const l = state[listingKey];

    const municipalityName = l?.municipality?.__ref ? state[l.municipality.__ref]?.fullName ?? null : null;
    const regionName = l?.region?.__ref ? state[l.region.__ref]?.fullName ?? null : null;

    // Images
    const tn = l?.thumbnail ?? null;
    const imageUrl = tn?.['url({"format":"ITEMGALLERY_L"})'] ?? null;
    const imgs = l?.['images({"limit":300})']?.images ?? [];
    const images = imgs.map((im: any) => im?.['url({"format":"WIDTH1024"})']).filter(Boolean);
    const floorPlans = (l?.floorPlanImages ?? []).map((im: any) => im?.['url({"format":"WIDTH1024"})']).filter(Boolean);

    // Open houses
    const openHouses = (l?.upcomingOpenHouses ?? [])
      .map((r: any) => r?.__ref ? state[r.__ref] : null)
      .filter(Boolean)
      .map((oh: any) => ({
        start: new Date(Number(oh.start) * 1000).toISOString(),
        end: new Date(Number(oh.end) * 1000).toISOString(),
        description: oh.description ?? undefined,
      }));

    const dto: HemnetScrapeDto = {
      // Core
      price: l?.askingPrice?.amount ?? null,
      monthlyFee: l?.fee ?? null,
      operatingCost: l?.runningCosts ?? null,
      address: [l?.streetAddress, l?.postCode, l?.area].filter(Boolean).join(", ") || null,
      postort: l?.area ?? null,
      kommun: municipalityName,
      region: regionName,
      livingArea: l?.livingArea ?? null,
      supplementalArea: l?.supplementalArea ?? null,
      landArea: l?.landArea ?? null,
      rooms: l?.numberOfRooms ?? null,
      constructionYear: Number(l?.legacyConstructionYear) || null,
      squareMeterPrice: l?.squareMeterPrice ?? null,
      // Meta
      type: l?.housingForm?.name ?? null,
      tenure: l?.tenure?.name ?? null,
      energyClass: l?.energyClassification?.classification ?? null,
      daysOnHemnet: l?.daysOnHemnet ?? null,
      timesViewed: l?.timesViewed ?? null,
      labels: (l?.labels ?? []).map((x: any) => x?.identifier).filter(Boolean),
      // Media
      imageUrl,
      images,
      floorPlans,
      // Open house
      openHouses,
      // Sources
      hemnetUrl: l?.listingHemnetUrl ?? url,
      realtorUrl: l?.listingBrokerUrl ?? null,
    };

    return Response.json(dto);
  } catch (err: any) {
    return new Response(`Hemnet scrape error: ${err?.message ?? String(err)}`, { status: 500 });
  }
}

