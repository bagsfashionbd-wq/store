'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from 'axios'

export interface CustomerProfile {
  id: string
  user_id?: string
  full_name: string
  phone: string
  email: string
  avatar_url?: string
  address?: string
  city_id?: number
  zone_id?: number
  area_id?: number
  city_name?: string
  zone_name?: string
  area_name?: string
}

interface CustomerContextType {
  customer: CustomerProfile | null
  isLoggedIn: boolean
  loading: boolean
  authModalOpen: boolean
  authModalTab: 'login' | 'signup' | 'forgot'
  openAuthModal: (tab?: 'login' | 'signup' | 'forgot') => void
  closeAuthModal: () => void
  customerLogin: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  customerSignup: (data: { full_name: string; phone: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  customerLogout: () => Promise<void>
  refreshCustomer: () => Promise<void>
  // Wishlist
  wishlistIds: string[]
  toggleWishlist: (productId: string) => Promise<{ added: boolean; isGuest: boolean }>
  removeFromWishlist: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  wishlistCount: number
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

const GUEST_WISHLIST_KEY = 'mystore_guest_wishlist'

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login')
  const [wishlistIds, setWishlistIds] = useState<string[]>([])

  // Load guest wishlist initially from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_WISHLIST_KEY)
      if (saved) {
        setWishlistIds(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  // Check auth state on mount
  const checkCustomerSession = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setCustomer(null)
        setLoading(false)
        return
      }

      // Fetch customer profile
      const res = await axios.get('/api/customer/profile')
      if (res.data?.customer) {
        setCustomer(res.data.customer)
        // Fetch server wishlist
        const wishRes = await axios.get('/api/customer/wishlist')
        if (Array.isArray(wishRes.data?.wishlistIds)) {
          // Merge with any guest wishlist
          const guestWish = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || '[]')
          const merged = Array.from(new Set([...wishRes.data.wishlistIds, ...guestWish]))
          setWishlistIds(merged)
          // Sync any new items to server
          for (const pid of guestWish) {
            if (!wishRes.data.wishlistIds.includes(pid)) {
              await axios.post('/api/customer/wishlist', { product_id: pid }).catch(() => {})
            }
          }
          localStorage.removeItem(GUEST_WISHLIST_KEY)
        }
      } else {
        setCustomer(null)
      }
    } catch (err) {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCustomerSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkCustomerSession()
      } else {
        setCustomer(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = (tab: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  // Login handler
  const customerLogin = async (identifier: string, password: string) => {
    try {
      const res = await axios.post('/api/customer/auth', {
        action: 'login',
        identifier,
        password
      })

      if (res.data?.session) {
        await supabase.auth.setSession(res.data.session)
        await checkCustomerSession()
        closeAuthModal()
        return { success: true }
      }

      return { success: false, error: 'Login failed. Please verify your credentials.' }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Invalid login credentials'
      }
    }
  }

  // Signup handler
  const customerSignup = async (data: { full_name: string; phone: string; email: string; password: string }) => {
    try {
      const res = await axios.post('/api/customer/auth', {
        action: 'signup',
        ...data
      })

      if (res.data?.session) {
        await supabase.auth.setSession(res.data.session)
        await checkCustomerSession()
        closeAuthModal()
        return { success: true }
      }

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Failed to create account.'
      }
    }
  }

  // Logout handler
  const customerLogout = async () => {
    await supabase.auth.signOut()
    setCustomer(null)
  }

  // Toggle wishlist item
  const toggleWishlist = async (productId: string) => {
    const isCurrentlyIn = wishlistIds.includes(productId)
    const nextList = isCurrentlyIn
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId]

    setWishlistIds(nextList)

    if (!customer) {
      // Guest mode: save in localStorage
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(nextList))
      return { added: !isCurrentlyIn, isGuest: true }
    } else {
      // Logged in: sync with DB
      try {
        if (isCurrentlyIn) {
          await axios.delete(`/api/customer/wishlist?product_id=${productId}`)
        } else {
          await axios.post('/api/customer/wishlist', { product_id: productId })
        }
      } catch (err) {
        console.error('Failed to sync wishlist with DB', err)
      }
      return { added: !isCurrentlyIn, isGuest: false }
    }
  }

  // Remove from wishlist (e.g., when added to cart)
  const removeFromWishlist = async (productId: string) => {
    setWishlistIds((prev) => {
      if (!prev.includes(productId)) return prev
      const nextList = prev.filter((id) => id !== productId)

      if (!customer) {
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(nextList))
      } else {
        axios.delete(`/api/customer/wishlist?product_id=${productId}`).catch(console.error)
      }

      return nextList
    })
  }

  const isInWishlist = (productId: string) => wishlistIds.includes(productId)

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoggedIn: Boolean(customer),
        loading,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        customerLogin,
        customerSignup,
        customerLogout,
        refreshCustomer: checkCustomerSession,
        wishlistIds,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}
