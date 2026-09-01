'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, ChevronDown, ChevronRight, ShieldCheck, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface NavbarProps {
  onCartToggle: () => void
}

export default function Navbar({ onCartToggle }: NavbarProps) {
  const { cartCount } = useCart()
  const { settings, categories, isAdmin } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

              {settings.about_enabled && (settings.about_story || settings.contact_address || settings.contact_phone || settings.contact_whatsapp || settings.contact_email) && (
                <Link
                  href="/about"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
                >
                  {t('nav.about_us')}
                </Link>
              )}
            </nav>
          </div>

          {/* Action Icons: Language Switcher, Track Order & Cart with Label */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <LanguageSwitcher size="sm" className="hidden sm:inline-flex" />

            {/* Track Order beside Cart */}
            <Link
              href="/track"
              className="hidden sm:inline-flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-brand-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {t('nav.track_order')}
            </Link>

            {/* Cart Button with Icon & Label */}
            <button
              onClick={onCartToggle}
              className="relative flex items-center gap-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 text-brand-900 px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
              id="cart-trigger"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4 text-brand-700" />
              <span className="tracking-wide">{t('nav.cart')}</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-black text-white">
                  {isBangla ? toBengaliDigits(cartCount) : cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden border border-slate-200"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

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
                {settings.about_enabled && (settings.about_story || settings.contact_address || settings.contact_phone || settings.contact_whatsapp || settings.contact_email) && (
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-600"
                  >
                    {t('nav.about_us')}
                  </Link>
                )}

                <Link
                  href="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-brand-600 bg-brand-50"
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
