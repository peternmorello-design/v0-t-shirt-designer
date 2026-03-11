import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { SHOPIFY_CONFIG } from '@/lib/shopify-config'

interface PlacedTemplatePayload {
  templateId: string
  templateName: string
  x: number
  y: number
  rotation: number
  width: number
  height: number
  imageUrl: string
}

interface DesignPayload {
  shirtTemplateId: string | null
  shirtTemplateName: string
  productType: string
  view: 'front' | 'back'
  shirtColor: string
  selectedSize: string
  shopifyVariantId: string | null
  placedTemplates: PlacedTemplatePayload[]
  // Shirt template dimensions for rendering
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

/**
 * POST /api/generate-mockup
 *
 * Accepts the full design payload (shirt template, placed designs, colors, etc.)
 * and returns a public mockup image URL stored in Vercel Blob.
 *
 * The mockup is generated server-side by compositing the shirt template image
 * with all placed design templates at their specified positions/rotations.
 */
export async function POST(request: NextRequest) {
  try {
    const designPayload: DesignPayload = await request.json()

    // ---- Validate required fields -------
    if (!designPayload || !designPayload.shirtTemplateId) {
      return NextResponse.json(
        { error: 'Missing design payload or shirtTemplateId' },
        { status: 400 }
      )
    }

    if (
      !designPayload.placedTemplates ||
      designPayload.placedTemplates.length === 0
    ) {
      return NextResponse.json(
        { error: 'No designs placed on the shirt' },
        { status: 400 }
      )
    }

    // ---- Shopify config -----------------
    const shopifyStoreUrl = SHOPIFY_CONFIG.storeUrl
    const variantId = designPayload.shopifyVariantId

    if (!variantId) {
      return NextResponse.json(
        {
          error:
            'This product is not yet connected to a Shopify variant. Please configure a variant ID for this shirt template in the admin panel.',
        },
        { status: 400 }
      )
    }

    // ---- Generate mockup using canvas ---
    const mockupBuffer = await generateMockupImage(designPayload, request)
    
    // ---- Upload to Vercel Blob ----------
    const timestamp = Date.now()
    const filename = `mockups/design-${designPayload.shirtTemplateId}-${timestamp}.png`
    
    const blob = await put(filename, mockupBuffer, {
      access: 'public',
      contentType: 'image/png',
    })

    // ---- Response ------------------------
    return NextResponse.json({
      mockupUrl: blob.url,
      shopifyStoreUrl,
      variantId,
      designPayload: {
        ...designPayload,
        shirtTemplate: undefined, // Don't echo back the full template data
      },
    })
  } catch (error: unknown) {
    console.error('Mockup generation error:', error)
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Generate the mockup image by compositing the shirt template with placed designs.
 * Uses node-canvas for server-side rendering.
 */
async function generateMockupImage(
  payload: DesignPayload,
  request: NextRequest
): Promise<Buffer> {
  // Dynamic import for canvas (only available server-side)
  const { createCanvas, loadImage } = await import('canvas')

  // Get shirt template dimensions
  const shirtTemplate = payload.shirtTemplate
  const canvasWidth = shirtTemplate?.canvas_width || 3000
  const canvasHeight = shirtTemplate?.canvas_height || 3600
  const shirtOffsetX = shirtTemplate?.shirt_offset_x || 400
  const shirtOffsetY = shirtTemplate?.shirt_offset_y || 200

  // Create the canvas
  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

  // Fill background with a neutral color
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Load and draw the shirt template image
  if (shirtTemplate?.image_url) {
    try {
      const shirtImageUrl = resolveImageUrl(shirtTemplate.image_url, request)
      const shirtImage = await loadImage(shirtImageUrl)
      
      // Draw shirt at its offset position with its pixel dimensions
      ctx.drawImage(
        shirtImage,
        shirtOffsetX,
        shirtOffsetY,
        shirtTemplate.shirt_pixel_width || shirtImage.width,
        shirtTemplate.shirt_pixel_height || shirtImage.height
      )
    } catch (err) {
      console.error('Failed to load shirt template image:', err)
      // Continue without shirt image - will still render the designs
    }
  }

  // Draw each placed template
  for (const placed of payload.placedTemplates) {
    if (!placed.imageUrl) continue

    try {
      const templateImageUrl = resolveImageUrl(placed.imageUrl, request)
      const templateImage = await loadImage(templateImageUrl)

      // Save context state
      ctx.save()

      // Calculate the center of the template for rotation
      const centerX = shirtOffsetX + placed.x + placed.width / 2
      const centerY = shirtOffsetY + placed.y + placed.height / 2

      // Translate to center, rotate, translate back
      ctx.translate(centerX, centerY)
      ctx.rotate((placed.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)

      // Draw the template image
      ctx.drawImage(
        templateImage,
        shirtOffsetX + placed.x,
        shirtOffsetY + placed.y,
        placed.width,
        placed.height
      )

      // Restore context state
      ctx.restore()
    } catch (err) {
      console.error(`Failed to load template image: ${placed.imageUrl}`, err)
      // Continue with other templates
    }
  }

  // Convert canvas to PNG buffer
  return canvas.toBuffer('image/png')
}

/**
 * Resolve relative image URLs to absolute URLs for server-side fetching.
 */
function resolveImageUrl(url: string, request: NextRequest): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Get the origin from the request
  const origin = request.headers.get('origin') || 
    request.headers.get('host')?.replace(/^([^:]+)(:\d+)?$/, (_, host, port) => 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${host}${port || ''}`
    ) || 
    'http://localhost:3000'

  // Handle relative URLs
  if (url.startsWith('/')) {
    return `${origin}${url}`
  }

  return `${origin}/${url}`
}
