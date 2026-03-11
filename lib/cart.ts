import { DesignState, PlacedTemplate, Template, ShirtTemplate, ShirtSize } from './types'
import { SHOPIFY_CONFIG, resolveVariantId, getCartUrl } from './shopify-config'

/**
 * Serializable design payload sent to the backend for mockup generation
 * and attached as Shopify line item properties.
 */
export interface DesignPayload {
  shirtTemplateId: string | null
  shirtTemplateName: string
  productType: string
  view: 'front' | 'back'
  shirtColor: string
  selectedSize: ShirtSize
  shopifyVariantId: string | null
  placedTemplates: Array<{
    templateId: string
    templateName: string
    x: number
    y: number
    rotation: number
    width: number
    height: number
    imageUrl: string
  }>
  // Include shirt template dimensions for server-side rendering
  shirtTemplate?: {
    canvas_width: number
    canvas_height: number
    shirt_pixel_width: number
    shirt_pixel_height: number
    shirt_offset_x: number
    shirt_offset_y: number
    printable_x: number
    printable_y: number
    printable_width: number
    printable_height: number
    image_url: string
  }
}

export type CartStatus =
  | 'idle'
  | 'generating-mockup'
  | 'adding-to-cart'
  | 'redirecting'
  | 'error'

export const CART_STATUS_LABELS: Record<CartStatus, string> = {
  idle: 'Add to Cart',
  'generating-mockup': 'Generating Preview...',
  'adding-to-cart': 'Adding to Cart...',
  redirecting: 'Redirecting...',
  error: 'Add to Cart',
}

/**
 * Build a clean, JSON-serializable design payload from the current design state.
 * Includes shirt template dimensions needed for server-side mockup rendering.
 */
export function buildDesignPayload(
  designState: DesignState,
  templates: Template[],
  shirtTemplate: ShirtTemplate | null
): DesignPayload {
  return {
    shirtTemplateId: designState.shirtTemplateId,
    shirtTemplateName: shirtTemplate?.name ?? '',
    productType: shirtTemplate?.product_type ?? '',
    view: designState.view,
    shirtColor: designState.shirtColor,
    selectedSize: designState.selectedSize,
    shopifyVariantId: resolveVariantId(shirtTemplate?.shopifyVariantIds, designState.selectedSize),
    placedTemplates: designState.placedTemplates.map((placed) => {
      const tmpl = templates.find((t) => t.id === placed.templateId)
      return {
        templateId: placed.templateId,
        templateName: tmpl?.name ?? '',
        x: placed.x,
        y: placed.y,
        rotation: placed.rotation,
        width: tmpl?.width ?? 0,
        height: tmpl?.height ?? 0,
        imageUrl: tmpl?.image_url ?? '',
      }
    }),
    // Include shirt template data for server-side rendering
    shirtTemplate: shirtTemplate ? {
      canvas_width: shirtTemplate.canvas_width,
      canvas_height: shirtTemplate.canvas_height,
      shirt_pixel_width: shirtTemplate.shirt_pixel_width,
      shirt_pixel_height: shirtTemplate.shirt_pixel_height,
      shirt_offset_x: shirtTemplate.shirt_offset_x,
      shirt_offset_y: shirtTemplate.shirt_offset_y,
      printable_x: shirtTemplate.printable_x,
      printable_y: shirtTemplate.printable_y,
      printable_width: shirtTemplate.printable_width,
      printable_height: shirtTemplate.printable_height,
      image_url: shirtTemplate.image_url,
    } : undefined,
  }
}

/**
 * Call the generate-mockup API route and return the resulting public image URL.
 */
export async function generateMockup(
  payload: DesignPayload
): Promise<string> {
  const res = await fetch('/api/generate-mockup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Failed to generate mockup')
  }

  const data = await res.json()
  return data.mockupUrl as string
}

/**
 * Add the product to the Shopify cart via the AJAX Cart API.
 *
 * The Shopify store URL and variant ID come from the /api/generate-mockup
 * response (or environment). The function posts to the store's /cart/add.js
 * endpoint and then redirects to the store cart.
 */
export async function addToShopifyCart(
  payload: DesignPayload,
  mockupUrl: string,
  shopifyStoreUrl: string,
  variantId: string
): Promise<void> {
  const lineItemProperties: Record<string, string> = {
    _mockup_url: mockupUrl,
    _product_type: payload.productType,
    _shirt_color: payload.shirtColor,
    _view: payload.view,
    _size: payload.selectedSize,
    _design_json: JSON.stringify(payload.placedTemplates),
  }

  // Add individual template names for display in Shopify admin
  payload.placedTemplates.forEach((t, i) => {
    lineItemProperties[`Design ${i + 1}`] = t.templateName
  })

  const cartPayload = {
    items: [
      {
        id: parseInt(variantId, 10),
        quantity: 1,
        properties: lineItemProperties,
      },
    ],
  }

  const res = await fetch(`${shopifyStoreUrl}/cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cartPayload),
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.description ?? body.message ?? 'Failed to add to Shopify cart')
  }
}

/**
 * Full add-to-cart flow: generate mockup -> add to Shopify cart -> redirect.
 * Returns a status updater so the caller can reflect loading states.
 */
export async function handleAddToCartFlow(
  payload: DesignPayload,
  onStatusChange: (status: CartStatus) => void
): Promise<void> {
  try {
    // Step 1: Generate mockup
    onStatusChange('generating-mockup')
    const result = await fetch('/api/generate-mockup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!result.ok) {
      const body = await result.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to generate mockup')
    }

    const { mockupUrl, shopifyStoreUrl, variantId } = await result.json()

    // Step 2: Add to Shopify cart
    onStatusChange('adding-to-cart')
    await addToShopifyCart(payload, mockupUrl, shopifyStoreUrl, variantId)

    // Step 3: Redirect to Shopify cart
    onStatusChange('redirecting')
    window.location.href = getCartUrl()
  } catch (err) {
    onStatusChange('error')
    throw err
  }
}

// Re-export Shopify config URL for backwards compatibility
export { SHOPIFY_CONFIG as SHOPIFY_STORE_URL_CONFIG }
export const SHOPIFY_STORE_URL = SHOPIFY_CONFIG.storeUrl
