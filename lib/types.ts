export interface Template {
  id: string
  name: string
  image_url: string
  category: string
  width: number
  height: number
  default_x: number
  default_y: number
  rotation: number
  enabled: boolean
  created_at: string
}

export type ShirtSize = 'S' | 'M' | 'L' | 'XL'

export const SHIRT_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL']

export const SHIRT_SIZE_LABELS: Record<ShirtSize, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'X-Large',
}

export interface ShirtTemplate {
  id: string
  name: string
  product_type: string
  view: 'front' | 'back'
  image_url: string
  // Canvas dimensions (overall workspace)
  canvas_width: number
  canvas_height: number
  // Shirt image pixel dimensions (independent from canvas)
  shirt_pixel_width: number
  shirt_pixel_height: number
  // Shirt position offset on canvas
  shirt_offset_x: number
  shirt_offset_y: number
  // Printable area relative to shirt (not canvas)
  printable_x: number
  printable_y: number
  printable_width: number
  printable_height: number
  enabled: boolean
  created_at: string
  // Map of size -> Shopify variant ID. Sizes without IDs are not yet connected.
  shopifyVariantIds?: Partial<Record<ShirtSize, string>>
}

export const PRODUCT_TYPES = [
  'T-Shirt',
  'Hoodie',
  'Long Sleeve',
  'Tank Top',
  'Sweatshirt',
] as const

export type ProductType = (typeof PRODUCT_TYPES)[number]

export interface PlacedTemplate {
  id: string
  templateId: string
  x: number
  y: number
  rotation: number
}

export interface Design {
  id: string
  user_id: string
  templates_used: PlacedTemplate[]
  created_at: string
  updated_at: string
}

export interface DesignState {
  shirtTemplateId: string | null
  placedTemplates: PlacedTemplate[]
  selectedTemplateId: string | null
  shirtColor: string
  view: 'front' | 'back'
  selectedSize: ShirtSize
}

// Legacy constants - kept for backwards compatibility with old saved designs
// New designs use ShirtTemplate for these values
export const PRINTABLE_AREA = {
  x: 85,
  y: 120,
  width: 230,
  height: 280,
} as const

export const CANVAS_SIZE = {
  width: 400,
  height: 500,
} as const
