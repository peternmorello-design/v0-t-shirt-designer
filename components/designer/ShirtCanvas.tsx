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
  const canvasWidth = shirtTemplate?.canvas_width || 3000
  const canvasHeight = shirtTemplate?.canvas_height || 3600

  // Shirt pixel dimensions (independent from canvas)
  const shirtPixelWidth = shirtTemplate?.shirt_pixel_width || canvasWidth * 0.73
  const shirtPixelHeight = shirtTemplate?.shirt_pixel_height || canvasHeight * 0.78
  const shirtOffsetX = shirtTemplate?.shirt_offset_x || canvasWidth * 0.13
  const shirtOffsetY = shirtTemplate?.shirt_offset_y || canvasHeight * 0.06

  // Printable area relative to shirt
  const printableArea = shirtTemplate
    ? {
        x: shirtTemplate.printable_x,
        y: shirtTemplate.printable_y,
        width: shirtTemplate.printable_width,
        height: shirtTemplate.printable_height,
      }
    : { x: 300, y: 400, width: 1600, height: 2000 }

  // Calculate scale to fit in viewport (display scale only, not pixel scale)
  const maxViewportWidth = 500
  const maxViewportHeight = 620
  const scaleX = maxViewportWidth / canvasWidth
  const scaleY = maxViewportHeight / canvasHeight
  const displayScale = Math.min(scaleX, scaleY)

  // Convert canvas coordinates to screen coordinates
  const toScreen = (val: number) => val * displayScale
  
  // Convert printable-relative coordinates to canvas coordinates
  const printableToCanvas = (x: number, y: number) => ({
    x: shirtOffsetX + x,
    y: shirtOffsetY + y,
  })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, templateId: string) => {
      e.stopPropagation()
      const placed = placedTemplates.find((t) => t.id === templateId)
      if (!placed) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      // Account for display scale
      setDragOffset({
        x: (e.clientX - rect.left) / displayScale - (shirtOffsetX + placed.x),
        y: (e.clientY - rect.top) / displayScale - (shirtOffsetY + placed.y),
      })
      setIsDragging(true)
      onSelectTemplate(templateId)
    },
    [placedTemplates, onSelectTemplate, displayScale, shirtOffsetX, shirtOffsetY]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTemplateId) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const placed = placedTemplates.find((t) => t.id === selectedTemplateId)
      const template = templates.find((t) => t.id === placed?.templateId)
      if (!placed || !template) return

      // Calculate new position relative to printable area
      let newX = (e.clientX - rect.left) / displayScale - dragOffset.x - shirtOffsetX
      let newY = (e.clientY - rect.top) / displayScale - dragOffset.y - shirtOffsetY

      // Constrain to printable area (positions are relative to printable area origin)
      newX = Math.max(printableArea.x, Math.min(newX, printableArea.x + printableArea.width - template.width))
      newY = Math.max(printableArea.y, Math.min(newY, printableArea.y + printableArea.height - template.height))

      // Snap to center of printable area
      const centerX = printableArea.x + (printableArea.width - template.width) / 2
      const centerY = printableArea.y + (printableArea.height - template.height) / 2

      if (Math.abs(newX - centerX) < 20) newX = centerX
      if (Math.abs(newY - centerY) < 20) newY = centerY

      onUpdateTemplate(selectedTemplateId, { x: newX, y: newY })
    },
    [isDragging, selectedTemplateId, placedTemplates, templates, dragOffset, onUpdateTemplate, printableArea, displayScale, shirtOffsetX, shirtOffsetY]
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
      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className="relative bg-muted rounded-2xl shadow-lg overflow-hidden select-none"
        style={{
          width: toScreen(canvasWidth),
          height: toScreen(canvasHeight),
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Shirt Image - positioned and sized according to pixel dimensions */}
        <div
          className="absolute"
          style={{
            left: toScreen(shirtOffsetX),
            top: toScreen(shirtOffsetY),
            width: toScreen(shirtPixelWidth),
            height: toScreen(shirtPixelHeight),
          }}
        >
          {shirtTemplate?.image_url ? (
            <Image
              src={shirtTemplate.image_url}
              alt={shirtTemplate.name}
              fill
              className="object-contain pointer-events-none"
            />
          ) : (
            <svg
              viewBox="0 0 400 500"
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

          {/* Placed Templates (positioned relative to shirt) */}
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
                  left: toScreen(placed.x),
                  top: toScreen(placed.y),
                  width: toScreen(template.width),
                  height: toScreen(template.height),
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

        {/* View Label */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full uppercase tracking-wide z-10">
          {shirtTemplate?.view || 'front'} View
        </div>
      </div>

      {/* Info Panel */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Drag templates to position. Templates snap to center.
        </p>
      </div>
    </div>
  )
}
