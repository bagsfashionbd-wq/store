import axios from 'axios'
import { getStoreSettings } from '@/utils/settings'

// ==========================================
// 1. PATHAO COURIER HELPERS
// ==========================================
let cachedPathaoToken: string | null = null
let pathaoTokenExpiry: number | null = null

export async function getPathaoToken(customCreds?: {
  pathao_api_url?: string
  pathao_client_id?: string
  pathao_client_secret?: string
  pathao_username?: string
  pathao_password?: string
}): Promise<string> {
  const now = Date.now()
  if (!customCreds && cachedPathaoToken && pathaoTokenExpiry && now < pathaoTokenExpiry) {
    return cachedPathaoToken
  }

  const settings = await getStoreSettings()
  const pathao_api_url = (customCreds?.pathao_api_url || settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/$/, '')
  const pathao_client_id = (customCreds?.pathao_client_id || settings.pathao_client_id || process.env.PATHAO_CLIENT_ID || '').trim()
  const pathao_client_secret = (customCreds?.pathao_client_secret || settings.pathao_client_secret || process.env.PATHAO_CLIENT_SECRET || '').trim()
  const pathao_username = (customCreds?.pathao_username || settings.pathao_username || process.env.PATHAO_USERNAME || '').trim()
  const pathao_password = (customCreds?.pathao_password || settings.pathao_password || process.env.PATHAO_PASSWORD || '').trim()

  if (!pathao_client_id || !pathao_client_secret || !pathao_username || !pathao_password) {
    throw new Error('Pathao credentials (Client ID, Client Secret, Username, Password) are not configured.')
  }

  try {
    const response = await axios.post(`${pathao_api_url}/aladdin/api/v1/issue-token`, {
      client_id: pathao_client_id,
      client_secret: pathao_client_secret,
      grant_type: 'password',
      username: pathao_username,
      password: pathao_password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (response.data?.access_token) {
      const token = response.data.access_token as string
      if (!customCreds) {
        cachedPathaoToken = token
        pathaoTokenExpiry = now + 14 * 24 * 60 * 60 * 1000 // 14 days
      }
      return token
    }
    throw new Error('Failed to retrieve Pathao access token from response.')
  } catch (error: any) {
    const errData = error.response?.data
    console.error('Pathao Authentication Error Details:', errData || error.message)
    const detailedMsg = errData?.message || errData?.error_description || errData?.error || error.message
    throw new Error(`Pathao Authentication Failed: ${detailedMsg}`)
  }
}

export async function fetchPathaoStores(customCreds?: any): Promise<Array<{ store_id: number; store_name: string; store_address?: string }>> {
  const settings = await getStoreSettings()
  const pathao_api_url = (customCreds?.pathao_api_url || settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/$/, '')
  const token = await getPathaoToken(customCreds)

  const response = await axios.get(`${pathao_api_url}/aladdin/api/v1/stores`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  const rawList = response.data?.data?.data || response.data?.data || response.data || []
  if (Array.isArray(rawList)) {
    return rawList.map((s: any) => ({
      store_id: Number(s.store_id || s.id),
      store_name: s.store_name || s.name || `Store #${s.store_id || s.id}`,
      store_address: s.store_address || s.address || ''
    }))
  }
  return []
}

export async function bookPathaoConsignment(order: any, codAmount: number): Promise<string | null> {
  const settings = await getStoreSettings()
  const pathao_api_url = (settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/$/, '')
  const pathao_store_id = settings.pathao_store_id || process.env.PATHAO_STORE_ID

  if (!pathao_store_id) {
    throw new Error('Pathao Store ID is not configured. Please select your store in Settings > Shipping.')
  }

  try {
    const token = await getPathaoToken()
    
    const payload = {
      store_id: Number(pathao_store_id),
      merchant_order_id: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone,
      recipient_address: order.shipping_address,
      recipient_city: Number(order.city_id || 1),
      recipient_zone: Number(order.zone_id || 1),
      recipient_area: Number(order.area_id || 1),
      delivery_type: 48,
      item_type: 2,
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: codAmount,
      special_instruction: order.payment_method === 'COD' 
        ? `Prepaid Delivery Charge. Collect COD ৳${codAmount} product value.` 
        : 'Fully Prepaid. Collect ৳0 COD.'
    }

    const response = await axios.post(`${pathao_api_url}/aladdin/api/v1/orders`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (response.data?.data?.consignment_id) {
      return response.data.data.consignment_id
    }
    return null
  } catch (error: any) {
    console.error('Pathao Booking Error:', error.response?.data || error.message)
    return null
  }
}

// ==========================================
// 2. STEADFAST COURIER HELPERS
// ==========================================
export async function bookSteadfastConsignment(order: any, codAmount: number) {
  const settings = await getStoreSettings()
  const { steadfast_api_key, steadfast_secret_key, steadfast_base_url } = settings

  if (!steadfast_api_key || !steadfast_secret_key) {
    console.warn('Steadfast credentials not configured in settings')
    return null
  }

  const baseUrl = steadfast_base_url?.replace(/\/$/, '') || 'https://portal.steadfast.com.bd/api/v1'
  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`

  // Enrich address with city/zone/area details for Steadfast's AI Thana/Police Station auto-detection
  const extraLocations = [
    order.payment_details?.shipping_metadata?.area_name,
    order.payment_details?.shipping_metadata?.zone_name,
    order.payment_details?.shipping_metadata?.city_name
  ].filter(Boolean).join(', ')

  const fullRecipientAddress = extraLocations && !order.shipping_address.includes(extraLocations)
    ? `${order.shipping_address}, ${extraLocations}`
    : order.shipping_address

  const payload = {
    invoice: invoiceNumber,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone,
    recipient_address: fullRecipientAddress,
    cod_amount: Number(codAmount),
    note: order.payment_method === 'COD'
      ? `Prepaid Delivery Charge. Collect COD ৳${codAmount}.`
      : 'Fully Prepaid Order. Collect ৳0.'
  }

  try {
    const response = await axios.post(`${baseUrl}/create_order`, payload, {
      headers: {
        'Api-Key': steadfast_api_key,
        'Secret-Key': steadfast_secret_key,
        'Content-Type': 'application/json'
      }
    })

    if (response.data?.status === 200 && response.data?.consignment) {
      return {
        consignment_id: String(response.data.consignment.consignment_id),
        tracking_code: response.data.consignment.tracking_code,
        status: response.data.consignment.status
      }
    }
    return null
  } catch (error: any) {
    console.error('Steadfast Booking Error:', error.response?.data || error.message)
    return null
  }
}

export async function checkSteadfastStatus(cid?: string, trackingCode?: string) {
  const settings = await getStoreSettings()
  const { steadfast_api_key, steadfast_secret_key, steadfast_base_url } = settings

  if (!steadfast_api_key || !steadfast_secret_key) {
    throw new Error('Steadfast credentials not configured')
  }

  const baseUrl = steadfast_base_url?.replace(/\/$/, '') || 'https://portal.steadfast.com.bd/api/v1'
  let endpoint = ''

  if (cid) {
    endpoint = `${baseUrl}/status_by_cid/${cid}`
  } else if (trackingCode) {
    endpoint = `${baseUrl}/status_by_trackingcode/${trackingCode}`
  } else {
    throw new Error('Please provide Steadfast consignment ID or tracking code')
  }

  const response = await axios.get(endpoint, {
    headers: {
      'Api-Key': steadfast_api_key,
      'Secret-Key': steadfast_secret_key
    }
  })

  const raw = response.data
  const deliveryStatus = (raw?.delivery_status || raw?.consignment?.status || raw?.status || '').toString().toLowerCase().trim()

  return {
    delivery_status: deliveryStatus,
    raw
  }
}

export async function checkPathaoStatus(consignmentId: string) {
  const settings = await getStoreSettings()
  const pathao_api_url = settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com'

  const token = await getPathaoToken()
  const response = await axios.get(`${pathao_api_url}/aladdin/api/v1/orders/${consignmentId}/info`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })

  const raw = response.data?.data || response.data
  const orderStatus = (raw?.order_status || raw?.order_status_slug || raw?.status || '').toString().toLowerCase().trim()

  return {
    delivery_status: orderStatus,
    raw
  }
}
