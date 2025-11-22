"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plane, Star } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function FeedbackPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
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
        const feedbackCity = sessionStorage.getItem("feedbackCity")
        if (feedbackCity) {
          setCity(feedbackCity)
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          location: city,
          itinerary: JSON.parse(sessionStorage.getItem("feedbackItinerary") || "[]"),
          rating: Number.parseFloat(rating.toString()),
          comment,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => router.push("/dashboard"), 2000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen blue-mesh-bg pb-20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TravelPlan</span>
          </Link>
        </div>
      </nav>

      {/* Feedback Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Share Your Feedback</h1>

        <Card className="p-8 bg-white/95 border-primary/10">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
              <p className="text-foreground/60">Your feedback helps us improve. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Destination</label>
                <Input type="text" value={city} disabled className="w-full bg-muted" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  How would you rate your experience?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Additional Comments</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={6}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Submit Feedback
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
