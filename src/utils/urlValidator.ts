/**
 * URL Validation Utility
 *
 * Validates and sanitizes URLs to prevent XSS and other injection attacks.
 * Particularly important for NFT metadata which comes from external sources.
 */

/**
 * Allowed URL schemes for different contexts
 */
const ALLOWED_SCHEMES = {
  image: ['https:', 'http:', 'ipfs:', 'data:'],
  link: ['https:', 'http:'],
  api: ['https:'],
};

/**
 * Trusted IPFS gateways
 */
const TRUSTED_IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
];

/**
 * Check if a URL is valid and uses an allowed scheme
 */
export function isValidUrl(url: string, context: keyof typeof ALLOWED_SCHEMES = 'link'): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Handle IPFS URLs
    if (url.startsWith('ipfs://')) {
      return context === 'image' || context === 'link';
    }

    // Handle data URLs (only for images)
    if (url.startsWith('data:')) {
      if (context !== 'image') {
        return false;
      }
      // Only allow image data URLs
      return url.startsWith('data:image/');
    }

    const parsed = new URL(url);
    const allowedSchemes = ALLOWED_SCHEMES[context];

    return allowedSchemes.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize an IPFS URL to use a trusted gateway
 */
export function sanitizeIpfsUrl(url: string): string {
  if (!url) {
    return '';
  }

  // Already using a gateway
  if (url.startsWith('https://') || url.startsWith('http://')) {
    // Check if it's a trusted gateway
    const isTrusted = TRUSTED_IPFS_GATEWAYS.some(gateway => url.startsWith(gateway));
    if (isTrusted) {
      return url;
    }

    // Extract CID from URL and use trusted gateway
    const ipfsMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (ipfsMatch) {
      return `${TRUSTED_IPFS_GATEWAYS[0]}${ipfsMatch[1]}`;
    }

    return url; // Return as-is if can't extract CID
  }

  // Convert ipfs:// to https gateway
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `${TRUSTED_IPFS_GATEWAYS[0]}${cid}`;
  }

  // Handle bare CID
  if (/^[a-zA-Z0-9]{46,}$/.test(url)) {
    return `${TRUSTED_IPFS_GATEWAYS[0]}${url}`;
  }

  return url;
}

/**
 * Sanitize an image URL
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) {
    return '';
  }

  // Handle IPFS URLs
  if (url.startsWith('ipfs://') || url.includes('/ipfs/')) {
    return sanitizeIpfsUrl(url);
  }

  // Validate URL
  if (!isValidUrl(url, 'image')) {
    console.warn(`⚠️ Invalid image URL blocked: ${url.substring(0, 50)}...`);
    return '';
  }

  // Block javascript: URLs
  if (url.toLowerCase().startsWith('javascript:')) {
    console.warn('⚠️ JavaScript URL blocked in image src');
    return '';
  }

  return url;
}

/**
 * Sanitize NFT metadata to prevent XSS
 */
export function sanitizeNftMetadata(metadata: any): any {
  if (!metadata || typeof metadata !== 'object') {
    return metadata;
  }

  const sanitized = { ...metadata };

  // Sanitize image URL
  if (sanitized.image) {
    sanitized.image = sanitizeImageUrl(sanitized.image);
  }

  // Sanitize animation URL
  if (sanitized.animation_url) {
    sanitized.animation_url = sanitizeImageUrl(sanitized.animation_url);
  }

  // Sanitize external URL
  if (sanitized.external_url) {
    if (!isValidUrl(sanitized.external_url, 'link')) {
      sanitized.external_url = '';
    }
  }

  // Strip HTML from text fields
  if (sanitized.name && typeof sanitized.name === 'string') {
    sanitized.name = stripHtml(sanitized.name);
  }

  if (sanitized.description && typeof sanitized.description === 'string') {
    sanitized.description = stripHtml(sanitized.description);
  }

  return sanitized;
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  // Remove HTML tags
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Validate and sanitize a wallet address
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Check format: 0x followed by 40 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars + 3) {
    return address || '';
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export default {
  isValidUrl,
  sanitizeIpfsUrl,
  sanitizeImageUrl,
  sanitizeNftMetadata,
  stripHtml,
  isValidAddress,
  truncateAddress,
};
