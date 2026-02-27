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
  placedTemplates: PlacedTemplate[]
  selectedTemplateId: string | null
  shirtColor: string
  view: 'front' | 'back'
}

export const SHIRT_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Forest', value: '#166534' },
] as const

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
