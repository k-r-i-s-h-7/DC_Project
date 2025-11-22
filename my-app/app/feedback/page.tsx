"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plane, Star, MessageSquare, ArrowLeft, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"

export default function FeedbackPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
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
        const feedbackCity = sessionStorage.getItem("feedbackCity")
        if (feedbackCity) {
          setCity(feedbackCity)
        }
        setIsVisible(true)
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
        setShowPopup(true)
        setTimeout(() => {
          setShowPopup(false)
          router.push("/dashboard")
        }, 2500)
      }
    } catch (err) {
      console.error(err)
    }
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

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 transform animate-scaleIn">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-once">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Thank You!</h2>
              <p className="text-slate-600 text-lg mb-2">Your feedback has been submitted successfully.</p>
              <p className="text-slate-500 text-sm">Redirecting you to dashboard...</p>
              <div className="mt-6 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 shadow-sm">
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
            <Button variant="outline" className="border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Feedback Form */}
      <div className={`relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">Share Your Feedback</h1>
            <p className="text-slate-600 mt-1">Help us improve your travel planning experience</p>
          </div>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Thank You!</h2>
              <p className="text-slate-600 text-lg">Your feedback helps us improve. Redirecting...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span>Destination</span>
                </label>
                <Input 
                  type="text" 
                  value={city} 
                  disabled 
                  className="w-full bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed font-medium text-lg" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  How would you rate your experience?
                </label>
                <div className="flex gap-3 justify-center bg-slate-50 p-6 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-all duration-200 hover:scale-125 active:scale-95"
                    >
                      <Star
                        className={`w-12 h-12 transition-all duration-200 ${
                          star <= rating 
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-md" 
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-slate-500 mt-3">
                  {rating === 5 && "Excellent! ⭐"}
                  {rating === 4 && "Great! 😊"}
                  {rating === 3 && "Good 👍"}
                  {rating === 2 && "Could be better 😐"}
                  {rating === 1 && "Needs improvement 😔"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience... What did you like? What could be improved?"
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-800 placeholder-slate-400 transition-all duration-200"
                  rows={6}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Submit Feedback
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full py-6 text-lg border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 font-semibold transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
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
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
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
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-progress {
          animation: progress 2.5s ease-out;
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}