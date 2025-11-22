export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")

  if (!city) {
    return Response.json({ error: "City parameter required" }, { status: 400 })
  }

  try {
    const response = await fetch(`http://localhost/plan?city=${encodeURIComponent(city)}&max_per_node=5`)
    const data = await response.json()

    return Response.json({
      city,
      itinerary: data.itinerary || [],
    })
  } catch (error) {
    console.error("API Error:", error)
    return Response.json({ error: "Failed to fetch itinerary" }, { status: 500 })
  }
}
