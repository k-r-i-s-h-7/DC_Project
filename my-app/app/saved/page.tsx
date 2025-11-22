"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, ArrowLeft, Heart, MapPin, Star, Calendar, Bookmark } from "lucide-react"

interface SavedItem {
  id: number
  city: string
  itinerary: any[]
  created_at: string
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchSaved = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("saved_itineraries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setItems(
          data.map((item: any) => ({
            ...item,
            itinerary:
              typeof item.itinerary === "string"
                ? JSON.parse(item.itinerary)
                : item.itinerary,
          }))
        )
      }

      setLoading(false)
      setIsVisible(true)
    }

    fetchSaved()
  }, [])

  const formatDate = (ts: string) => {
    if (!ts) return "Unknown"

    const iso = ts.includes(" ") ? ts.replace(" ", "T") : ts

    const d = new Date(iso)
    if (isNaN(d.getTime())) return "Unknown"

    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 pb-20 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* NAVBAR */}
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

          <Link href="/dashboard">
            <Button variant="outline" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <div className={`relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">Saved Itineraries</h1>
            <p className="text-slate-600 mt-1">Your collection of travel plans</p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No saved itineraries yet</h3>
            <p className="text-slate-500 mb-6">Start planning your next adventure and save your favorite itineraries!</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Start Planning
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map((item, index) => (
              <Card
                key={item.id}
                className="group p-8 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 rounded-2xl border border-slate-200/50 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">{item.city}</h2>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Saved on {formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <Heart className="w-4 h-4 fill-purple-700" />
                    Saved
                  </div>
                </div>

                <div className="space-y-3">
                  {item.itinerary.map((place, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-1">{place.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          {place.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {place.city}
                            </span>
                          )}
                          {place.rating && (
                            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                              <Star className="w-3.5 h-3.5 fill-yellow-500" />
                              {place.rating}
                            </span>
                          )}
                          {place.type && (
                            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                              {place.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/50 flex items-center justify-between text-sm text-slate-500">
                  <span>{item.itinerary.length} {item.itinerary.length === 1 ? 'place' : 'places'} in this itinerary</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    View Details
                  </Button>
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