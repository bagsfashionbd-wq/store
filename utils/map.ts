/**
 * Convert any Google Maps link, full iframe code, or address into a valid embeddable iframe URL.
 */
export function formatGoogleMapsEmbedUrl(input: string): string {
  if (!input || !input.trim()) return ''
  const trimmed = input.trim()

  // 1. If user pasted the whole <iframe> tag, extract src="..."
  const matchSrc = trimmed.match(/src=["']([^"']+)["']/i)
  if (matchSrc && matchSrc[1]) {
    return matchSrc[1]
  }

  // 2. If it is already an official Google Maps /embed URL
  if (trimmed.includes('google.com/maps/embed') || trimmed.includes('/maps/embed/v1')) {
    return trimmed
  }

  // 3. If it is already a legacy embed with parameters
  if (trimmed.includes('output=embed')) {
    return trimmed
  }

  // 4. If it is a Google Maps place or search URL
  if (trimmed.includes('google.com/maps') || trimmed.includes('maps.google.com')) {
    // Extract place name after /place/
    const placeMatch = trimmed.match(/\/place\/([^\/@?#]+)/)
    if (placeMatch && placeMatch[1]) {
      const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`
    }

    // Extract query parameter ?q=
    const qMatch = trimmed.match(/[?&]q=([^&#]+)/)
    if (qMatch && qMatch[1]) {
      const query = decodeURIComponent(qMatch[1].replace(/\+/g, ' '))
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`
    }
  }

  // 5. Plain address / location query
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`
}
