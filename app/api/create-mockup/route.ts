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
 * Generates a mockup image using Sharp and uploads to Vercel Blob.
 */
export async function POST(request: NextRequest) {
  try {
    const designPayload: DesignPayload = await request.json()

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

    const mockupBuffer = await generateMockupWithSharp(designPayload, request)

    const timestamp = Date.now()
    const filename = `mockups/design-${designPayload.shirtTemplateId}-${timestamp}.png`

    const blob = await put(filename, mockupBuffer, {
      access: 'public',
      contentType: 'image/png',
    })

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

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

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

async function generateMockupWithSharp(
  payload: DesignPayload,
  request: NextRequest
): Promise<Buffer> {
  const shirtTemplate = payload.shirtTemplate
  const canvasWidth = shirtTemplate?.canvas_width || 3000
  const canvasHeight = shirtTemplate?.canvas_height || 3600
  const shirtOffsetX = shirtTemplate?.shirt_offset_x || 400
  const shirtOffsetY = shirtTemplate?.shirt_offset_y || 200

  let composite = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 245, g: 245, b: 245, alpha: 1 },
    },
  })

  const compositeInputs: OverlayOptions[] = []

  if (shirtTemplate?.image_url) {
    try {
      const shirtImageUrl = resolveImageUrl(shirtTemplate.image_url, request)
      const shirtBuffer = await fetchImageBuffer(shirtImageUrl)

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

  for (const placed of payload.placedTemplates) {
    if (!placed.imageUrl) continue

    try {
      const templateImageUrl = resolveImageUrl(placed.imageUrl, request)
      const templateBuffer = await fetchImageBuffer(templateImageUrl)

      let templateSharp = sharp(templateBuffer).resize(
        Math.round(placed.width),
        Math.round(placed.height),
        { fit: 'fill' }
      )

      if (placed.rotation !== 0) {
        templateSharp = templateSharp.rotate(placed.rotation, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
      }

      const processedTemplate = await templateSharp.toBuffer()

      const metadata = await sharp(processedTemplate).metadata()
      const processedWidth = metadata.width || Math.round(placed.width)
      const processedHeight = metadata.height || Math.round(placed.height)

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

  if (compositeInputs.length > 0) {
    composite = composite.composite(compositeInputs)
  }

  return composite.png().toBuffer()
}
