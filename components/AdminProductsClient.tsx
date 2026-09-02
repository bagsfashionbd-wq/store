'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useStore } from '@/context/StoreContext'
import { useLanguage } from '@/context/LanguageContext'
import ImageUploader from '@/components/ImageUploader'
import AdminSidebar from '@/components/AdminSidebar'
import RichTextEditor from '@/components/RichTextEditor'
import { 
  BarChart3, ShoppingBag, Package, LogOut, Plus, Trash2, Edit2,
  X, Check, Sparkles, FolderTree, Settings, ShieldCheck, ChevronRight,
  Layers, Upload, AlertCircle, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, Flame, Award,
  Search
} from 'lucide-react'

export interface Category {
  id: string
  parent_id?: string | null
  name: string
  slug: string
}

export interface VariationValue {
  label: string
  stock: number
  image_url: string
  price?: number
}

export interface VariationOption {
  name: string
  values: VariationValue[]
}

export interface Product {
  id: string
  category_id: string
  name: string
  slug: string
  short_description?: string
  description: string
  price: number
  old_price: number
  buying_price?: number
  stock: number
  images: string[]
  variations: any
  created_at: string
  categories?: { name: string }
  is_featured?: boolean
  is_best_seller?: boolean
  is_trending?: boolean
  is_hidden?: boolean
}

interface AdminProductsProps {
  initialProducts: Product[]
  initialCategories: Category[]
}

// Convert legacy flat variation format or rich format to standard VariationOption[]
export function parseProductVariations(variations: any, fallbackStock = 0): VariationOption[] {
  if (!variations || typeof variations !== 'object') return []

  // Check if already in rich format
  if (Array.isArray(variations.options)) {
    return variations.options.map((opt: any) => ({
      name: opt.name || 'Option',
      values: Array.isArray(opt.values)
        ? opt.values.map((v: any) => ({
            label: v.label || String(v),
            stock: typeof v.stock === 'number' ? v.stock : fallbackStock,
            image_url: v.image_url || '',
            price: v.price !== undefined && v.price !== null && v.price !== '' ? Number(v.price) : undefined
          }))
        : []
    }))
  }

  // Legacy flat format e.g. {"sizes": ["1.5 Feet", "2 Feet"]}
  const options: VariationOption[] = []
  Object.entries(variations).forEach(([key, values]) => {
    if (key === 'category_ids') return
    if (Array.isArray(values) && values.length > 0) {
      const cleanName = key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, '')
      const stockPerVal = Math.max(1, Math.floor(fallbackStock / values.length))
      options.push({
        name: cleanName,
        values: values.map((v: any) => ({
          label: String(v),
          stock: stockPerVal,
          image_url: '',
          price: undefined
        }))
      })
    }
  })

  return options
}

