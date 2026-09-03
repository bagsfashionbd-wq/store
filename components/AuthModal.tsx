'use client'

import React, { useState } from 'react'
import { useCustomer } from '@/context/CustomerContext'
import { useLanguage } from '@/context/LanguageContext'
import {
  X, User, Mail, Lock, Phone, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff
} from 'lucide-react'
import axios from 'axios'

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, customerLogin, customerSignup } = useCustomer()
  const { t, isBangla } = useLanguage()

  // Form Fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)

  // Status
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!authModalOpen) return null

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const res = await customerLogin(identifier, password)
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Login failed. Please check your credentials.')
    }
  }

  // Handle Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (phone.replace(/[^0-9]/g, '').length < 11) {
      setErrorMsg(isBangla ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Please enter a valid 11-digit mobile number.')
      return
    }

    if (signupPassword.length < 6) {
      setErrorMsg(isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const res = await customerSignup({
      full_name: fullName,
      phone,
      email,
      password: signupPassword
    })
    setLoading(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create account.')
    }
  }

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      await axios.post('/api/customer/auth', {
        action: 'forgot-password',
        email: forgotEmail
      })
      setForgotSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Customer Portal</span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            {authModalTab === 'login' && (isBangla ? 'কাস্টমার লগইন' : 'Customer Sign In')}
            {authModalTab === 'signup' && (isBangla ? 'নতুন একাউন্ট তৈরি করুন' : 'Create an Account')}
            {authModalTab === 'forgot' && (isBangla ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password')}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {authModalTab === 'login' && (isBangla ? 'আপনার মোবাইল নম্বর বা ইমেইল দিয়ে সাইন ইন করুন' : 'Sign in with your mobile number or email')}
            {authModalTab === 'signup' && (isBangla ? 'অর্ডার ট্র্যাক এবং উইশলিস্ট সংরক্ষণ করতে সাইন আপ করুন' : 'Sign up to track orders, save wishlists, and checkout faster')}
            {authModalTab === 'forgot' && (isBangla ? 'আপনার ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাব' : 'Enter your email to receive a password reset link')}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isBangla ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="017XXXXXXXX or you@email.com"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    {isBangla ? 'পাসওয়ার্ড' : 'Password'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    {isBangla ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isBangla ? 'লগইন হচ্ছে...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBangla ? 'লগইন করুন' : 'Sign In'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {isBangla ? 'একাউন্ট নেই?' : "Don't have an account?"}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  {isBangla ? 'নতুন একাউন্ট খুলুন' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGNUP */}
          {authModalTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isBangla ? 'আপনার পূর্ণ নাম' : 'Full Name'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sadman Sakib"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isBangla ? 'মোবাইল নম্বর' : 'Mobile Number'} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isBangla ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {isBangla ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 chars)'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isBangla ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBangla ? 'সাইন আপ ও লগইন করুন' : 'Sign Up & Continue'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {isBangla ? 'আগে থেকেই একাউন্ট আছে?' : 'Already have an account?'}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  {isBangla ? 'লগইন করুন' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {authModalTab === 'forgot' && (
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isBangla ? 'রিসেট লিংক পাঠানো হয়েছে' : 'Reset Link Sent'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isBangla
                      ? 'আপনার ইমেইলের ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।'
                      : 'Please check your inbox or spam folder for password reset instructions.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="mt-3 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
                  >
                    {isBangla ? 'লগইনে ফিরে যান' : 'Back to Sign In'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {isBangla ? 'আপনার নিবন্ধিত ইমেইল' : 'Your Registered Email'} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{isBangla ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}</span>
                    )}
                  </button>

                  <div className="text-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      {isBangla ? '← লগইনে ফিরে যান' : '← Back to Sign In'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
