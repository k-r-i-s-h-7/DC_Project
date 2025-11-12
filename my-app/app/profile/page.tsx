"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plane, LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
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
            <Link href="/dashboard">
              <Button variant="ghost" className="text-foreground hover:bg-primary/10">
                Dashboard
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

      {/* Profile Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Your Profile</h1>

        <Card className="p-8 bg-white/95 border-primary/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user?.email}</h2>
              <p className="text-foreground/60">Account Created: {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input type="email" value={user?.email} disabled className="w-full bg-muted" />
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90">Save Changes</Button>
          </form>

          <hr className="my-8 border-border" />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Danger Zone</h3>
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                if (confirm("Are you sure you want to delete your account?")) {
                  // Handle account deletion
                }
              }}
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
