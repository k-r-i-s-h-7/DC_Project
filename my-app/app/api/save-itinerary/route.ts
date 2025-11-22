import { createClient } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient()

    const { error } = await supabase.from("saved_itineraries").insert({
      user_id: body.user_id,
      city: body.city,
      itinerary: body.itinerary,
    })

    if (error) {
      console.error("Supabase insert error:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ status: "ok" })
  } catch (err) {
    console.error("Route error:", err)
    return Response.json({ error: "Server crashed" }, { status: 500 })
  }
}
