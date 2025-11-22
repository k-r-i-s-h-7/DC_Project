"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, LogOut, Heart, TrendingUp, Clock, Search } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    const fetchRecent = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("recent_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(5)

      setRecent(data || [])
    }

    fetchRecent()
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        setIsVisible(true)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

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
            <Link href="/profile">
              <Button variant="ghost" className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                Profile
              </Button>
            </Link>
            <Button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push("/")
              }}
              variant="outline"
              className="border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-3">
            Welcome back, <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-slate-600 text-lg">Your travel planning dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Start */}
          <Card className="group p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm bg-white/80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Plan New Trip</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">Search for hotels, events, and attractions in your destination</p>
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Start Planning
              </Button>
            </Link>
          </Card>

          {/* My Favorites */}
          <Card className="group p-8 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm bg-white/80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Saved Itineraries</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">View and manage your saved travel plans</p>
            <Link href="/saved">
              <Button variant="outline" className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                View Saved
              </Button>
            </Link>
          </Card>

          {/* Analytics */}
          <Card className="group p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm bg-white/80">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Travel Stats</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">See your travel history and preferences</p>
            <Link href="/stats">
              <Button variant="outline" className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                View Stats
              </Button>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8 p-8 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Recent Searches</h2>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">You have no recent searches yet.</p>
              <p className="text-slate-400 text-sm mt-2">Start planning your next adventure!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((r, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{r.city}</p>
                      <p className="text-slate-500 text-sm">
                        {new Date(r.searched_at.replace(" ", "T")).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => router.push(`/results?city=${encodeURIComponent(r.city)}`)}
                  >
                    Search again
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
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