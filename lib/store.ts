import { Template, PlacedTemplate, DesignState } from './types'

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

// Local storage helpers
const TEMPLATES_KEY = 'tshirt_designer_templates'
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
