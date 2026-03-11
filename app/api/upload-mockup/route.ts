import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { SHOPIFY_CONFIG } from '@/lib/shopify-config'

/**
 * POST /api/upload-mockup
 * 
 * Receives a base64-encoded mockup image generated client-side,
 * uploads it to Vercel Blob, and returns the public URL along with
 * Shopify checkout details.
 * 
 * All image compositing is done client-side using HTML Canvas.
 * The server only handles the Blob upload - no image processing libraries required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageData, shirtTemplateId, variantId } = body

    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing imageData' },
        { status: 400 }
      )
    }

    if (!variantId) {
      return NextResponse.json(
        { error: 'Missing Shopify variant ID. Please configure a variant for this shirt template.' },
        { status: 400 }
      )
    }

    // Extract base64 data from data URL
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const filename = `mockups/design-${shirtTemplateId || 'custom'}-${timestamp}.png`

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    })

    return NextResponse.json({
      mockupUrl: blob.url,
      shopifyStoreUrl: SHOPIFY_CONFIG.storeUrl,
      variantId,
    })
  } catch (error: unknown) {
    console.error('Upload mockup error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
