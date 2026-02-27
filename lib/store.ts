import { Template, PlacedTemplate, DesignState, ShirtTemplate } from './types'

// Sample templates for demonstration
export const sampleTemplates: Template[] = [
  {
    id: '1',
    name: 'Classic Logo',
    image_url: '/templates/logo-1.svg',
    category: 'Logos',
    width: 120,
    height: 80,
    default_x: 140,
    default_y: 180,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Vintage Badge',
    image_url: '/templates/badge-1.svg',
    category: 'Badges',
    width: 100,
    height: 100,
    default_x: 150,
    default_y: 200,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Abstract Pattern',
    image_url: '/templates/pattern-1.svg',
    category: 'Patterns',
    width: 180,
    height: 120,
    default_x: 110,
    default_y: 180,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Minimalist Icon',
    image_url: '/templates/icon-1.svg',
    category: 'Icons',
    width: 80,
    height: 80,
    default_x: 160,
    default_y: 200,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Bold Typography',
    image_url: '/templates/typo-1.svg',
    category: 'Typography',
    width: 160,
    height: 60,
    default_x: 120,
    default_y: 220,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Nature Emblem',
    image_url: '/templates/emblem-1.svg',
    category: 'Badges',
    width: 110,
    height: 110,
    default_x: 145,
    default_y: 195,
    rotation: 0,
    enabled: true,
    created_at: new Date().toISOString(),
  },
]

export const templateCategories = [
  'All',
  'Logos',
  'Badges',
  'Patterns',
  'Icons',
  'Typography',
]

// Sample shirt templates
export const sampleShirtTemplates: ShirtTemplate[] = [
  {
    id: 'shirt-1',
    name: 'White T-Shirt Front',
    product_type: 'T-Shirt',
    view: 'front',
    image_url: '/shirt-templates/white-tshirt-front.svg',
    canvas_width: 3000,
    canvas_height: 3600,
    shirt_pixel_width: 2200,
    shirt_pixel_height: 2800,
    shirt_offset_x: 400,
    shirt_offset_y: 200,
    printable_x: 300,
    printable_y: 400,
    printable_width: 1600,
    printable_height: 2000,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'shirt-2',
    name: 'Black T-Shirt Front',
    product_type: 'T-Shirt',
    view: 'front',
    image_url: '/shirt-templates/black-tshirt-front.svg',
    canvas_width: 3000,
    canvas_height: 3600,
    shirt_pixel_width: 2200,
    shirt_pixel_height: 2800,
    shirt_offset_x: 400,
    shirt_offset_y: 200,
    printable_x: 300,
    printable_y: 400,
    printable_width: 1600,
    printable_height: 2000,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'shirt-3',
    name: 'Navy T-Shirt Front',
    product_type: 'T-Shirt',
    view: 'front',
    image_url: '/shirt-templates/navy-tshirt-front.svg',
    canvas_width: 3000,
    canvas_height: 3600,
    shirt_pixel_width: 2200,
    shirt_pixel_height: 2800,
    shirt_offset_x: 400,
    shirt_offset_y: 200,
    printable_x: 300,
    printable_y: 400,
    printable_width: 1600,
    printable_height: 2000,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'shirt-4',
    name: 'White T-Shirt Back',
    product_type: 'T-Shirt',
    view: 'back',
    image_url: '/shirt-templates/white-tshirt-back.svg',
    canvas_width: 3000,
    canvas_height: 3600,
    shirt_pixel_width: 2200,
    shirt_pixel_height: 2800,
    shirt_offset_x: 400,
    shirt_offset_y: 200,
    printable_x: 300,
    printable_y: 300,
    printable_width: 1600,
    printable_height: 2200,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'shirt-5',
    name: 'Black Hoodie Front',
    product_type: 'Hoodie',
    view: 'front',
    image_url: '/shirt-templates/black-hoodie-front.svg',
    canvas_width: 3000,
    canvas_height: 3900,
    shirt_pixel_width: 2400,
    shirt_pixel_height: 3200,
    shirt_offset_x: 300,
    shirt_offset_y: 200,
    printable_x: 400,
    printable_y: 600,
    printable_width: 1600,
    printable_height: 2000,
    enabled: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'shirt-6',
    name: 'Gray Long Sleeve Front',
    product_type: 'Long Sleeve',
    view: 'front',
    image_url: '/shirt-templates/gray-longsleeve-front.svg',
    canvas_width: 3000,
    canvas_height: 3600,
    shirt_pixel_width: 2200,
    shirt_pixel_height: 2800,
    shirt_offset_x: 400,
    shirt_offset_y: 200,
    printable_x: 300,
    printable_y: 400,
    printable_width: 1600,
    printable_height: 2000,
    enabled: true,
    created_at: new Date().toISOString(),
  },
]

// Local storage helpers
const TEMPLATES_KEY = 'tshirt_designer_templates'
const SHIRT_TEMPLATES_KEY = 'tshirt_designer_shirt_templates'
const DESIGNS_KEY = 'tshirt_designer_designs'

export function getStoredTemplates(): Template[] {
  if (typeof window === 'undefined') return sampleTemplates
  const stored = localStorage.getItem(TEMPLATES_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return sampleTemplates
    }
  }
  // Initialize with sample templates
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(sampleTemplates))
  return sampleTemplates
}

export function saveTemplates(templates: Template[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export function getSavedDesigns(): DesignState[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(DESIGNS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function saveDesign(design: DesignState): void {
  if (typeof window === 'undefined') return
  const designs = getSavedDesigns()
  designs.push(design)
  localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs))
}

export function getStoredShirtTemplates(): ShirtTemplate[] {
  if (typeof window === 'undefined') return sampleShirtTemplates
  const stored = localStorage.getItem(SHIRT_TEMPLATES_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return sampleShirtTemplates
    }
  }
  // Initialize with sample shirt templates
  localStorage.setItem(SHIRT_TEMPLATES_KEY, JSON.stringify(sampleShirtTemplates))
  return sampleShirtTemplates
}

export function saveShirtTemplates(templates: ShirtTemplate[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SHIRT_TEMPLATES_KEY, JSON.stringify(templates))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
