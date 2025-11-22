"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, Star, DollarSign, Loader, Heart, MessageSquare, ArrowLeft, Bookmark } from "lucide-react"
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
  const [isVisible, setIsVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
      try {
        setLoading(true)
        const response = await fetch(`http://127.0.0.1/plan?city=${encodeURIComponent(city)}`, {
          cache: "no-store",
        });
        const data = await response.json()
        setItinerary(data.itinerary || [])
        setIsVisible(true)
        if (user) {
          await fetch("/api/save-search", {
            method: "POST",
            body: JSON.stringify({
              user_id: user.id,
              city,
            }),
          })
        }
      } catch (err) {
        setError("Failed to fetch results. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [city])

  const saveItinerary = async () => {
    if (!user) return router.push("/login")
    
    setIsSaving(true)
    try {
      await fetch("/api/save-itinerary", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          city,
          itinerary,
        }),
      })
      alert("Saved!")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFeedback = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    sessionStorage.setItem("feedbackCity", city || "")
    sessionStorage.setItem("feedbackItinerary", JSON.stringify(itinerary))
    router.push("/feedback")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-20 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
              <Plane className="w-6 h-6 text-white transform -rotate-45" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              PlanMyTrip
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <Button 
                onClick={handleFeedback} 
                variant="ghost"
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Leave Feedback
              </Button>
            )}
            <Link href="/">
              <Button variant="outline" className="border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Results Section */}
      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-3">
              Itinerary for <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{city}</span>
            </h1>
            <p className="text-slate-600 text-lg">
              Discover the best hotels, restaurants, events, transport, and attractions
            </p>
          </div>
          {!loading && itinerary.length > 0 && (
            <Button 
              onClick={saveItinerary}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Itinerary"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-slate-600 text-lg font-medium">Loading your itinerary...</p>
            <p className="text-slate-500 text-sm mt-2">This may take a few moments</p>
          </div>
        ) : error ? (
          <Card className="p-12 bg-red-50/80 backdrop-blur-sm border border-red-200 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </Card>
        ) : itinerary.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No results found</h3>
            <p className="text-slate-600 mb-6">We couldn't find any itinerary items for {city}</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Search Another City
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itinerary.map((item, idx) => (
              <Card 
                key={idx} 
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border border-slate-200/50 hover:-translate-y-1"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2 flex-1 pr-2 group-hover:text-blue-600 transition-colors duration-200">
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap ml-2 border border-blue-200/50">
                      {item.category || item.type || "Item"}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    {item.city && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{item.city}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{item.location}</span>
                      </div>
                    )}
                    {item.rating && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-yellow-600 fill-yellow-500" />
                        </div>
                        <span className="font-semibold text-slate-800">{item.rating} rating</span>
                      </div>
                    )}
                    {item.price && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-bold text-green-700">₹{item.price}</span>
                      </div>
                    )}
                    {item.airline && (
                      <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                        <p className="font-semibold text-slate-800">{item.airline}</p>
                      </div>
                    )}
                    {item.info && (
                      <p className="text-slate-600 mt-3 leading-relaxed border-t border-slate-200 pt-3">
                        {item.info}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}