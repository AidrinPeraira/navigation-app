import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const waypoints = searchParams.get("waypoints"); // optional: "lng,lat;lng,lat"

    if (!start || !end) {
      return NextResponse.json(
        { error: "Missing start or end coordinates" },
        { status: 400 },
      );
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Mapbox token not configured" },
        { status: 500 },
      );
    }

    // Build coordinate string: start;wp1;wp2;...;end
    const coords = waypoints
      ? `${start};${waypoints};${end}`
      : `${start};${end}`;

    // Mapbox disables alternatives when waypoints are present
    const alternatives = waypoints ? "false" : "true";

    const mapboxRes = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
        `?alternatives=${alternatives}&geometries=geojson&overview=full&access_token=${token}`,
    );

    if (!mapboxRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch route from Mapbox" },
        { status: 500 },
      );
    }

    const data = await mapboxRes.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No routes found" }, { status: 404 });
    }

    // Normalize to your RouteInfo type
    const routes = data.routes
      .sort((a: any, b: any) => a.duration - b.duration)
      .map((route: any) => ({
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
      }));

    return NextResponse.json({ routes });
  } catch (error) {
    console.error("Route API error:", error);

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
