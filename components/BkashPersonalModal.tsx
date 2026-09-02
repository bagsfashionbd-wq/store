'use client'

import React, { useState } from 'react'
import { Copy, Check, AlertCircle, X, Loader2, QrCode, Smartphone, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface BkashPersonalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (senderNumber: string, transactionId: string) => void
  totalAmount: number
  personalNumber: string
  accountName?: string
  qrUrl?: string
  isLoading: boolean
}

export default function BkashPersonalModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  personalNumber,
  accountName,
  qrUrl,
  isLoading
}: BkashPersonalModalProps) {
  const { t, isBangla, toBengaliDigits } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleCopy = () => {
    if (!personalNumber) return
    navigator.clipboard.writeText(personalNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const cleanSender = senderNumber.trim()
    const cleanTrx = transactionId.trim()

    if (!cleanSender && !cleanTrx) {
      setError(
        isBangla
          ? 'অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন অথবা ট্রানজেকশন আইডি (TrxID) দিন।'
          : 'Please provide either the sender bKash number or the Transaction ID (TrxID).'
      )
      return
    }

    if (cleanSender && cleanSender.length < 11) {
      setError(
        isBangla
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বিকাশ নম্বর দিন (যেমনঃ 017XXXXXXXX)।'
          : 'Please enter a valid 11-digit bKash number (e.g. 017XXXXXXXX).'
      )
      return
    }

    if (cleanTrx && cleanTrx.length < 4) {
      setError(
        isBangla
          ? 'ট্রানজেকশন আইডির শেষ ৪-৮টি ডিজিট বা পুরো TrxID দিন।'
          : 'Please enter at least the last 4-8 digits of the TrxID or the full code.'
      )
      return
    }

    onConfirm(cleanSender, cleanTrx)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-pink-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with bKash theme */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-black text-sm backdrop-blur-sm border border-white/30">
              ৳
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-tight">
                {isBangla ? 'বিকাশ সেন্ড মানি (পার্সোনাল)' : 'bKash Send Money (Personal)'}
              </h3>
              <p className="text-[11px] text-pink-100 font-medium">
                {isBangla ? 'ব্যক্তিগত বিকাশ নম্বরে টাকা পাঠিয়ে তথ্য দিন' : 'Send money to personal bKash & provide details to verify'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Amount to Send Banner */}
          <div className="rounded-2xl bg-pink-50/80 border border-pink-200 p-4 text-center">
            <span className="text-xs font-bold text-pink-900 uppercase tracking-wider block">
              {isBangla ? 'পরিশোধের মোট পরিমাণ' : 'Total Amount to Send'}
            </span>
            <span className="text-3xl font-black text-pink-600 mt-1 block">
              ৳{isBangla ? toBengaliDigits(totalAmount.toLocaleString()) : totalAmount.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-pink-700 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
              {isBangla ? '📌 বিকাশ অ্যাপ বা *247# থেকে Send Money করবেন' : '📌 Use "Send Money" Option from App / *247#'}
            </span>
          </div>

          {/* Number & Account Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isBangla ? 'বিকাশ পার্সোনাল নম্বর (প্রাপক)' : 'Receiver Personal bKash Number'}
                </span>
                <span className="text-lg font-black text-slate-900 font-mono tracking-wider">
                  {personalNumber || '01XXXXXXXXX'}
                </span>
                {accountName && (
                  <span className="text-xs font-medium text-slate-500 block">
                    {accountName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{isBangla ? 'কপি হয়েছে' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{isBangla ? 'কপি নম্বর' : 'Copy Number'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Optional QR Code */}
            {qrUrl && (
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                  <QrCode className="h-4 w-4 text-pink-600" />
                  <span>{isBangla ? 'অথবা সরাসরি বিকাশ কিউআর স্ক্যান করুন' : 'Or Scan bKash QR Code'}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="bKash QR Code"
                  className="w-44 h-44 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-2"
                />
              </div>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-900 block">
              {isBangla ? 'টাকা পাঠানোর সহজ নিয়ম:' : 'Simple Step-by-Step Guide:'}
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-700">
              <li>
                {isBangla 
                  ? 'আপনার বিকাশ অ্যাপ খুলুন অথবা মোবাইলে *247# ডায়াল করুন।' 
                  : 'Open your bKash app or dial *247# from your phone.'}
              </li>
              <li>
                {isBangla 
                  ? 'মেনু থেকে ‘Send Money’ (সেন্ড মানি) অপশনটি সিলেক্ট করুন।' 
                  : 'Select the "Send Money" option from the menu.'}
              </li>
              <li>
                {isBangla 
                  ? `প্রাপক নম্বর বক্সে উপরের বিকাশ নম্বরটি (${personalNumber}) দিয়ে মোট ৳${toBengaliDigits(totalAmount)} টাকা পাঠান।` 
                  : `Enter the number above (${personalNumber}) and send exactly ৳${totalAmount}.`}
              </li>
              <li>
                {isBangla 
                  ? 'লেনদেন সম্পন্ন হলে SMS / বিকাশ স্টেটমেন্ট থেকে ট্রানজেকশন আইডির শেষ ৬টি ডিজিট (TrxID) বা যে নম্বর থেকে টাকা পাঠিয়েছেন তা নিচের বক্সে লিখে ‘অর্ডার নিশ্চিত করুন’ বাটনে ক্লিক করুন।' 
                  : 'After sending, enter your sender bKash number and/or the last 6 digits of the TrxID below to confirm your order.'}
              </li>
            </ol>
          </div>

          {/* Form for Sender Details */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isBangla ? 'যে নম্বর থেকে টাকা পাঠিয়েছেন' : 'Your Sender bKash Number'}
                </label>
                <input
                  type="tel"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 font-mono"
                />
                <span className="text-[10px] text-slate-400 block">
                  {isBangla ? '১১ ডিজিটের মোবাইল নম্বর' : '11-digit mobile number'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {isBangla ? 'TrxID বা শেষ ৬ ডিজিট' : 'TrxID or Last 6 Digits'}
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  placeholder={isBangla ? 'যেমনঃ 9J8K7L বা 9J8K7L6M' : 'e.g. 9J8K7L or 9J8K7L6M'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 uppercase font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 block">
                  {isBangla ? 'বিকাশ মেসেজের ট্রানজেকশন আইডি' : 'From bKash confirmation SMS'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-100 text-[11px] text-pink-800">
              {isBangla 
                ? '💡 দোকানদার আপনার দেওয়া TrxID বা মোবাইল নম্বরের সাথে মিলিয়ে পেমেন্ট ভেরিফাই করবেন।'
                : '💡 The shop owner will cross-check your TrxID / sender number to verify payment.'}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-1/3 py-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isBangla ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBangla ? 'টাকা পাঠিয়েছি - কনফার্ম করুন' : "I've Sent Money - Confirm Order"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
