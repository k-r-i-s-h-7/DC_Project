"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user?.email}</h1>
        <p className="text-foreground/60 mb-8">Your travel planning dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Start */}
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Plan New Trip</h3>
            </div>
            <p className="text-foreground/60 mb-4">Search for hotels, events, and attractions in your destination</p>
            <Link href="/">
              <Button className="w-full bg-primary hover:bg-primary/90">Start Planning</Button>
            </Link>
          </Card>

          {/* My Favorites */}
          <Card className="p-8 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Saved Itineraries</h3>
            </div>
            <p className="text-foreground/60 mb-4">View and manage your saved travel plans</p>
            <Button variant="outline" className="w-full bg-transparent">
              View Saved
            </Button>
          </Card>

          {/* Analytics */}
          <Card className="p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Travel Stats</h3>
            </div>
            <p className="text-foreground/60 mb-4">See your travel history and preferences</p>
            <Button variant="outline" className="w-full bg-transparent">
              View Stats
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8 p-8 bg-white/95 border-primary/10">
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Activity</h2>
          <p className="text-foreground/60">Your recent searches and itineraries will appear here</p>
        </Card>
      </div>
    </div>
  )
}
