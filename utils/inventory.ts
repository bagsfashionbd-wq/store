import { SupabaseClient } from '@supabase/supabase-js'

interface OrderItemInventory {
  product_id: string
  quantity: number
  selected_variations?: Record<string, string> | null
}

/**
 * Increment / restore stock for a single product and its selected variations
 */
export async function restoreProductStock(
  supabase: SupabaseClient,
  productId: string,
  quantity: number,
  selectedVariations?: Record<string, string> | null
) {
  if (!productId || quantity <= 0) return

  const { data: prod, error } = await supabase
    .from('products')
    .select('id, stock, variations')
    .eq('id', productId)
    .single()

  if (error || !prod) {
    console.error(`Failed to fetch product ${productId} for stock restoration:`, error)
    return
  }

  let updatedVariations = prod.variations
  if (
    updatedVariations &&
    typeof updatedVariations === 'object' &&
    Array.isArray(updatedVariations.options) &&
    updatedVariations.options.length > 0
  ) {
    const selectedVar = selectedVariations || {}
    updatedVariations.options = updatedVariations.options.map((opt: any) => {
      const selectedVal = selectedVar[opt.name] || selectedVar[opt.name?.toLowerCase()]
      if (selectedVal && Array.isArray(opt.values)) {
        opt.values = opt.values.map((v: any) => {
          if (v.label === selectedVal && typeof v.stock === 'number') {
            v.stock = (Number(v.stock) || 0) + quantity
          }
          return v
        })
      }
      return opt
    })

    const primaryOpt = updatedVariations.options[0]
    const totalStock = primaryOpt && Array.isArray(primaryOpt.values)
      ? primaryOpt.values.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
      : (Number(prod.stock) || 0) + quantity

    await supabase
      .from('products')
      .update({ stock: totalStock, variations: updatedVariations })
      .eq('id', productId)
  } else {
    await supabase
      .from('products')
      .update({ stock: (Number(prod.stock) || 0) + quantity })
      .eq('id', productId)
  }
}

/**
 * Decrement / deduct stock for a single product and its selected variations
 */
export async function deductProductStock(
  supabase: SupabaseClient,
  productId: string,
  quantity: number,
  selectedVariations?: Record<string, string> | null
) {
  if (!productId || quantity <= 0) return

  const { data: prod, error } = await supabase
    .from('products')
    .select('id, stock, variations')
    .eq('id', productId)
    .single()

  if (error || !prod) {
    console.error(`Failed to fetch product ${productId} for stock deduction:`, error)
    return
  }

  let updatedVariations = prod.variations
  if (
    updatedVariations &&
    typeof updatedVariations === 'object' &&
    Array.isArray(updatedVariations.options) &&
    updatedVariations.options.length > 0
  ) {
    const selectedVar = selectedVariations || {}
    updatedVariations.options = updatedVariations.options.map((opt: any) => {
      const selectedVal = selectedVar[opt.name] || selectedVar[opt.name?.toLowerCase()]
      if (selectedVal && Array.isArray(opt.values)) {
        opt.values = opt.values.map((v: any) => {
          if (v.label === selectedVal && typeof v.stock === 'number') {
            v.stock = Math.max(0, (Number(v.stock) || 0) - quantity)
          }
          return v
        })
      }
      return opt
    })

    const primaryOpt = updatedVariations.options[0]
    const totalStock = primaryOpt && Array.isArray(primaryOpt.values)
      ? primaryOpt.values.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
      : Math.max(0, (Number(prod.stock) || 0) - quantity)

    await supabase
      .from('products')
      .update({ stock: totalStock, variations: updatedVariations })
      .eq('id', productId)
  } else {
    await supabase
      .from('products')
      .update({ stock: Math.max(0, (Number(prod.stock) || 0) - quantity) })
      .eq('id', productId)
  }
}

/**
 * Restore inventory for all items in an order (e.g. when order is cancelled or deleted)
 */
export async function restoreOrderInventory(supabase: SupabaseClient, orderId: string) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity, selected_variations')
    .eq('order_id', orderId)

  if (error || !items || items.length === 0) return

  for (const item of items) {
    await restoreProductStock(
      supabase,
      item.product_id,
      Number(item.quantity) || 0,
      item.selected_variations
    )
  }
}

/**
 * Deduct inventory for all items in an order (e.g. when a cancelled order is reactivated)
 */
export async function deductOrderInventory(supabase: SupabaseClient, orderId: string) {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity, selected_variations')
    .eq('order_id', orderId)

  if (error || !items || items.length === 0) return

  for (const item of items) {
    await deductProductStock(
      supabase,
      item.product_id,
      Number(item.quantity) || 0,
      item.selected_variations
    )
  }
}
