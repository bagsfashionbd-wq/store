import { NextRequest, NextResponse } from 'next/server'
import { getStoreSettings } from '@/utils/settings'
import { getPathaoToken, fetchPathaoStores } from '@/utils/courier'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const cityId = searchParams.get('city_id')
  const zoneId = searchParams.get('zone_id')

  const settings = await getStoreSettings()
  const pathao_api_url = (settings.pathao_api_url || process.env.PATHAO_API_URL || 'https://courier-api-sandbox.pathao.com').replace(/\/$/, '')

  try {
    if (action === 'stores') {
      const stores = await fetchPathaoStores()
      return NextResponse.json({ success: true, data: stores })
    }

    const token = await getPathaoToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }

    if (action === 'cities') {
      const response = await axios.get(`${pathao_api_url}/aladdin/api/v1/city-list`, { headers })
      return NextResponse.json(response.data?.data?.data || [])
    }

    if (cityId) {
      const response = await axios.get(`${pathao_api_url}/aladdin/api/v1/cities/${cityId}/zone-list`, { headers })
      return NextResponse.json(response.data?.data?.data || [])
    }

    if (zoneId) {
      const response = await axios.get(`${pathao_api_url}/aladdin/api/v1/zones/${zoneId}/area-list`, { headers })
      return NextResponse.json(response.data?.data?.data || [])
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  } catch (error: any) {
    console.error('Pathao Fetch Error:', error.response?.data || error.message)
    return NextResponse.json({ error: error.message || 'Failed to fetch Pathao data' }, { status: 500 })
  }
}

// POST: Test credentials & fetch stores with uncommitted settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const stores = await fetchPathaoStores(body)
    return NextResponse.json({ success: true, data: stores })
  } catch (error: any) {
    console.error('Pathao Verify Error:', error.response?.data || error.message)
    return NextResponse.json({ success: false, error: error.message || 'Pathao verification failed' }, { status: 400 })
  }
}
