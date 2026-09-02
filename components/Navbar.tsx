'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight, ShieldCheck, ArrowRight, Heart, User, Search } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'
import { useCustomer } from '@/context/CustomerContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface NavbarProps {
  onCartToggle: () => void
}

export default function Navbar({ onCartToggle }: NavbarProps) {
  const { cartCount } = useCart()
  const { settings, categories, isAdmin } = useStore()
  const { customer, isLoggedIn, wishlistCount, openAuthModal, customerLogout } = useCustomer()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(false)
  const [expandedMobileParent, setExpandedMobileParent] = useState<string | null>(null)

  // Top level parent categories (parent_id IS NULL)
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="h-8 w-8 rounded-full object-cover border border-brand-500/20 shadow-sm group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {settings.store_name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                {settings.store_name}
              </span>
            </Link>
            
            {/* Desktop Navigation Mega Menu */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                {t('nav.home')}
              </Link>

              {/* ALL CATEGORIES CASCADING DROPDOWN (3-TIER HIERARCHY) */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <span>{t('nav.all_categories')}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {/* Level 1 Mega Menu Popup */}
                <div className="absolute left-0 top-full hidden group-hover:block w-64 pt-1 animate-fade-in-down">
                  <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-2xl space-y-1">
                    {parentCategories.map((parent) => {
                      const level2Children = categories.filter((c) => c.parent_id === parent.id)
                      const hasL2 = level2Children.length > 0

                      return (
                        <div key={parent.id} className="relative group/parent">
                          <div className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition">
                            <Link href={`/category/${parent.slug}`} className="flex-1">
                              {parent.name}
                            </Link>
                            {hasL2 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                          </div>

                          {/* Level 2 Sub-dropdown (Flyout) */}
                          {hasL2 && (
                            <div className="absolute left-full top-0 hidden group-hover/parent:block w-60 pl-1.5">
                              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-2xl space-y-1">
                                <Link
                                  href={`/category/${parent.slug}`}
                                  className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50/60 hover:bg-brand-50 transition"
                                >
                                  <span>{t('nav.view_all')} {parent.name}</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                                <div className="my-1 border-t border-slate-100" />

                                {level2Children.map((level2) => {
                                  const level3Children = categories.filter((c) => c.parent_id === level2.id)
                                  const hasL3 = level3Children.length > 0

                                  return (
                                    <div key={level2.id} className="relative group/sub">
                                      <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition">
                                        <Link href={`/category/${level2.slug}`} className="flex-1">
                                          {level2.name}
                                        </Link>
                                        {hasL3 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                                      </div>

                                      {/* Level 3 Sub-sub-dropdown (Flyout) */}
                                      {hasL3 && (
                                        <div className="absolute left-full top-0 hidden group-hover/sub:block w-56 pl-1.5">
                                          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-2xl space-y-0.5">
                                            {level3Children.map((level3) => (
                                              <Link
                                                key={level3.id}
                                                href={`/category/${level3.slug}`}
                                                className="block rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition"
                                              >
                                                {level3.name}
                                              </Link>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* SPECIAL COLLECTION 1: FEATURED */}
              {settings.show_featured && (
                <Link
                  href="/featured"
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <span>{t('nav.featured')}</span>
                </Link>
              )}

              {/* SPECIAL COLLECTION 2: TRENDING */}
              {settings.show_trending && (
                <Link
                  href="/trending"
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <span>{t('nav.trending')}</span>
                </Link>
              )}

              {/* SPECIAL COLLECTION 3: BEST SELLER */}
              {settings.show_best_seller && (
                <Link
                  href="/best-seller"
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <span>{t('nav.best_seller')}</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Action Icons: Language Switcher, Track Order, Search (Mobile), Profile, Cart, Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher (Desktop) */}
            <LanguageSwitcher size="sm" className="hidden sm:inline-flex" />

            {/* Track Order beside Cart (Desktop) */}
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center text-xs font-bold text-slate-700 hover:text-brand-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {t('nav.track_order')}
            </Link>

            {/* Wishlist Button (Desktop) */}
            <Link
              href="/account?tab=wishlist"
              className="relative hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50 text-slate-700 hover:text-pink-600 transition shadow-sm"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-pink-600 text-[9px] font-black text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* 1. Mobile Search Icon Button (Mobile Only) */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen)
                if (mobileMenuOpen) setMobileMenuOpen(false)
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden border border-slate-200"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-4 w-4 text-slate-700" />
            </button>

            {/* 2. User Account Button / Dropdown (Icon-only on mobile, full label on desktop) */}
            <div className="relative group">
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto px-0 sm:px-3 py-0 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-sm"
                  title="My Account"
                  aria-label="My Account"
                >
                  <User className="h-4 w-4 text-brand-600" />
                  <span className="max-w-[80px] truncate hidden md:inline-block">
                    {customer?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform hidden sm:inline-block" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center justify-center gap-1 h-9 w-9 sm:h-auto sm:w-auto px-0 sm:px-3 py-0 sm:py-2 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-bold transition shadow-sm"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline-block">{isBangla ? 'লগইন' : 'Sign In'}</span>
                </button>
              )}

              {/* Account Dropdown Menu (If Logged In) */}
              {isLoggedIn && (
                <div className="absolute right-0 top-full hidden group-hover:block w-48 pt-1.5 z-50 animate-fade-in-down">
                  <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2 shadow-xl space-y-1 text-xs">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <span className="font-bold text-slate-900 block truncate">{customer?.full_name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{customer?.email}</span>
                    </div>

                    <Link
                      href="/account?tab=orders"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isBangla ? 'আমার অর্ডারসমূহ' : 'My Orders'}</span>
                    </Link>

                    <Link
                      href="/account?tab=wishlist"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      <span>{isBangla ? 'উইশলিস্ট' : 'Wishlist'}</span>
                    </Link>

                    <Link
                      href="/account?tab=profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{isBangla ? 'প্রোফাইল' : 'Profile'}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => customerLogout()}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span>{isBangla ? 'লগআউট' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Cart Button (Icon only on Mobile, Label on Desktop) */}
            <button
              onClick={onCartToggle}
              className="relative flex items-center justify-center gap-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-900 h-9 w-9 sm:h-auto sm:w-auto px-0 sm:px-3.5 py-0 sm:py-2 text-xs font-bold transition-all shadow-sm"
              id="cart-trigger"
              aria-label="Shopping Cart"
              title="Cart"
            >
              <ShoppingBag className="h-4 w-4 text-brand-700" />
              <span className="tracking-wide hidden sm:inline">{t('nav.cart')}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto flex h-4 min-w-[16px] sm:h-5 sm:min-w-[20px] px-1 sm:px-1.5 items-center justify-center rounded-full bg-brand-600 text-[9px] sm:text-[10px] font-black text-white">
                  {isBangla ? toBengaliDigits(cartCount) : cartCount}
                </span>
              )}
            </button>

            {/* 4. Mobile Menu Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                if (mobileSearchOpen) setMobileSearchOpen(false)
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden border border-slate-200"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden shadow-lg animate-fade-in-down">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = (e.currentTarget.elements.namedItem('mobileSearch') as HTMLInputElement)?.value
                if (input) {
                  const topInput = document.getElementById('top-product-search') as HTMLInputElement
                  if (topInput) {
                    topInput.value = input
                    topInput.dispatchEvent(new Event('input', { bubbles: true }))
                    topInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } else {
                    window.location.href = `/?search=${encodeURIComponent(input)}#catalog`
                  }
                }
              }}
              className="relative flex items-center"
            >
              <Search className="absolute left-3.5 h-4 w-4 text-brand-600/70 pointer-events-none" />
              <input
                type="text"
                name="mobileSearch"
                autoFocus
                placeholder={isBangla ? 'পণ্য বা কালেকশন খুঁজুন...' : 'Search products...'}
                className="w-full rounded-xl border-2 border-brand-500/50 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 outline-none focus:border-brand-600 focus:bg-white"
                onChange={(e) => {
                  const topInput = document.getElementById('top-product-search') as HTMLInputElement
                  if (topInput) {
                    topInput.value = e.target.value
                    topInput.dispatchEvent(new Event('input', { bubbles: true }))
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden max-h-[80vh] overflow-y-auto animate-fade-in-down">
            {/* Language Switcher in Mobile Drawer */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 px-1">
              <span className="text-xs font-bold text-slate-500">
                {isBangla ? 'ভাষা পরিবর্তন (Language)' : 'Language (ভাষা)'}
              </span>
              <LanguageSwitcher size="sm" />
            </div>

            <div className="flex flex-col space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
              >
                {t('nav.home')}
              </Link>

              {/* Mobile 3-Tier Categories Collapsible Accordion */}
              <div className="py-1 space-y-1">
                <button
                  type="button"
                  onClick={() => setMobileCategoriesExpanded(!mobileCategoriesExpanded)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{t('nav.all_categories')}</span>
                    <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded-full border border-brand-200/60">
                      {isBangla ? toBengaliDigits(parentCategories.length) : parentCategories.length}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${mobileCategoriesExpanded ? 'rotate-180 text-brand-600' : ''}`} />
                </button>

                {mobileCategoriesExpanded && (
                  <div className="pl-2 space-y-1 border-l-2 border-brand-100 ml-3 py-1 animate-fade-in-down">
                    {parentCategories.map((parent) => {
                      const level2Children = categories.filter((c) => c.parent_id === parent.id)
                      const isExpanded = expandedMobileParent === parent.id

                      return (
                        <div key={parent.id} className="space-y-1">
                          <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                            <Link
                              href={`/category/${parent.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="text-sm font-bold text-slate-800 hover:text-brand-600"
                            >
                              {parent.name}
                            </Link>
                            {level2Children.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedMobileParent(isExpanded ? null : parent.id)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Level 2 & 3 Subcategories Accordion */}
                          {isExpanded && level2Children.length > 0 && (
                            <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-3 py-1">
                              <Link
                                href={`/category/${parent.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-xs font-bold text-brand-600 py-1"
                              >
                                {t('nav.view_all')} {parent.name}
                              </Link>
                              {level2Children.map((level2) => {
                                const level3Children = categories.filter((c) => c.parent_id === level2.id)

                                return (
                                  <div key={level2.id} className="space-y-1 pl-2">
                                    <Link
                                      href={`/category/${level2.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block text-xs font-semibold text-slate-700 py-1 hover:text-brand-600"
                                    >
                                      {level2.name}
                                    </Link>
                                    {level3Children.length > 0 && (
                                      <div className="pl-4 space-y-0.5 border-l border-slate-200">
                                        {level3Children.map((level3) => (
                                          <Link
                                            key={level3.id}
                                            href={`/category/${level3.slug}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block text-[11px] text-slate-500 py-0.5 hover:text-brand-600"
                                          >
                                            {level3.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {settings.show_featured && (
                <Link
                  href="/featured"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                >
                  {t('nav.featured')}
                </Link>
              )}

              {settings.show_trending && (
                <Link
                  href="/trending"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                >
                  {t('nav.trending')}
                </Link>
              )}

              {settings.show_best_seller && (
                <Link
                  href="/best-seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                >
                  {t('nav.best_seller')}
                </Link>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <Link
                  href="/account?tab=wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    <span>{isBangla ? 'উইশলিস্ট' : 'Wishlist'}</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="text-[10px] bg-pink-600 text-white font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {isLoggedIn ? (
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                  >
                    <User className="h-4 w-4 text-brand-600" />
                    <span>{isBangla ? 'আমার অ্যাকাউন্ট' : 'My Account'}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openAuthModal('login')
                    }}
                    className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-brand-700 bg-brand-50"
                  >
                    <User className="h-4 w-4 text-brand-600" />
                    <span>{isBangla ? 'লগইন / সাইন আপ' : 'Sign In / Register'}</span>
                  </button>
                )}

                <Link
                  href="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t('nav.track_order')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* FLOATING ADMIN DASHBOARD PILL (Visible only to authenticated admins) */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <Link
            href="/stradmn"
            className="flex items-center gap-2 rounded-full bg-slate-900/95 hover:bg-slate-950 text-white px-4 py-2.5 text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md hover:scale-105 transition-all group"
            title="Switch to Store Dashboard"
          >
            <ShieldCheck className="h-4 w-4 text-brand-400 group-hover:rotate-12 transition-transform" />
            <span>Switch to Dashboard</span>
          </Link>
        </div>
      )}
    </>
  )
}
