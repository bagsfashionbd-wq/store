'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { PublicStoreSettings } from '@/utils/settings'
import { createClient } from '@/utils/supabase/client'

export interface CategoryItem {
  id: string
  parent_id?: string | null
  name: string
  slug: string
  description?: string | null
}

interface StoreContextType {
  settings: PublicStoreSettings
  categories: CategoryItem[]
  isAdmin: boolean
  updateClientSettings: (newSettings: Partial<PublicStoreSettings>) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({
  initialSettings,
  initialCategories = [],
  children
}: {
  initialSettings: PublicStoreSettings
  initialCategories?: CategoryItem[]
  children: React.ReactNode
}) {
  const [settings, setSettings] = useState<PublicStoreSettings>(initialSettings)
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if user is logged in as staff/owner/admin for floating pill
    async function checkAdmin(userId?: string) {
      try {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id
        if (!uid) {
          setIsAdmin(false)
          return
        }

        const { data: staff } = await supabase
          .from('staff_members')
          .select('role, status')
          .eq('user_id', uid)
          .maybeSingle()

        if (staff && staff.status !== 'inactive' && ['admin', 'shop_owner', 'staff'].includes(staff.role)) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } catch {
        setIsAdmin(false)
      }
    }
    checkAdmin()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user) {
        checkAdmin(user.id)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateClientSettings = (newSettings: Partial<PublicStoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  return (
    <StoreContext.Provider value={{ settings, categories, isAdmin, updateClientSettings }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
