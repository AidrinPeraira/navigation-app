import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const start = searchParams.get("start"); // "lng,lat"
    const end = searchParams.get("end"); // "lng,lat"
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

    const mapboxRes = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
        `?steps=true&voice_instructions=true&banner_instructions=true` +
        `&geometries=geojson&overview=full&annotations=duration,distance` +
        `&access_token=${token}`,
    );

    if (!mapboxRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch navigation from Mapbox" },
        { status: 500 },
      );
    }

    const data = await mapboxRes.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No routes found" }, { status: 404 });
    }

    // Use the first (fastest) route
    const route = data.routes[0];

    // Map legs → steps with maneuver info
    const legs = route.legs.map((leg: any) => ({
      summary: leg.summary,
      distance: leg.distance,
      duration: leg.duration,
      steps: leg.steps.map((step: any) => ({
        distance: step.distance,
        duration: step.duration,
        name: step.name,
        instruction: step.maneuver.instruction,
        type: step.maneuver.type, // "turn", "depart", "arrive", etc.
        modifier: step.maneuver.modifier, // "left", "right", "straight", etc.
        bearing_after: step.maneuver.bearing_after,
      })),
    }));

    return NextResponse.json({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      legs,
    });
  } catch (error) {
    console.error("Navigation API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
