import { NextRequest, NextResponse } from 'next/server'
import { SHOPIFY_STORE_URL } from '@/lib/cart'

/**
 * POST /api/generate-mockup
 *
 * Accepts the full design payload (shirt template, placed designs, colors, etc.)
 * and returns a public mockup image URL.
 *
 * Current implementation: returns a placeholder URL.
 * Future implementation: render the design onto the shirt template using
 * canvas / sharp / Puppeteer and upload to Vercel Blob or S3.
 *
 * Also returns Shopify config so the client never needs to know secrets.
 */
export async function POST(request: NextRequest) {
  try {
    const designPayload = await request.json()

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
    const shopifyStoreUrl = SHOPIFY_STORE_URL
    const variantId = designPayload.shopifyVariantId

    if (!variantId) {
      return NextResponse.json(
        {
          error:
            'This product is not yet connected to a Shopify variant. Please configure a variant ID for this shirt template.',
        },
        { status: 400 }
      )
    }

    // ---- Generate mockup (placeholder) --
    // TODO: Replace with real canvas rendering + image upload logic.
    // For now we echo back a placeholder image URL.
    const mockupUrl = `${shopifyStoreUrl}/placeholder-mockup.png`

    // ---- Response ------------------------
    return NextResponse.json({
      mockupUrl,
      shopifyStoreUrl,
      variantId,
      designPayload, // echo back for debugging / confirmation
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
