import { ShirtSize } from './types'

/**
 * Shopify Store Configuration
 * 
 * This file centralizes all Shopify-related configuration.
 * Update these values to match your Shopify store and products.
 */

export const SHOPIFY_CONFIG = {
  /**
   * Your Shopify store URL (without trailing slash)
   * Can be overridden via NEXT_PUBLIC_SHOPIFY_STORE_URL env var
   */
  storeUrl: process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://ewvq3i-gd.myshopify.com',

  /**
   * Default product handle for the custom t-shirt
   * Can be overridden via NEXT_PUBLIC_SHOPIFY_PRODUCT_HANDLE env var
   */
  productHandle: process.env.NEXT_PUBLIC_SHOPIFY_PRODUCT_HANDLE || 'custom-tshirt',
}

/**
 * Resolve the Shopify variant ID for a given size and shirt template.
 * The variant IDs are stored on the ShirtTemplate object itself.
 * 
 * @param shopifyVariantIds - Map of size to variant ID from ShirtTemplate
 * @param size - Selected size
 * @returns Variant ID or null if not configured
 */
export function resolveVariantId(
  shopifyVariantIds: Partial<Record<ShirtSize, string>> | undefined,
  size: ShirtSize
): string | null {
  if (!shopifyVariantIds) return null
  return shopifyVariantIds[size] ?? null
}

/**
 * Build the Shopify cart URL
 */
export function getCartUrl(): string {
  return `${SHOPIFY_CONFIG.storeUrl}/cart`
}

/**
 * Build the Shopify checkout URL
 */
export function getCheckoutUrl(): string {
  return `${SHOPIFY_CONFIG.storeUrl}/checkout`
}
