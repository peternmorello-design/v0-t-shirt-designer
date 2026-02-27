'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { PlacedTemplate, Template, ShirtTemplate } from '@/lib/types'
import Image from 'next/image'

interface ShirtCanvasProps {
  shirtTemplate: ShirtTemplate | null
  placedTemplates: PlacedTemplate[]
  templates: Template[]
  selectedTemplateId: string | null
  onSelectTemplate: (id: string | null) => void
  onUpdateTemplate: (id: string, updates: Partial<PlacedTemplate>) => void
}

export function ShirtCanvas({
  shirtTemplate,
  placedTemplates,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onUpdateTemplate,
}: ShirtCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Use shirt template dimensions or defaults
  const canvasWidth = shirtTemplate?.canvas_width || 400
  const canvasHeight = shirtTemplate?.canvas_height || 500
  const printableArea = shirtTemplate
    ? {
        x: shirtTemplate.printable_x,
        y: shirtTemplate.printable_y,
        width: shirtTemplate.printable_width,
        height: shirtTemplate.printable_height,
      }
    : { x: 85, y: 120, width: 230, height: 280 }

  // Calculate scale to fit in viewport
  const maxViewportWidth = 500
  const maxViewportHeight = 600
  const scaleX = maxViewportWidth / canvasWidth
  const scaleY = maxViewportHeight / canvasHeight
  const displayScale = Math.min(scaleX, scaleY, 1)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation()
      const placed = placedTemplates.find((t) => t.id === templateId)
      if (!placed) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      // Account for display scale
      setDragOffset({
        x: (e.clientX - rect.left) / displayScale - placed.x,
        y: (e.clientY - rect.top) / displayScale - placed.y,
      })
      setIsDragging(true)
      onSelectTemplate(templateId)
    },
    [placedTemplates, onSelectTemplate, displayScale]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTemplateId) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const placed = placedTemplates.find((t) => t.id === selectedTemplateId)
      const template = templates.find((t) => t.id === placed?.templateId)
      if (!placed || !template) return

      // Account for display scale
      let newX = (e.clientX - rect.left) / displayScale - dragOffset.x
      let newY = (e.clientY - rect.top) / displayScale - dragOffset.y

      // Constrain to printable area
      newX = Math.max(printableArea.x, Math.min(newX, printableArea.x + printableArea.width - template.width))
      newY = Math.max(printableArea.y, Math.min(newY, printableArea.y + printableArea.height - template.height))

      // Snap to center
      const centerX = printableArea.x + (printableArea.width - template.width) / 2
      const centerY = printableArea.y + (printableArea.height - template.height) / 2

      if (Math.abs(newX - centerX) < 10) newX = centerX
      if (Math.abs(newY - centerY) < 10) newY = centerY

      onUpdateTemplate(selectedTemplateId, { x: newX, y: newY })
    },
    [isDragging, selectedTemplateId, placedTemplates, templates, dragOffset, onUpdateTemplate, printableArea, displayScale]
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
        style={{
          width: canvasWidth * displayScale,
          height: canvasHeight * displayScale,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Shirt Template Image or Default SVG */}
        {shirtTemplate?.image_url ? (
          <Image
            src={shirtTemplate.image_url}
            alt={shirtTemplate.name}
            fill
            className="object-contain pointer-events-none"
          />
        ) : (
          <svg
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {/* Default T-Shirt Shape */}
            <path
              d="M80 80 L50 130 L90 140 L90 450 L310 450 L310 140 L350 130 L320 80 L260 80 L240 100 Q200 120 160 100 L140 80 Z"
              fill="#F5F5F5"
              stroke="#e5e5e5"
              strokeWidth="2"
            />
            <path
              d="M160 80 L140 80 L160 100 Q200 120 240 100 L260 80 L240 80 Q200 100 160 80"
              fill="#EEEEEE"
              stroke="#e5e5e5"
              strokeWidth="1"
            />
          </svg>
        )}

        {/* Printable Area Indicator */}
        <div
          className="absolute border-2 border-dashed border-muted-foreground/20 rounded-lg pointer-events-none"
          style={{
            left: printableArea.x * displayScale,
            top: printableArea.y * displayScale,
            width: printableArea.width * displayScale,
            height: printableArea.height * displayScale,
          }}
        />

        {/* View Label */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full uppercase tracking-wide">
          {shirtTemplate?.view || 'front'} View
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
                left: placed.x * displayScale,
                top: placed.y * displayScale,
                width: template.width * displayScale,
                height: template.height * displayScale,
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
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Drag templates to position them. Templates snap to center.
        </p>
        {shirtTemplate && (
          <p className="text-xs text-muted-foreground mt-1">
            Canvas: {canvasWidth} x {canvasHeight}px | Printable: {printableArea.width} x {printableArea.height}px
          </p>
        )}
      </div>
    </div>
  )
}
