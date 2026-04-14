import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Parâmetros lat e lng são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`,
      {
        headers: { "User-Agent": "RadarLocal/1.0 (contato@radarlocal.com)" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`Nominatim respondeu ${res.status}`);
    }

    const data = await res.json();
    const a = data.address ?? {};

    const parts = [
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);

    const address =
      parts.join(", ") ||
      data.display_name ||
      `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;

    return NextResponse.json({ address });
  } catch {
    return NextResponse.json(
      { address: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` }
    );
  }
}
