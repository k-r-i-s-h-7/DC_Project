export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("http://127.0.0.1/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Feedback Error:", error)
    return Response.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
