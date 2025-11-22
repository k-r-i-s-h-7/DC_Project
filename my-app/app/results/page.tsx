"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, Star, DollarSign, Loader } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface ItineraryItem {
  id?: number
  name: string
  city?: string
  location?: string
  rating?: number
  info?: string
  price?: number
  category?: string
  airline?: string
  date?: string
  type?: string
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const city = searchParams.get("city")
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (!city) return

    const fetchResults = async () => {
      console.log("Calling:", `http://127.0.0.1/plan?city=${city}`);

const response = await fetch(`http://localhost/plan?city=${encodeURIComponent(city)}`, {
  cache: "no-store",
});

console.log("Status:", response.status);

const data = await response.json();
console.log("DATA RECEIVED:", data);

setItinerary(data.itinerary || []);
  try {
    setLoading(true)
    const response = await fetch(`http://localhost/plan?city=${encodeURIComponent(city)}`, {
  cache: "no-store",
});
    const data = await response.json()
    setItinerary(data.itinerary || [])
  } catch (err) {
    setError("Failed to fetch results. Please try again.")
    console.error(err)
  } finally {
    setLoading(false)
  }
}


    fetchResults()
  }, [city])

  const handleFeedback = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    // Store city and itinerary in session for feedback page
    sessionStorage.setItem("feedbackCity", city || "")
    sessionStorage.setItem("feedbackItinerary", JSON.stringify(itinerary))
    router.push("/feedback")
  }

  return (
    <div className="min-h-screen blue-mesh-bg pb-20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TravelPlan</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Button onClick={handleFeedback} className="bg-primary hover:bg-primary/90">
                Leave Feedback
              </Button>
            )}
            <Link href="/">
              <Button variant="outline">Back Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Itinerary for <span className="text-primary">{city}</span>
        </h1>
        <p className="text-foreground/60 mb-8">
          Discover the best hotels, restaurants, events, transport, and attractions
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-foreground/60">Loading your itinerary...</p>
          </div>
        ) : error ? (
          <Card className="p-8 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </Card>
        ) : itinerary.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-foreground/60">No results found for {city}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itinerary.map((item, idx) => (
              <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow bg-white/95">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-foreground line-clamp-2">{item.name}</h3>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full whitespace-nowrap ml-2">
                      {item.category || item.type || "Item"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-foreground/70">
                    {item.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{item.city}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{item.rating} rating</span>
                      </div>
                    )}
                    {item.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>₹{item.price}</span>
                      </div>
                    )}
                    {item.airline && (
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">{item.airline}</p>
                      </div>
                    )}
                    {item.info && <p className="text-sm text-foreground/60 mt-2">{item.info}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
