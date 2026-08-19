/**
 * Formats an external URL so that relative-looking URLs (like "instagram.com/xyz")
 * are automatically prepended with "https://" to avoid navigating to localhost:3000/instagram.com.
 */
export function formatExternalUrl(url?: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}
