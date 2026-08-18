'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { useStore } from '@/context/StoreContext'
import { formatGoogleMapsEmbedUrl } from '@/utils/map'
import { 
  Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, 
  Clock, MessageSquare, ChevronRight, Loader2
} from 'lucide-react'
import axios from 'axios'

export default function ContactPageClient() {
  const { settings } = useStore()
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, phone number, and message.')
      return
    }

    if (phone.trim().length < 11) {
      setErrorMsg('Please enter a valid 11-digit phone number.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/contact', {
        name,
        phone,
        email: email.trim() || null,
        subject: subject.trim() || 'General Inquiry',
        message
      })

      if (response.data?.success) {
        setSubmitted(true)
        setName('')
        setPhone('')
        setEmail('')
        setSubject('')
        setMessage('')
      } else {
        throw new Error(response.data?.error || 'Failed to submit message')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.error || err.message || 'Something went wrong. Please try again or contact us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar onCartToggle={() => setCartDrawerOpen(true)} />

      {/* Header */}
      <section className="bg-slate-950 text-white py-14 sm:py-18 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${settings.hero_image_url || '/logo.jpeg'})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent z-0" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-brand-400">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-brand-400">Contact Us</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
            Get In Touch
          </h1>
          <p className="mt-3 text-sm text-slate-300 max-w-xl">
            Have questions about products, delivery, or custom orders? Reach out to us anytime and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-brand-600 bg-brand-50 rounded-full p-2" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Thank You!</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your message has been sent successfully. Our team has received it and will get in touch with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-500 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Send Us a Direct Message</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fill in the form below and we will respond as soon as possible.</p>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakib Ahmed"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Subject / Inquiry Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Custom Tank Size Inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your message, question, or request in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 disabled:bg-slate-400 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Direct Store Info & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Direct Contact Details
              </h2>

              <div className="space-y-4 text-xs">
                {settings.contact_phone && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Phone / WhatsApp</p>
                      <p className="text-slate-600 mt-0.5">{settings.contact_phone}</p>
                    </div>
                  </div>
                )}

                {settings.contact_email && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Email Support</p>
                      <p className="text-slate-600 mt-0.5">{settings.contact_email}</p>
                    </div>
                  </div>
                )}

                {settings.contact_address && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Store Address</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{settings.contact_address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Response Time</p>
                    <p className="text-slate-600 mt-0.5">Saturday - Thursday: 10:00 AM - 9:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map if available */}
            {settings.google_map_embed_url && (
              <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm overflow-hidden aspect-video bg-slate-100">
                <iframe
                  src={formatGoogleMapsEmbedUrl(settings.google_map_embed_url)}
                  width="100%"
                  height="100%"
                  className="rounded-xl"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Store Location Map"
                />
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
