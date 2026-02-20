export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q");

  if (!query) {
    return Response.json({ places: [] });
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?` +
      `country=IN&` +
      `bbox=68,6,97,37&` +
      `autocomplete=true&limit=5&` +
      `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
  );

  const data = await response.json();
  const result = data.features.map((place: any) => {
    return {
      id: place.id,
      text: place.text,
      place_name: place.place_name,
      lng: place.center[0],
      lat: place.center[1],
      place_type: place.place_type,
    };
  });

  console.log("MapBox Result: ", result);
  return Response.json({ places: result });
}
