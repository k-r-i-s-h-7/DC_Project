import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.from("recent_searches").insert({
    user_id: body.user_id,
    city: body.city,
  })

  if (error) {
    console.log("Insert error:", error)
    return Response.json({ error }, { status: 500 })
  }

  return Response.json({ status: "ok" })
}
