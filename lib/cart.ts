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
  // Include shirt template dimensions for rendering
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
 * Includes shirt template dimensions needed for mockup rendering.
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
 * Load an image from URL and return a Promise that resolves with the HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Generate mockup image client-side using HTML Canvas.
 * Returns a base64 data URL of the generated mockup.
 */
async function generateMockupClientSide(payload: DesignPayload): Promise<string> {
  const shirtTemplate = payload.shirtTemplate
  if (!shirtTemplate) {
    throw new Error('Shirt template data is required for mockup generation')
  }

  const canvasWidth = shirtTemplate.canvas_width || 3000
  const canvasHeight = shirtTemplate.canvas_height || 3600
  const shirtOffsetX = shirtTemplate.shirt_offset_x || 400
  const shirtOffsetY = shirtTemplate.shirt_offset_y || 200

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  // Fill background
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw shirt template
  if (shirtTemplate.image_url) {
    try {
      const shirtImg = await loadImage(shirtTemplate.image_url)
      const shirtWidth = shirtTemplate.shirt_pixel_width || shirtImg.width
      const shirtHeight = shirtTemplate.shirt_pixel_height || shirtImg.height
      ctx.drawImage(shirtImg, shirtOffsetX, shirtOffsetY, shirtWidth, shirtHeight)
    } catch (err) {
      console.error('Failed to load shirt template image:', err)
    }
  }

  // Draw each placed template
  for (const placed of payload.placedTemplates) {
    if (!placed.imageUrl) continue

    try {
      const templateImg = await loadImage(placed.imageUrl)
      
      // Calculate position (relative to shirt offset)
      const drawX = shirtOffsetX + placed.x
      const drawY = shirtOffsetY + placed.y
      const drawWidth = placed.width
      const drawHeight = placed.height

      ctx.save()

      // Translate to center of template for rotation
      const centerX = drawX + drawWidth / 2
      const centerY = drawY + drawHeight / 2
      ctx.translate(centerX, centerY)
      
      // Apply rotation
      if (placed.rotation !== 0) {
        ctx.rotate((placed.rotation * Math.PI) / 180)
      }
      
      // Draw image centered at origin (after translation)
      ctx.drawImage(templateImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

      ctx.restore()
    } catch (err) {
      console.error(`Failed to load template image: ${placed.imageUrl}`, err)
    }
  }

  // Export as base64 PNG
  return canvas.toDataURL('image/png')
}

/**
 * Upload client-generated mockup to server and get back Blob URL
 */
async function uploadMockup(
  imageData: string,
  shirtTemplateId: string | null,
  variantId: string
): Promise<{ mockupUrl: string; shopifyStoreUrl: string; variantId: string }> {
  const res = await fetch('/api/upload-mockup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData,
      shirtTemplateId,
      variantId,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Failed to upload mockup')
  }

  return res.json()
}

/**
 * Add the product to the Shopify cart via the AJAX Cart API.
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
 * Full add-to-cart flow: generate mockup client-side -> upload to blob -> add to Shopify cart -> redirect.
 */
export async function handleAddToCartFlow(
  payload: DesignPayload,
  onStatusChange: (status: CartStatus) => void
): Promise<void> {
  try {
    // Step 1: Generate mockup client-side
    onStatusChange('generating-mockup')
    console.log('[v0] Starting add to cart flow with payload:', payload)
    
    if (!payload.shopifyVariantId) {
      throw new Error('This product is not yet connected to a Shopify variant. Please select a valid size.')
    }

    console.log('[v0] Generating mockup client-side...')
    const imageData = await generateMockupClientSide(payload)
    console.log('[v0] Mockup generated, data URL length:', imageData.length)

    // Step 2: Upload to blob storage
    console.log('[v0] Uploading mockup to /api/upload-mockup...')
    const { mockupUrl, shopifyStoreUrl, variantId } = await uploadMockup(
      imageData,
      payload.shirtTemplateId,
      payload.shopifyVariantId
    )
    console.log('[v0] Mockup uploaded successfully:', { mockupUrl, shopifyStoreUrl, variantId })

    // Step 3: Add to Shopify cart
    onStatusChange('adding-to-cart')
    console.log('[v0] Adding to Shopify cart...')
    await addToShopifyCart(payload, mockupUrl, shopifyStoreUrl, variantId)

    // Step 4: Redirect to Shopify cart
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