export default function AdminProductsClient({ initialProducts, initialCategories }: AdminProductsProps) {
  const router = useRouter()
  const supabase = createClient()
  const { settings } = useStore()
  const { t, toBengaliDigits, isBangla } = useLanguage()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories] = useState<Category[]>(initialCategories)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form Fields (Add)
  const [name, setName] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [price, setPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [buyingPrice, setBuyingPrice] = useState('')
  const [stock, setStock] = useState('10')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [variationOptions, setVariationOptions] = useState<VariationOption[]>([])
  const [isHidden, setIsHidden] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestSeller, setIsBestSeller] = useState(false)
  const [isTrending, setIsTrending] = useState(false)

  // Editing Fields
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([])
  const [editPrice, setEditPrice] = useState('')
  const [editOldPrice, setEditOldPrice] = useState('')
  const [editBuyingPrice, setEditBuyingPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [editShortDescription, setEditShortDescription] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [editVariationOptions, setEditVariationOptions] = useState<VariationOption[]>([])
  const [editIsHidden, setEditIsHidden] = useState(false)
  const [editIsFeatured, setEditIsFeatured] = useState(false)
  const [editIsBestSeller, setEditIsBestSeller] = useState(false)
  const [editIsTrending, setEditIsTrending] = useState(false)

  // Sorting State for Inventory Table
  const [sortField, setSortField] = useState<'info' | 'category' | 'pricing' | 'stock'>('info')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('')

  const handleSort = (field: 'info' | 'category' | 'pricing' | 'stock') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let cmp = 0
    if (sortField === 'info') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortField === 'category') {
      const catA = a.categories?.name || ''
      const catB = b.categories?.name || ''
      cmp = catA.localeCompare(catB)
    } else if (sortField === 'pricing') {
      cmp = Number(a.price) - Number(b.price)
    } else if (sortField === 'stock') {
      cmp = Number(a.stock) - Number(b.stock)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })

  // Filtered Products by Search Query
  const filteredProducts = sortedProducts.filter((product) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const matchName = product.name.toLowerCase().includes(q)
    const matchSlug = (product.slug || '').toLowerCase().includes(q)
    const matchCat = (product.categories?.name || '').toLowerCase().includes(q)
    const matchDesc = (product.description || '').toLowerCase().includes(q)
    const matchPrice = String(product.price).includes(q)
    const matchCost = product.buying_price ? String(product.buying_price).includes(q) : false
    return matchName || matchSlug || matchCat || matchDesc || matchPrice || matchCost
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/stradmn/login')
    router.refresh()
  }

  // Quick toggle product visibility (is_hidden)
  const handleToggleVisibility = async (product: Product) => {
    const newHidden = !product.is_hidden
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_hidden: newHidden } : p))

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_hidden: newHidden })
      })
      if (!res.ok) throw new Error('Failed to update visibility')
    } catch (err: any) {
      console.error(err)
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_hidden: !newHidden } : p))
      alert('Failed to update storefront visibility.')
    }
  }

  // Calculate auto sum of stock from primary variation group (if options exist)
  const computeTotalStock = (options: VariationOption[], defaultStockStr: string) => {
    if (options.length > 0 && options[0].values.length > 0) {
      return options[0].values.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    }
    return Number(defaultStockStr) || 0
  }

  // Handle Category selection with Auto-select rule
  const toggleCategory = (catId: string, currentSelected: string[], setSelected: (ids: string[]) => void) => {
    const targetCat = categories.find((c) => c.id === catId)
    if (!targetCat) return

    const isAlreadySelected = currentSelected.includes(catId)

    if (isAlreadySelected) {
      // Uncheck this category and all its children
      const childIds = categories.filter((c) => c.parent_id === catId).map((c) => c.id)
      setSelected(currentSelected.filter((id) => id !== catId && !childIds.includes(id)))
    } else {
      // Check this category and auto-check its parent if this is a child
      const newSelected = [...currentSelected, catId]
      if (targetCat.parent_id && !newSelected.includes(targetCat.parent_id)) {
        newSelected.push(targetCat.parent_id)
      }
      setSelected(newSelected)
    }
  }

  // Open Edit Modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setEditName(product.name)

    // Resolve category ids
    let catIds: string[] = []
    if (product.variations && typeof product.variations === 'object' && Array.isArray(product.variations.category_ids)) {
      catIds = [...product.variations.category_ids]
    } else if (product.category_id) {
      catIds = [product.category_id]
    }
    setEditCategoryIds(catIds)
    setEditPrice(String(product.price))
    setEditOldPrice(product.old_price ? String(product.old_price) : '')
    setEditBuyingPrice(product.buying_price !== undefined && product.buying_price !== null ? String(product.buying_price) : '')
    setEditStock(String(product.stock))
    setEditShortDescription(product.short_description || '')
    setEditDescription(product.description || '')
    setEditImages(product.images || [])
    setEditVariationOptions(parseProductVariations(product.variations, product.stock))
    setEditIsHidden(Boolean(product.is_hidden))
    setEditIsFeatured(Boolean(product.is_featured))
    setEditIsBestSeller(Boolean(product.is_best_seller))
    setEditIsTrending(Boolean(product.is_trending))
  }

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (selectedCategoryIds.length === 0) {
      alert('Please select at least one category.')
      setLoading(false)
      return
    }

    if (images.length === 0) {
      alert('Please upload at least one product photo.')
      setLoading(false)
      return
    }

    const primaryCategoryId = selectedCategoryIds[0]
    const finalStock = computeTotalStock(variationOptions, stock)

    const variationsPayload = {
      options: variationOptions.filter((opt) => opt.name.trim() && opt.values.length > 0),
      category_ids: selectedCategoryIds
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const payload = {
        name,
        slug,
        category_id: primaryCategoryId,
        is_featured: isFeatured,
        is_best_seller: isBestSeller,
        is_trending: isTrending,
        is_hidden: isHidden,
        price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : 0,
        buying_price: buyingPrice ? Number(buyingPrice) : 0,
        stock: finalStock,
        short_description: shortDescription.trim(),
        description,
        images,
        variations: variationsPayload
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const resJson = await response.json()
      if (!response.ok) throw new Error(resJson.error || 'Failed to insert product.')

      const data = resJson.data
      if (data) {
        const cat = categories.find((c) => c.id === primaryCategoryId)
        const newProd = { ...data, categories: { name: cat ? cat.name : 'Category' } }
        setProducts((prev) => [newProd, ...prev])

        // Reset
        setName('')
        setSelectedCategoryIds([])
        setPrice('')
        setOldPrice('')
        setBuyingPrice('')
        setStock('10')
        setShortDescription('')
        setDescription('')
        setImages([])
        setVariationOptions([])
        setIsHidden(false)
        setIsFeatured(false)
        setIsBestSeller(false)
        setIsTrending(false)
        setShowAddForm(false)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to insert product record.')
    } finally {
      setLoading(false)
    }
  }

  // Update Product Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setLoading(true)

    if (editCategoryIds.length === 0) {
      alert('Please select at least one category.')
      setLoading(false)
      return
    }

    if (editImages.length === 0) {
      alert('Please have at least one product photo.')
      setLoading(false)
      return
    }

    const primaryCategoryId = editCategoryIds[0]
    const finalStock = computeTotalStock(editVariationOptions, editStock)

    const variationsPayload = {
      options: editVariationOptions.filter((opt) => opt.name.trim() && opt.values.length > 0),
      category_ids: editCategoryIds
    }

    const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const payload = {
        id: editingProduct.id,
        name: editName,
        slug,
        category_id: primaryCategoryId,
        is_featured: editIsFeatured,
        is_best_seller: editIsBestSeller,
        is_trending: editIsTrending,
        is_hidden: editIsHidden,
        price: Number(editPrice),
        old_price: editOldPrice ? Number(editOldPrice) : 0,
        buying_price: editBuyingPrice ? Number(editBuyingPrice) : 0,
        stock: finalStock,
        short_description: editShortDescription.trim(),
        description: editDescription,
        images: editImages,
        variations: variationsPayload
      }

      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const resJson = await response.json()
      if (!response.ok) throw new Error(resJson.error || 'Failed to update product.')

      const updatedData = resJson.data
      if (updatedData) {
        const cat = categories.find((c) => c.id === primaryCategoryId)
        const updatedProd = { ...updatedData, categories: { name: cat ? cat.name : 'Category' } }
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? updatedProd : p))
        setEditingProduct(null)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to update product.')
    } finally {
      setLoading(false)
    }
  }

  // Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
      })
      if (!response.ok) throw new Error('Failed to delete product.')
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.')
    }
  }

  // Group categories into parent & child tree
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  // Variation builder helpers
  const renderVariationBuilder = (
    options: VariationOption[],
    setOptions: React.Dispatch<React.SetStateAction<VariationOption[]>>
  ) => {
    const addOptionGroup = () => {
      setOptions([...options, { name: '', values: [{ label: '', stock: 5, image_url: '' }] }])
    }

    const removeOptionGroup = (optIdx: number) => {
      setOptions(options.filter((_, idx) => idx !== optIdx))
    }

    const addValueRow = (optIdx: number) => {
      const updated = [...options]
      updated[optIdx].values.push({ label: '', stock: 5, image_url: '' })
      setOptions(updated)
    }

    const removeValueRow = (optIdx: number, valIdx: number) => {
      const updated = [...options]
      updated[optIdx].values = updated[optIdx].values.filter((_, idx) => idx !== valIdx)
      setOptions(updated)
    }

    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Product Variations & Options (Optional)
            </h4>
            <p className="text-[11px] text-slate-400">
              Add options like Size, Color, or Capacity with individual stock counters and photos.
            </p>
          </div>
          <button
            type="button"
            onClick={addOptionGroup}
            className="inline-flex items-center gap-1 rounded bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-brand-700 text-xs font-bold px-2.5 py-1 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Option Group
          </button>
        </div>

        {options.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No variations added. Standard single product.</p>
        ) : (
          <div className="space-y-4">
            {options.map((opt, optIdx) => (
              <div key={optIdx} className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-3 shadow-sm">
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase">Option Name:</span>
                    <input
                      type="text"
                      placeholder="e.g. Size, Color, Capacity"
                      value={opt.name}
                      onChange={(e) => {
                        const updated = [...options]
                        updated[optIdx].name = e.target.value
                        setOptions(updated)
                      }}
                      className="rounded border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand-500 font-medium w-48"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOptionGroup(optIdx)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove Group
                  </button>
                </div>

                {/* Values Table */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="col-span-4">Value Label</span>
                    <span className="col-span-2 text-center">Stock</span>
                    <span className="col-span-3 text-center">Variant Price (৳)</span>
                    <span className="col-span-2">Photo</span>
                    <span className="col-span-1"></span>
                  </div>

                  {opt.values.map((val, valIdx) => (
                    <div key={valIdx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. 2 Feet, Black"
                        value={val.label}
                        onChange={(e) => {
                          const updated = [...options]
                          updated[optIdx].values[valIdx].label = e.target.value
                          setOptions(updated)
                        }}
                        className="col-span-4 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={val.stock}
                        onChange={(e) => {
                          const updated = [...options]
                          updated[optIdx].values[valIdx].stock = Number(e.target.value)
                          setOptions(updated)
                        }}
                        className="col-span-2 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Default"
                        value={val.price !== undefined ? val.price : ''}
                        onChange={(e) => {
                          const updated = [...options]
                          const valNum = e.target.value === '' ? undefined : Number(e.target.value)
                          updated[optIdx].values[valIdx].price = valNum
                          setOptions(updated)
                        }}
                        className="col-span-3 rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-brand-500 text-center placeholder:text-slate-300"
                        title="Optional custom price for this variant (leave blank to use base price)"
                      />
                      <div className="col-span-2 flex items-center gap-1">
                        {val.image_url ? (
                          <div className="flex items-center gap-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={val.image_url} alt="" className="h-6 w-6 rounded object-cover border border-slate-200" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...options]
                                updated[optIdx].values[valIdx].image_url = ''
                                setOptions(updated)
                              }}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-1.5 py-1 rounded font-medium transition">
                            <Upload className="h-2.5 w-2.5" />
                            <span>Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('folder', 'variations')
                                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                const data = await res.json()
                                if (data.url) {
                                  const updated = [...options]
                                  updated[optIdx].values[valIdx].image_url = data.url
                                  setOptions(updated)
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeValueRow(optIdx, valIdx)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addValueRow(optIdx)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-bold mt-1"
                  >
                    <Plus className="h-3 w-3" /> Add Value
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">
      
      {/* UNIFIED SIDEBAR NAVIGATION */}
      <AdminSidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <h1 className="text-sm sm:text-lg font-bold text-slate-950 truncate">Catalog & Products</h1>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3 sm:px-4 py-2 shadow-sm transition"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showAddForm ? 'Close' : 'Add Product'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* ADD PRODUCT FORM */}
          {showAddForm && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in-down">
              <h2 className="text-xs sm:text-sm font-bold text-slate-950 pb-2 border-b border-slate-100 uppercase tracking-wide">
                Upload New Product to Catalogue
              </h2>
              
              <form onSubmit={handleCreateProduct} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rimless Low-Iron Aquarium"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Cascading Category Selector */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Categories (Select one or more) *
                      </label>
                      <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50 max-h-48 overflow-y-auto">
                        {parentCategories.map((parent) => {
                          const children = getSubcategories(parent.id)
                          const isParentChecked = selectedCategoryIds.includes(parent.id)

                          return (
                            <div key={parent.id} className="space-y-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isParentChecked}
                                  onChange={() => toggleCategory(parent.id, selectedCategoryIds, setSelectedCategoryIds)}
                                  className="text-brand-600 rounded"
                                />
                                <span>{parent.name}</span>
                              </label>

                              {children.length > 0 && (
                                <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-2">
                                  {children.map((child) => (
                                    <label key={child.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium hover:text-brand-600">
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoryIds.includes(child.id)}
                                        onChange={() => toggleCategory(child.id, selectedCategoryIds, setSelectedCategoryIds)}
                                        className="text-brand-600 rounded"
                                      />
                                      <span>{child.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Price, Cost & Stock */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Selling Price (৳) *</label>
                          <input
                            type="number"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="2500"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                            <span>Buying Cost (৳)</span>
                            <span className="text-[9px] text-amber-600 font-semibold uppercase">Hidden</span>
                          </label>
                          <input
                            type="number"
                            value={buyingPrice}
                            onChange={(e) => setBuyingPrice(e.target.value)}
                            placeholder="1800"
                            className="w-full rounded-xl border border-amber-200/80 bg-amber-50/20 px-3 py-2 text-xs outline-none focus:border-amber-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Old Price (৳)</label>
                          <input
                            type="number"
                            value={oldPrice}
                            onChange={(e) => setOldPrice(e.target.value)}
                            placeholder="3000"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">
                            {variationOptions.length > 0 ? 'Stock (Auto)' : 'Stock Units *'}
                          </label>
                          <input
                            type="number"
                            required
                            disabled={variationOptions.length > 0}
                            value={variationOptions.length > 0 ? computeTotalStock(variationOptions, stock) : stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-100 disabled:font-bold"
                          />
                        </div>
                      </div>

                      {/* Live Gross Margin Calculation */}
                      {price && Number(price) > 0 && buyingPrice && Number(buyingPrice) > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
                          <span className="text-emerald-800 font-medium">Estimated Gross Profit:</span>
                          <span className="font-bold text-emerald-700">
                            +৳{(Number(price) - Number(buyingPrice)).toLocaleString()} / unit 
                            ({Math.round(((Number(price) - Number(buyingPrice)) / Number(price)) * 100)}% margin)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Short Description (Product Card Preview) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Short Description (Card Summary)
                        </label>
                        <span className={`text-[10px] font-semibold ${shortDescription.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                          {shortDescription.length} / 150 chars (max 2-3 lines)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={180}
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Brief summary for storefront product cards..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Detailed Rich Text Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Full Product Description & Specs
                      </label>
                      <RichTextEditor
                        value={description}
                        onChange={setDescription}
                        placeholder="Write formatted product specifications, highlights, bullet points..."
                      />
                    </div>

                    {/* Special Collection Showcase Checkboxes */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Special Showcase Collections
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-brand-700">
                          <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                          <span>⭐ Featured</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-blue-700">
                          <input
                            type="checkbox"
                            checked={isBestSeller}
                            onChange={(e) => setIsBestSeller(e.target.checked)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>🏆 Best Seller</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-purple-700">
                          <input
                            type="checkbox"
                            checked={isTrending}
                            onChange={(e) => setIsTrending(e.target.checked)}
                            className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>🔥 Trending</span>
                        </label>
                      </div>
                    </div>

                    {/* Draft/Hide Option */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={isHidden}
                          onChange={(e) => setIsHidden(e.target.checked)}
                          className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span>Hide product from storefront (Draft / Private)</span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Media */}
                  <div className="space-y-4">
                    <ImageUploader
                      label="Product Media Gallery (Max 5 Images + 1 Video)"
                      description="Click to upload or drag files. The first image will be the primary cover photo."
                      value={images}
                      onChange={(newMedia) => setImages(newMedia)}
                      maxImages={5}
                      allowVideo={true}
                    />
                  </div>
                </div>

                {/* Variation Builder */}
                {renderVariationBuilder(variationOptions, setVariationOptions)}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md disabled:bg-slate-300 transition"
                  >
                    {loading ? 'Creating...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT PRODUCT MODAL */}
          {editingProduct && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in-down">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide truncate">
                  Edit Product: {editingProduct.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Categories *</label>
                      <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50 max-h-48 overflow-y-auto">
                        {parentCategories.map((parent) => {
                          const children = getSubcategories(parent.id)
                          const isParentChecked = editCategoryIds.includes(parent.id)

                          return (
                            <div key={parent.id} className="space-y-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isParentChecked}
                                  onChange={() => toggleCategory(parent.id, editCategoryIds, setEditCategoryIds)}
                                  className="text-brand-600 rounded"
                                />
                                <span>{parent.name}</span>
                              </label>

                              {children.length > 0 && (
                                <div className="pl-6 space-y-1 border-l-2 border-slate-200 ml-2">
                                  {children.map((child) => (
                                    <label key={child.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium hover:text-brand-600">
                                      <input
                                        type="checkbox"
                                        checked={editCategoryIds.includes(child.id)}
                                        onChange={() => toggleCategory(child.id, editCategoryIds, setEditCategoryIds)}
                                        className="text-brand-600 rounded"
                                      />
                                      <span>{child.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Price, Cost & Stock */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Selling Price (৳) *</label>
                          <input
                            type="number"
                            required
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                            <span>Buying Cost (৳)</span>
                            <span className="text-[9px] text-amber-600 font-semibold uppercase">Hidden</span>
                          </label>
                          <input
                            type="number"
                            value={editBuyingPrice}
                            onChange={(e) => setEditBuyingPrice(e.target.value)}
                            placeholder="Cost price"
                            className="w-full rounded-xl border border-amber-200/80 bg-amber-50/20 px-3 py-2 text-xs outline-none focus:border-amber-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Old Price (৳)</label>
                          <input
                            type="number"
                            value={editOldPrice}
                            onChange={(e) => setEditOldPrice(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">
                            {editVariationOptions.length > 0 ? 'Stock (Auto)' : 'Stock Units *'}
                          </label>
                          <input
                            type="number"
                            required
                            disabled={editVariationOptions.length > 0}
                            value={editVariationOptions.length > 0 ? computeTotalStock(editVariationOptions, editStock) : editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 disabled:bg-slate-100 disabled:font-bold"
                          />
                        </div>
                      </div>

                      {/* Live Gross Margin Calculation */}
                      {editPrice && Number(editPrice) > 0 && editBuyingPrice && Number(editBuyingPrice) > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px]">
                          <span className="text-emerald-800 font-medium">Estimated Gross Profit:</span>
                          <span className="font-bold text-emerald-700">
                            +৳{(Number(editPrice) - Number(editBuyingPrice)).toLocaleString()} / unit 
                            ({Math.round(((Number(editPrice) - Number(editBuyingPrice)) / Number(editPrice)) * 100)}% margin)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Short Description (Product Card Preview) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          Short Description (Card Summary)
                        </label>
                        <span className={`text-[10px] font-semibold ${editShortDescription.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                          {editShortDescription.length} / 150 chars (max 2-3 lines)
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={180}
                        value={editShortDescription}
                        onChange={(e) => setEditShortDescription(e.target.value)}
                        placeholder="Brief summary for storefront product cards..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Detailed Rich Text Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Full Product Description & Specs
                      </label>
                      <RichTextEditor
                        value={editDescription}
                        onChange={setEditDescription}
                        placeholder="Write formatted product specifications, highlights, bullet points..."
                      />
                    </div>

                    {/* Special Collection Showcase Checkboxes */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Special Showcase Collections
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-brand-700">
                          <input
                            type="checkbox"
                            checked={editIsFeatured}
                            onChange={(e) => setEditIsFeatured(e.target.checked)}
                            className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                          <span>⭐ Featured</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-blue-700">
                          <input
                            type="checkbox"
                            checked={editIsBestSeller}
                            onChange={(e) => setEditIsBestSeller(e.target.checked)}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>🏆 Best Seller</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 hover:text-purple-700">
                          <input
                            type="checkbox"
                            checked={editIsTrending}
                            onChange={(e) => setEditIsTrending(e.target.checked)}
                            className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>🔥 Trending</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={editIsHidden}
                          onChange={(e) => setEditIsHidden(e.target.checked)}
                          className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span>Hide product from storefront (Draft / Private)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ImageUploader
                      label="Product Media Gallery (Max 5 Images + 1 Video)"
                      description="Click to upload or drag files. The first image will be the primary cover photo."
                      value={editImages}
                      onChange={(newMedia) => setEditImages(newMedia)}
                      maxImages={5}
                      allowVideo={true}
                    />
                  </div>
                </div>

                {renderVariationBuilder(editVariationOptions, setEditVariationOptions)}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md disabled:bg-slate-300 transition"
                  >
                    {loading ? 'Saving...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PRODUCTS CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
            
            {/* Search and Counts Header Bar */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, category, price, slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <span className="text-xs font-bold text-slate-500 self-start sm:self-center">
                Showing {filteredProducts.length} of {products.length} products
              </span>
            </div>

            {/* 1. MOBILE RESPONSIVE PRODUCT CARDS */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Package className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">
                    {searchQuery ? `No products matching "${searchQuery}"` : 'No products in catalog yet.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center gap-1 text-brand-600 hover:underline font-bold text-xs pt-1"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const parsedOpts = parseProductVariations(product.variations, product.stock)
                  const firstImage = product.images?.[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'

                  return (
                    <div key={product.id} className="p-3.5 space-y-2.5 bg-white hover:bg-slate-50/50 transition">
                      {/* Top row: Thumbnail, Name, Slug, Pricing */}
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={firstImage}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-xs line-clamp-1">{product.name}</p>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">/{product.slug}</span>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-xs font-black text-slate-900">
                              ৳{Number(product.price).toLocaleString()}
                            </span>
                            {product.buying_price !== undefined && Number(product.buying_price) > 0 && (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Cost: ৳{Number(product.buying_price).toLocaleString()}
                              </span>
                            )}
                            {product.old_price > 0 && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ৳{Number(product.old_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock status */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {product.stock} in stock
                        </span>
                      </div>

                      {/* Middle row: Category & Showcase Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {product.categories?.name || 'Assigned'}
                        </span>
                        {product.is_featured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200">
                            ⭐ Featured
                          </span>
                        )}
                        {product.is_best_seller && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200">
                            🏆 Best Seller
                          </span>
                        )}
                        {product.is_trending && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-200">
                            🔥 Trending
                          </span>
                        )}
                        {parsedOpts.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({parsedOpts.length} options)
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Visibility toggle & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                            !product.is_hidden
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {!product.is_hidden ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Live on Store</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Draft (Hidden)</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* 2. DESKTOP RICH DATA TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('info')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                      >
                        <span>Product Info</span>
                        {sortField === 'info' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('category')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                      >
                        <span>Category</span>
                        {sortField === 'category' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('pricing')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                      >
                        <span>Pricing</span>
                        {sortField === 'pricing' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">
                      <button
                        onClick={() => handleSort('stock')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-900 font-bold uppercase transition"
                      >
                        <span>Stock</span>
                        {sortField === 'stock' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-brand-600" /> : <ArrowDown className="h-3 w-3 text-brand-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Variations</th>
                    <th className="p-4 text-center">Visibility</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Package className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-bold text-slate-700 text-xs">
                          {searchQuery ? `No products matching "${searchQuery}"` : 'No products in catalog yet.'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="inline-flex items-center gap-1 text-brand-600 hover:underline font-bold text-xs mt-2"
                          >
                            Clear Search Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const parsedOpts = parseProductVariations(product.variations, product.stock)
                      const firstImage = product.images?.[0] || 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5'

                      return (
                        <tr key={product.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={firstImage}
                                alt=""
                                className="h-10 w-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] font-mono text-slate-400">/{product.slug}</span>
                                  {product.is_featured && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-200">
                                      ⭐ Featured
                                    </span>
                                  )}
                                  {product.is_best_seller && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200">
                                      🏆 Best Seller
                                    </span>
                                  )}
                                  {product.is_trending && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-200">
                                      🔥 Trending
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {product.categories?.name || 'Assigned'}
                            </span>
                          </td>

                          <td className="p-4 font-semibold text-slate-900">
                            <p className="font-bold">৳{Number(product.price).toLocaleString()}</p>
                            {product.buying_price !== undefined && Number(product.buying_price) > 0 && (
                              <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                                Cost: <span className="font-semibold text-slate-700">৳{Number(product.buying_price).toLocaleString()}</span>
                                <span className="text-emerald-600 font-bold ml-1">
                                  (+৳{(Number(product.price) - Number(product.buying_price)).toLocaleString()})
                                </span>
                              </p>
                            )}
                            {product.old_price > 0 && (
                              <p className="text-[10px] text-slate-400 line-through">
                                ৳{Number(product.old_price).toLocaleString()}
                              </p>
                            )}
                          </td>

                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              product.stock > 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {product.stock} in stock
                            </span>
                          </td>

                          <td className="p-4">
                            {parsedOpts.length > 0 ? (
                              <div className="space-y-0.5">
                                {parsedOpts.map((opt, i) => (
                                  <p key={i} className="text-[11px] text-slate-600">
                                    <strong>{opt.name}:</strong> {opt.values.map(v => v.label).join(', ')}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">None</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(product)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                !product.is_hidden
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Click to toggle visibility"
                            >
                              {!product.is_hidden ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  <span>Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded transition"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
