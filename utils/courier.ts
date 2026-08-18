import axios from 'axios'
import { getStoreSettings } from '@/utils/settings'

// ==========================================
// 1. PATHAO COURIER HELPERS
// ==========================================
let cachedPathaoToken: string | null = null
let pathaoTokenExpiry: number | null = null

export async function getPathaoToken(): Promise<string> {
  const now = Date.now()
  if (cachedPathaoToken && pathaoTokenExpiry && now < pathaoTokenExpiry) {
    return cachedPathaoToken
  }

  const settings = await getStoreSettings()
  const pathao_api_url = settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com'
  const pathao_client_id = settings.pathao_client_id || process.env.PATHAO_CLIENT_ID
  const pathao_client_secret = settings.pathao_client_secret || process.env.PATHAO_CLIENT_SECRET
  const pathao_username = settings.pathao_username || process.env.PATHAO_USERNAME
  const pathao_password = settings.pathao_password || process.env.PATHAO_PASSWORD

  if (!pathao_client_id || !pathao_client_secret || !pathao_username || !pathao_password) {
    throw new Error('Pathao credentials are not configured in settings.')
  }

  try {
    const response = await axios.post(`${pathao_api_url}/aladdin/api/v1/issue-token`, {
      client_id: pathao_client_id,
      client_secret: pathao_client_secret,
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
      cachedPathaoToken = token
      pathaoTokenExpiry = now + 14 * 24 * 60 * 60 * 1000 // 14 days
      return token
    }
    throw new Error('Failed to retrieve Pathao access token')
  } catch (error: any) {
    console.error('Pathao Authentication Error:', error.response?.data || error.message)
    throw new Error('Pathao Authentication Failed')
  }
}

export async function bookPathaoConsignment(order: any, codAmount: number): Promise<string | null> {
  const settings = await getStoreSettings()
  const pathao_api_url = settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com'
  const pathao_store_id = settings.pathao_store_id || process.env.PATHAO_STORE_ID

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

  const payload = {
    invoice: invoiceNumber,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone,
    recipient_address: order.shipping_address,
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
