export interface PropertyData {
  price: number | null;
  monthlyFee: number | null; // hyra/avgift per month
  operatingCost: number | null; // annual drift
  address: string | null;
  livingArea: number | null; // boarea (m²)
  rooms: number | null; // antal rum
  imageUrl: string | null;
}

function toNumberOrNull(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  // Remove spaces and normalize comma to dot
  const cleaned = s.replace(/\s+/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getFirst(params: URLSearchParams, keys: string[]): string | null {
  for (const k of keys) {
    const v = params.get(k);
    if (v != null && v !== "") return v;
  }
  // also try case-insensitive lookup by scanning all keys
  const lowerToActual = new Map<string, string>();
  params.forEach((_, key) => lowerToActual.set(key.toLowerCase(), key));
  for (const k of keys) {
    const actual = lowerToActual.get(k.toLowerCase());
    if (actual) {
      const v = params.get(actual);
      if (v != null && v !== "") return v;
    }
  }
  return null;
}

export function parsePropertyUrl(url: string): PropertyData | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const p = u.searchParams;

  const price = toNumberOrNull(getFirst(p, ["pris", "price", "Pris"]))
    ?? toNumberOrNull(getFirst(p, ["belopp", "summa"]));

  const monthlyFee = toNumberOrNull(getFirst(p, ["avgift", "manadsavg", "månadsavg", "manadsavgift", "monthlyfee"]))
    ?? toNumberOrNull(getFirst(p, ["avg", "avg_per_manad"]));

  // Drift: treat 0 as missing (null)
  const ocRaw = toNumberOrNull(getFirst(p, ["drift", "Drift", "driftskostnad", "driftkostnad", "driftskostnader"]));
  const operatingCost = ocRaw === 0 ? null : ocRaw;

  const address = getFirst(p, ["adress", "gatuadress", "Adress", "address", "gata"]); // already decoded by URL

  const livingArea = toNumberOrNull(getFirst(p, ["boarea", "Boarea", "area", "livingarea"]))
    ?? toNumberOrNull(getFirst(p, ["boyta", "yta"]));

  const rooms = toNumberOrNull(getFirst(p, ["antalrum", "rum", "rooms"]))
    ?? toNumberOrNull(getFirst(p, ["rok", "r_o_k"]));

  const imageUrl = getFirst(p, ["bild", "Bild", "image", "imgurl", "imageurl"]) ?? null;

  const hasAny = [price, monthlyFee, operatingCost, address, livingArea, rooms, imageUrl]
    .some((v) => v != null);
  if (!hasAny) return null;

  return {
    price: price ?? null,
    monthlyFee: monthlyFee ?? null,
    operatingCost: operatingCost ?? null,
    address: address ?? null,
    livingArea: livingArea ?? null,
    rooms: rooms ?? null,
    imageUrl: imageUrl ?? null,
  };
}

