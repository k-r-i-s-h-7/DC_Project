"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plane, LogOut, User, Mail, Calendar, Shield, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isVisible, setIsVisible] = useState(false)
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
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                Dashboard
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

      {/* Profile Content */}
      <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-3">Your Profile</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Header Card */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl mb-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{user?.email}</h2>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Information Card */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl mb-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Account Information</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <Input
                  type="text"
                  value="Anushka"
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Anushka"
                  className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white transition-all duration-200"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <Input
                  type="text"
                  value="Suvarna"
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Suvarna"
                  className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input 
                type="email" 
                value={user?.email} 
                disabled 
                className="w-full bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" 
              />
              <p className="text-xs text-slate-500 mt-1">Email address cannot be changed</p>
            </div>

            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Danger Zone Card */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
              <p className="text-sm text-slate-600">Irreversible actions</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Deleting your account will permanently remove all your data, including saved trips, preferences, and booking history. This action cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            onClick={async () => {
              if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                // Handle account deletion
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete Account Permanently
          </Button>
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