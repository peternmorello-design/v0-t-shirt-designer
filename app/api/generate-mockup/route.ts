import { NextResponse } from 'next/server'

/**
 * This route is deprecated. All mockup generation is now done client-side.
 * This file exists only to invalidate stale Turbopack cache entries.
 * Use /api/upload-mockup instead.
 */
export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Mockup generation is now done client-side.',
      redirect: '/api/upload-mockup'
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Mockup generation is now done client-side.',
      redirect: '/api/upload-mockup'
    },
    { status: 410 }
  )
}
