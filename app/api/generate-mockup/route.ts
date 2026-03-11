import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import type { OverlayOptions } from 'sharp'
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
 * Uses Sharp (pure JavaScript image library) for serverless-compatible image compositing.
 * This avoids native binary dependencies that fail in Vercel serverless environments.
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

    // ---- Generate mockup using Sharp ---
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
        shirtTemplate: undefined,
      },
    })
  } catch (error: unknown) {
    console.error('Mockup generation error:', error)
    const message =
      error instanceof Error ? error.message : 'Mockup generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Fetch an image and return it as a Buffer.
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Resolve relative image URLs to absolute URLs for server-side fetching.
 */
function resolveImageUrl(url: string, request: NextRequest): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  
  const origin = forwardedHost 
    ? `${forwardedProto}://${forwardedHost}`
    : host 
      ? `${forwardedProto}://${host}`
      : 'http://localhost:3000'

  if (url.startsWith('/')) {
    return `${origin}${url}`
  }

  return `${origin}/${url}`
}

/**
 * Generate the mockup image by compositing the shirt template with placed designs.
 * Uses Sharp for serverless-compatible image processing.
 */
async function generateMockupImage(
  payload: DesignPayload,
  request: NextRequest
): Promise<Buffer> {
  const shirtTemplate = payload.shirtTemplate
  const canvasWidth = shirtTemplate?.canvas_width || 3000
  const canvasHeight = shirtTemplate?.canvas_height || 3600
  const shirtOffsetX = shirtTemplate?.shirt_offset_x || 400
  const shirtOffsetY = shirtTemplate?.shirt_offset_y || 200

  // Create base canvas with background color
  let composite = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 245, g: 245, b: 245, alpha: 1 },
    },
  })

  // Prepare composite layers
  const compositeInputs: OverlayOptions[] = []

  // Load and add shirt template image
  if (shirtTemplate?.image_url) {
    try {
      const shirtImageUrl = resolveImageUrl(shirtTemplate.image_url, request)
      const shirtBuffer = await fetchImageBuffer(shirtImageUrl)
      
      // Resize shirt image to specified dimensions
      const resizedShirt = await sharp(shirtBuffer)
        .resize(
          shirtTemplate.shirt_pixel_width || undefined,
          shirtTemplate.shirt_pixel_height || undefined,
          { fit: 'fill' }
        )
        .toBuffer()

      compositeInputs.push({
        input: resizedShirt,
        left: Math.round(shirtOffsetX),
        top: Math.round(shirtOffsetY),
      })
    } catch (err) {
      console.error('Failed to load shirt template image:', err)
    }
  }

  // Add each placed template
  for (const placed of payload.placedTemplates) {
    if (!placed.imageUrl) continue

    try {
      const templateImageUrl = resolveImageUrl(placed.imageUrl, request)
      const templateBuffer = await fetchImageBuffer(templateImageUrl)

      // Resize template to specified dimensions
      let templateSharp = sharp(templateBuffer).resize(
        Math.round(placed.width),
        Math.round(placed.height),
        { fit: 'fill' }
      )

      // Apply rotation if needed
      if (placed.rotation !== 0) {
        // Sharp rotation works in degrees, counter-clockwise
        // We need to rotate and then extract the rotated image
        templateSharp = templateSharp.rotate(placed.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
      }

      const processedTemplate = await templateSharp.toBuffer()

      // Get the metadata of the processed image to calculate correct positioning
      const metadata = await sharp(processedTemplate).metadata()
      const processedWidth = metadata.width || Math.round(placed.width)
      const processedHeight = metadata.height || Math.round(placed.height)

      // Calculate position adjustment for rotation (center the rotated image)
      const originalCenterX = shirtOffsetX + placed.x + placed.width / 2
      const originalCenterY = shirtOffsetY + placed.y + placed.height / 2
      const adjustedLeft = Math.round(originalCenterX - processedWidth / 2)
      const adjustedTop = Math.round(originalCenterY - processedHeight / 2)

      compositeInputs.push({
        input: processedTemplate,
        left: adjustedLeft,
        top: adjustedTop,
      })
    } catch (err) {
      console.error(`Failed to load template image: ${placed.imageUrl}`, err)
    }
  }

  // Apply all composites and output PNG
  if (compositeInputs.length > 0) {
    composite = composite.composite(compositeInputs)
  }

  return composite.png().toBuffer()
}
