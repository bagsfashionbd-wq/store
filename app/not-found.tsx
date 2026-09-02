import React from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-4">
          <span className="text-5xl font-black text-brand-600 block">404</span>
          <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page or product you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition"
            >
              <Home className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
