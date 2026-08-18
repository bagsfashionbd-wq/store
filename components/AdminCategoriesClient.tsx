'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AdminSidebar from '@/components/AdminSidebar'
import { 
  BarChart3, ShoppingBag, Package, LogOut, Plus, Trash2, Edit2, 
  FolderTree, Folder, FolderPlus, Layers, ShieldCheck, ChevronRight, Settings, X
} from 'lucide-react'

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  created_at?: string
}

interface AdminCategoriesProps {
  initialCategories: Category[]
}

export default function AdminCategoriesClient({ initialCategories }: AdminCategoriesProps) {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>(initialCategories)

  // Modals / forms
  const [showAddParent, setShowAddParent] = useState(false)
  const [showAddChildFor, setShowAddChildFor] = useState<Category | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/stradmn/login')
    router.refresh()
  }

  // Create Category
  const handleCreate = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          parent_id: parentId
        })
      })

      const resJson = await response.json()
      if (!response.ok) throw new Error(resJson.error || 'Failed to create category')

      setCategories((prev) => [...prev, resJson.data].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setSlug('')
      setDescription('')
      setShowAddParent(false)
      setShowAddChildFor(null)
    } catch (err: any) {
      alert(err.message || 'Error creating category')
    } finally {
      setLoading(false)
    }
  }

  // Update Category
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name,
          slug,
          description,
          parent_id: editingCategory.parent_id
        })
      })

      const resJson = await response.json()
      if (!response.ok) throw new Error(resJson.error || 'Failed to update category')

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? resJson.data : c))
      )
      setEditingCategory(null)
    } catch (err: any) {
      alert(err.message || 'Error updating category')
    } finally {
      setLoading(false)
    }
  }

  // Delete Category
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Any subcategories will become top-level categories.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!response.ok) throw new Error('Failed to delete category')

      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err.message || 'Error deleting category')
    }
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || '')
  }

  // Separate parent and child categories
  const parentCategories = categories.filter((c) => !c.parent_id)
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 text-slate-800">
      
      {/* UNIFIED SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
          <h1 className="text-sm sm:text-lg font-bold text-slate-950 truncate">Category Hierarchy</h1>
          <button 
            onClick={() => {
              setName('')
              setSlug('')
              setDescription('')
              setShowAddParent(!showAddParent)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3 sm:px-4 py-2 shadow-sm transition"
          >
            {showAddParent ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showAddParent ? 'Close' : 'Add Root Category'}</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* ADD ROOT CATEGORY MODAL */}
          {showAddParent && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 animate-fade-in-down">
              <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide mb-2 flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-brand-600" /> Create Level 1 Root Category
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Root categories appear at the very top of your storefront navigation and can have nested subcategories.
              </p>
              <form onSubmit={(e) => handleCreate(e, null)} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                    }}
                    placeholder="e.g. Aquarium Equipment, Live Fish, Accessories"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. aquarium-equipment"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description for SEO..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 disabled:bg-slate-300 shadow-sm transition"
                  >
                    {loading ? 'Creating...' : 'Save Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddParent(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADD SUBCATEGORY MODAL */}
          {showAddChildFor && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 animate-fade-in-down">
              <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide mb-2 flex items-center gap-2 truncate">
                <FolderPlus className="h-4 w-4 text-brand-600 flex-shrink-0" /> 
                <span>Add Subcategory under "{showAddChildFor.name}"</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                This item will be nested under <strong>{showAddChildFor.name}</strong> in the 3-tier storefront navigation tree.
              </p>
              <form onSubmit={(e) => handleCreate(e, showAddChildFor.id)} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                    }}
                    placeholder="e.g. Canister Filters, Rimless Tanks"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. canister-filters"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief subcategory description..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 disabled:bg-slate-300 shadow-sm transition"
                  >
                    {loading ? 'Creating...' : 'Save Subcategory'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddChildFor(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT MODAL */}
          {editingCategory && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 animate-fade-in-down">
              <h2 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide mb-4 flex items-center gap-2 truncate">
                <Edit2 className="h-4 w-4 text-brand-600 flex-shrink-0" /> Edit Category: {editingCategory.name}
              </h2>
              <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 disabled:bg-slate-300 shadow-sm transition"
                  >
                    {loading ? 'Saving...' : 'Update Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3-TIER CATEGORIES TREE */}
          <div className="space-y-3 sm:space-y-4">
            {parentCategories.map((parent) => {
              const level2Children = getChildren(parent.id)

              return (
                <div key={parent.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* LEVEL 1: Parent Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{parent.name}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold bg-brand-100/70 text-brand-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Level 1
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                            /{parent.slug}
                          </span>
                        </div>
                        {parent.description && (
                          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{parent.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setName('')
                          setSlug('')
                          setDescription('')
                          setShowAddChildFor(parent)
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-brand-700 text-xs font-bold px-2.5 sm:px-3 py-1.5 transition shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Subcategory</span>
                      </button>
                      <button
                        onClick={() => openEdit(parent)}
                        className="p-1.5 sm:p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(parent.id, parent.name)}
                        className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* LEVEL 2 & LEVEL 3 CHILDREN */}
                  {level2Children.length > 0 ? (
                    <div className="divide-y divide-slate-100 bg-white">
                      {level2Children.map((level2) => {
                        const level3Children = getChildren(level2.id)

                        return (
                          <div key={level2.id} className="space-y-0">
                            
                            {/* LEVEL 2 ROW */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 sm:py-3 px-4 sm:px-6 pl-6 sm:pl-10 hover:bg-slate-50/70 transition gap-2">
                              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                <ChevronRight className="h-4 w-4 text-brand-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span className="text-xs font-bold text-slate-800 truncate">{level2.name}</span>
                                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase">
                                      Level 2
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">/{level2.slug}</span>
                                  </div>
                                  {level2.description && (
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1">{level2.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  onClick={() => {
                                    setName('')
                                    setSlug('')
                                    setDescription('')
                                    setShowAddChildFor(level2)
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-50 hover:bg-brand-50 border border-slate-200 text-slate-700 hover:text-brand-700 text-[10px] sm:text-[11px] font-bold px-2 py-1 transition"
                                  title="Add 3rd-level child under this category"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Sub-child</span>
                                </button>
                                <button
                                  onClick={() => openEdit(level2)}
                                  className="p-1 text-slate-400 hover:text-brand-600 rounded-lg transition"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(level2.id, level2.name)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* LEVEL 3 ROWS */}
                            {level3Children.length > 0 && (
                              <div className="bg-slate-50/50 divide-y divide-slate-100 border-l-2 border-brand-300 ml-6 sm:ml-12 my-1 rounded-r-xl">
                                {level3Children.map((level3) => (
                                  <div key={level3.id} className="flex items-center justify-between py-2 px-3 sm:px-4 pl-4 sm:pl-6 hover:bg-slate-100/70 transition">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                      <span className="text-xs font-semibold text-slate-700 truncate">{level3.name}</span>
                                      <span className="text-[8px] sm:text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded uppercase">
                                        Level 3
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => openEdit(level3)}
                                        className="p-1 text-slate-400 hover:text-brand-600 rounded transition"
                                        title="Edit"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(level3.id, level3.name)}
                                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-2.5 px-4 pl-8 sm:pl-10 text-xs text-slate-400 italic">
                      No subcategories added under this category yet.
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </main>
      </div>
    </div>
  )
}
