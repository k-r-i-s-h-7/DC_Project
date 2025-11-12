"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plane, MapPin, Calendar, Users } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function Home() {
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    router.push(`/results?city=${encodeURIComponent(city)}`)
  }

  return (
    <div className="min-h-screen blue-mesh-bg flex flex-col">
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
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-foreground hover:bg-primary/10">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" className="text-foreground hover:bg-primary/10">
                    Profile
                  </Button>
                </Link>
                <Button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push("/")
                  }}
                  variant="outline"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground hover:bg-primary/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Plan Your Perfect <span className="hero-gradient bg-clip-text text-transparent">Travel Itinerary</span>
          </h1>
          <p className="text-xl text-foreground/70 mb-12 leading-relaxed">
            Discover hotels, restaurants, events, transport options, and attractions all in one place. Let us help you
            create unforgettable memories.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Where do you want to go?"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-6 py-4 text-lg rounded-full bg-white/95 border-2 border-primary/20 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20"
              />
              <Button
                type="submit"
                disabled={loading || !city.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-white rounded-full px-8"
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Hotels</h3>
              <p className="text-sm text-foreground/60">Find luxury stays</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Events</h3>
              <p className="text-sm text-foreground/60">Discover local events</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Transport</h3>
              <p className="text-sm text-foreground/60">Book travel routes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Attractions</h3>
              <p className="text-sm text-foreground/60">Explore destinations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
