'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useCustomer } from '@/context/CustomerContext'

export interface CartItem {
  id: string
  name: string
  slug: string
  price: number
  image: string
  selectedVariations: Record<string, string>
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (id: string, selectedVariations: Record<string, string>) => void
  updateQuantity: (id: string, selectedVariations: Record<string, string>, quantity: number) => void
  clearCart: () => void
  cartCount: number
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { removeFromWishlist } = useCustomer()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('aquarium_cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error parsing cart from localStorage', e)
      }
    }
  }, [])

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem('aquarium_cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    // Automatically clear from wishlist when added to cart
    if (newItem?.id) {
      removeFromWishlist(newItem.id)
    }

    setCartItems((prevItems) => {
      // Find if item with same ID and variations already exists
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === newItem.id &&
          JSON.stringify(item.selectedVariations) === JSON.stringify(newItem.selectedVariations)
      )

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        return updatedItems
      } else {
        return [...prevItems, { ...newItem, quantity }]
      }
    })
  }

  const removeFromCart = (id: string, selectedVariations: Record<string, string>) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(item.id === id && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations))
      )
    )
  }

  const updateQuantity = (id: string, selectedVariations: Record<string, string>, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, selectedVariations)
      return
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && JSON.stringify(item.selectedVariations) === JSON.stringify(selectedVariations)
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
