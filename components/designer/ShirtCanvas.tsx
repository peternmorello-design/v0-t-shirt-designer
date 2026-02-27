'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { PlacedTemplate, Template, PRINTABLE_AREA, CANVAS_SIZE } from '@/lib/types'
import Image from 'next/image'

interface ShirtCanvasProps {
  shirtColor: string
  placedTemplates: PlacedTemplate[]
  templates: Template[]
  selectedTemplateId: string | null
  onSelectTemplate: (id: string | null) => void
  onUpdateTemplate: (id: string, updates: Partial<PlacedTemplate>) => void
  view: 'front' | 'back'
}

export function ShirtCanvas({
  shirtColor,
  placedTemplates,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onUpdateTemplate,
  view,
}: ShirtCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation()
      const placed = placedTemplates.find((t) => t.id === templateId)
      if (!placed) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      setDragOffset({
        x: e.clientX - rect.left - placed.x,
        y: e.clientY - rect.top - placed.y,
      })
      setIsDragging(true)
      onSelectTemplate(templateId)
    },
    [placedTemplates, onSelectTemplate]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTemplateId) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const placed = placedTemplates.find((t) => t.id === selectedTemplateId)
      const template = templates.find((t) => t.id === placed?.templateId)
      if (!placed || !template) return

      let newX = e.clientX - rect.left - dragOffset.x
      let newY = e.clientY - rect.top - dragOffset.y

      // Constrain to printable area
      newX = Math.max(PRINTABLE_AREA.x, Math.min(newX, PRINTABLE_AREA.x + PRINTABLE_AREA.width - template.width))
      newY = Math.max(PRINTABLE_AREA.y, Math.min(newY, PRINTABLE_AREA.y + PRINTABLE_AREA.height - template.height))

      // Snap to center
      const centerX = PRINTABLE_AREA.x + (PRINTABLE_AREA.width - template.width) / 2
      const centerY = PRINTABLE_AREA.y + (PRINTABLE_AREA.height - template.height) / 2

      if (Math.abs(newX - centerX) < 10) newX = centerX
      if (Math.abs(newY - centerY) < 10) newY = centerY

      onUpdateTemplate(selectedTemplateId, { x: newX, y: newY })
    },
    [isDragging, selectedTemplateId, placedTemplates, templates, dragOffset, onUpdateTemplate]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback(() => {
    onSelectTemplate(null)
  }, [onSelectTemplate])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={canvasRef}
        className="relative bg-card rounded-2xl shadow-lg overflow-hidden select-none"
        style={{ width: CANVAS_SIZE.width, height: CANVAS_SIZE.height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* T-Shirt Shape */}
        <svg
          viewBox="0 0 400 500"
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          {/* Shirt body */}
          <path
            d="M80 80 L50 130 L90 140 L90 450 L310 450 L310 140 L350 130 L320 80 L260 80 L240 100 Q200 120 160 100 L140 80 Z"
            fill={shirtColor}
            stroke="#e5e5e5"
            strokeWidth="2"
          />
          {/* Collar */}
          <path
            d="M160 80 L140 80 L160 100 Q200 120 240 100 L260 80 L240 80 Q200 100 160 80"
            fill={shirtColor === '#FFFFFF' ? '#f5f5f5' : shirtColor}
            stroke="#e5e5e5"
            strokeWidth="1"
          />
          {/* Sleeves shadow */}
          <path d="M50 130 L90 140 L85 145 L45 135 Z" fill="rgba(0,0,0,0.05)" />
          <path d="M350 130 L310 140 L315 145 L355 135 Z" fill="rgba(0,0,0,0.05)" />
        </svg>

        {/* Printable Area Indicator */}
        <div
          className="absolute border-2 border-dashed border-muted-foreground/20 rounded-lg pointer-events-none"
          style={{
            left: PRINTABLE_AREA.x,
            top: PRINTABLE_AREA.y,
            width: PRINTABLE_AREA.width,
            height: PRINTABLE_AREA.height,
          }}
        />

        {/* View Label */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full uppercase tracking-wide">
          {view} View
        </div>

        {/* Placed Templates */}
        {placedTemplates.map((placed) => {
          const template = templates.find((t) => t.id === placed.templateId)
          if (!template) return null

          const isSelected = selectedTemplateId === placed.id

          return (
            <div
              key={placed.id}
              className={`absolute cursor-move transition-shadow ${
                isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
              }`}
              style={{
                left: placed.x,
                top: placed.y,
                width: template.width,
                height: template.height,
                transform: `rotate(${placed.rotation}deg)`,
                transformOrigin: 'center center',
              }}
              onMouseDown={(e) => handleMouseDown(e, placed.id)}
            >
              <Image
                src={template.image_url}
                alt={template.name}
                fill
                className="object-contain pointer-events-none"
                draggable={false}
              />
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground">
        Drag templates to position them. Templates snap to center.
      </p>
    </div>
  )
}
