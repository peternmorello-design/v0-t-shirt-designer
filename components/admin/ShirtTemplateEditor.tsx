'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ShirtTemplate, PRODUCT_TYPES } from '@/lib/types'
import { generateId } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, X, Move, Maximize2 } from 'lucide-react'
import Image from 'next/image'

interface ShirtTemplateEditorProps {
  template: ShirtTemplate | null
  open: boolean
  onClose: () => void
  onSave: (template: ShirtTemplate) => void
}

const DEFAULT_TEMPLATE: Omit<ShirtTemplate, 'id' | 'created_at'> = {
  name: '',
  product_type: 'T-Shirt',
  view: 'front',
  image_url: '',
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
}

export function ShirtTemplateEditor({
  template,
  open,
  onClose,
  onSave,
}: ShirtTemplateEditorProps) {
  const [formData, setFormData] = useState<Omit<ShirtTemplate, 'id' | 'created_at'>>(DEFAULT_TEMPLATE)
  const [isDraggingPrintable, setIsDraggingPrintable] = useState(false)
  const [isResizingPrintable, setIsResizingPrintable] = useState(false)
  const [isDraggingShirt, setIsDraggingShirt] = useState(false)
  const [isResizingShirt, setIsResizingShirt] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (template) {
      const { id, created_at, ...rest } = template
      // Handle legacy templates without new fields
      setFormData({
        ...rest,
        shirt_pixel_width: rest.shirt_pixel_width || rest.canvas_width * 0.73,
        shirt_pixel_height: rest.shirt_pixel_height || rest.canvas_height * 0.78,
        shirt_offset_x: rest.shirt_offset_x || rest.canvas_width * 0.13,
        shirt_offset_y: rest.shirt_offset_y || rest.canvas_height * 0.06,
      })
    } else {
      setFormData(DEFAULT_TEMPLATE)
    }
  }, [template, open])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setFormData((prev) => ({ ...prev, image_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setFormData((prev) => ({ ...prev, image_url: dataUrl }))
    }
    reader.readAsDataURL(file)
  }, [])

  // Calculate scale factor for preview
  const maxPreviewWidth = 480
  const maxPreviewHeight = 580
  const scaleX = maxPreviewWidth / formData.canvas_width
  const scaleY = maxPreviewHeight / formData.canvas_height
  const scale = Math.min(scaleX, scaleY)

  // Printable area drag handlers (relative to shirt)
  const handlePrintableAreaMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingPrintable(true)
    setDragStart({
      x: e.clientX / scale - formData.printable_x,
      y: e.clientY / scale - formData.printable_y,
    })
  }, [formData.printable_x, formData.printable_y, scale])

  const handlePrintableResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizingPrintable(true)
    setResizeStart({
      width: formData.printable_width,
      height: formData.printable_height,
      x: e.clientX,
      y: e.clientY,
    })
  }, [formData.printable_width, formData.printable_height])

  // Shirt position drag handlers
  const handleShirtMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingShirt(true)
    setDragStart({
      x: e.clientX / scale - formData.shirt_offset_x,
      y: e.clientY / scale - formData.shirt_offset_y,
    })
  }, [formData.shirt_offset_x, formData.shirt_offset_y, scale])

  const handleShirtResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizingShirt(true)
    setResizeStart({
      width: formData.shirt_pixel_width,
      height: formData.shirt_pixel_height,
      x: e.clientX,
      y: e.clientY,
    })
  }, [formData.shirt_pixel_width, formData.shirt_pixel_height])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingPrintable) {
      const newX = Math.max(0, Math.min(e.clientX / scale - dragStart.x, formData.shirt_pixel_width - formData.printable_width))
      const newY = Math.max(0, Math.min(e.clientY / scale - dragStart.y, formData.shirt_pixel_height - formData.printable_height))
      setFormData((prev) => ({
        ...prev,
        printable_x: Math.round(newX),
        printable_y: Math.round(newY),
      }))
    } else if (isResizingPrintable) {
      const deltaX = (e.clientX - resizeStart.x) / scale
      const deltaY = (e.clientY - resizeStart.y) / scale
      const newWidth = Math.max(100, Math.min(resizeStart.width + deltaX, formData.shirt_pixel_width - formData.printable_x))
      const newHeight = Math.max(100, Math.min(resizeStart.height + deltaY, formData.shirt_pixel_height - formData.printable_y))
      setFormData((prev) => ({
        ...prev,
        printable_width: Math.round(newWidth),
        printable_height: Math.round(newHeight),
      }))
    } else if (isDraggingShirt) {
      const newX = Math.max(0, Math.min(e.clientX / scale - dragStart.x, formData.canvas_width - formData.shirt_pixel_width))
      const newY = Math.max(0, Math.min(e.clientY / scale - dragStart.y, formData.canvas_height - formData.shirt_pixel_height))
      setFormData((prev) => ({
        ...prev,
        shirt_offset_x: Math.round(newX),
        shirt_offset_y: Math.round(newY),
      }))
    } else if (isResizingShirt) {
      const deltaX = (e.clientX - resizeStart.x) / scale
      const deltaY = (e.clientY - resizeStart.y) / scale
      const newWidth = Math.max(200, Math.min(resizeStart.width + deltaX, formData.canvas_width - formData.shirt_offset_x))
      const newHeight = Math.max(200, Math.min(resizeStart.height + deltaY, formData.canvas_height - formData.shirt_offset_y))
      setFormData((prev) => ({
        ...prev,
        shirt_pixel_width: Math.round(newWidth),
        shirt_pixel_height: Math.round(newHeight),
      }))
    }
  }, [isDraggingPrintable, isResizingPrintable, isDraggingShirt, isResizingShirt, dragStart, resizeStart, scale, formData])

  const handleMouseUp = useCallback(() => {
    setIsDraggingPrintable(false)
    setIsResizingPrintable(false)
    setIsDraggingShirt(false)
    setIsResizingShirt(false)
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingPrintable(false)
      setIsResizingPrintable(false)
      setIsDraggingShirt(false)
      setIsResizingShirt(false)
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const handleSave = () => {
    if (!formData.name.trim()) return
    
    const savedTemplate: ShirtTemplate = {
      ...formData,
      id: template?.id || generateId(),
      created_at: template?.created_at || new Date().toISOString(),
    }
    onSave(savedTemplate)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Shirt Template' : 'Add Shirt Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mt-4">
          {/* Left Panel - Settings */}
          <div className="space-y-5 overflow-y-auto max-h-[70vh] pr-2">
            {/* Template Settings */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Template Settings
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., White T-Shirt Front"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, product_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>View</Label>
                  <Select
                    value={formData.view}
                    onValueChange={(value: 'front' | 'back') => setFormData((prev) => ({ ...prev, view: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Canvas Dimensions */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Canvas Dimensions
              </h3>
              <p className="text-xs text-muted-foreground">
                Overall workspace size
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="canvas_width">Width (px)</Label>
                  <Input
                    id="canvas_width"
                    type="number"
                    value={formData.canvas_width}
                    onChange={(e) => setFormData((prev) => ({ ...prev, canvas_width: parseInt(e.target.value) || 3000 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canvas_height">Height (px)</Label>
                  <Input
                    id="canvas_height"
                    type="number"
                    value={formData.canvas_height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, canvas_height: parseInt(e.target.value) || 3600 }))}
                  />
                </div>
              </div>
            </div>

            {/* Shirt Image Dimensions */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Shirt Image Dimensions
              </h3>
              <p className="text-xs text-muted-foreground">
                True pixel size of shirt image (independent from canvas)
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="shirt_pixel_width">Width (px)</Label>
                  <Input
                    id="shirt_pixel_width"
                    type="number"
                    value={formData.shirt_pixel_width}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shirt_pixel_width: parseInt(e.target.value) || 2200 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shirt_pixel_height">Height (px)</Label>
                  <Input
                    id="shirt_pixel_height"
                    type="number"
                    value={formData.shirt_pixel_height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shirt_pixel_height: parseInt(e.target.value) || 2800 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="shirt_offset_x">Offset X (px)</Label>
                  <Input
                    id="shirt_offset_x"
                    type="number"
                    value={formData.shirt_offset_x}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shirt_offset_x: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shirt_offset_y">Offset Y (px)</Label>
                  <Input
                    id="shirt_offset_y"
                    type="number"
                    value={formData.shirt_offset_y}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shirt_offset_y: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            {/* Printable Area */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Printable Area
              </h3>
              <p className="text-xs text-muted-foreground">
                Relative to shirt image (not canvas)
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="printable_x">X Position</Label>
                  <Input
                    id="printable_x"
                    type="number"
                    value={formData.printable_x}
                    onChange={(e) => setFormData((prev) => ({ ...prev, printable_x: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printable_y">Y Position</Label>
                  <Input
                    id="printable_y"
                    type="number"
                    value={formData.printable_y}
                    onChange={(e) => setFormData((prev) => ({ ...prev, printable_y: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printable_width">Width (px)</Label>
                  <Input
                    id="printable_width"
                    type="number"
                    value={formData.printable_width}
                    onChange={(e) => setFormData((prev) => ({ ...prev, printable_width: parseInt(e.target.value) || 100 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printable_height">Height (px)</Label>
                  <Input
                    id="printable_height"
                    type="number"
                    value={formData.printable_height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, printable_height: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Visual Editor
            </h3>

            {/* Image Upload */}
            {!formData.image_url && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('shirt-image-upload')?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop shirt image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <input
                  id="shirt-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}

            {/* Canvas Preview with Boundaries */}
            {formData.image_url && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-20 bg-background/80"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Measurement Overlay */}
                <div className="absolute top-2 left-2 z-20 bg-foreground/90 text-background text-xs p-3 rounded-lg space-y-1.5 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm border-2 border-muted-foreground/60"></span>
                    <span>Canvas: {formData.canvas_width} x {formData.canvas_height}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm border-2 border-blue-500"></span>
                    <span>Shirt: {formData.shirt_pixel_width} x {formData.shirt_pixel_height}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm border-2 border-emerald-500"></span>
                    <span>Printable: {formData.printable_width} x {formData.printable_height}px</span>
                  </div>
                </div>

                <div
                  ref={canvasRef}
                  className="relative rounded-xl overflow-hidden select-none border-2 border-muted-foreground/30"
                  style={{
                    width: formData.canvas_width * scale,
                    height: formData.canvas_height * scale,
                    backgroundColor: '#f5f5f5',
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Canvas boundary label */}
                  <div className="absolute bottom-1 right-1 text-xs text-muted-foreground/60 font-mono z-10">
                    Canvas
                  </div>

                  {/* Shirt boundary (blue) */}
                  <div
                    className="absolute border-2 border-blue-500 cursor-move"
                    style={{
                      left: formData.shirt_offset_x * scale,
                      top: formData.shirt_offset_y * scale,
                      width: formData.shirt_pixel_width * scale,
                      height: formData.shirt_pixel_height * scale,
                    }}
                    onMouseDown={handleShirtMouseDown}
                  >
                    {/* Shirt Image */}
                    <Image
                      src={formData.image_url}
                      alt="Shirt template"
                      fill
                      className="object-contain pointer-events-none"
                    />

                    {/* Shirt drag indicator */}
                    <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      Shirt
                    </div>

                    {/* Shirt resize handle */}
                    <div
                      className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize flex items-center justify-center z-10"
                      onMouseDown={handleShirtResizeMouseDown}
                    >
                      <Maximize2 className="w-3 h-3 text-white rotate-90" />
                    </div>

                    {/* Shirt position label */}
                    <div className="absolute -bottom-5 left-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-mono">
                      ({formData.shirt_offset_x}, {formData.shirt_offset_y})
                    </div>

                    {/* Printable Area (green) - relative to shirt */}
                    <div
                      className="absolute border-2 border-emerald-500 bg-emerald-500/10 cursor-move"
                      style={{
                        left: formData.printable_x * scale,
                        top: formData.printable_y * scale,
                        width: formData.printable_width * scale,
                        height: formData.printable_height * scale,
                      }}
                      onMouseDown={handlePrintableAreaMouseDown}
                    >
                      {/* Printable drag indicator */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white p-1.5 rounded flex items-center gap-1">
                        <Move className="w-4 h-4" />
                        <span className="text-xs font-medium">Printable</span>
                      </div>

                      {/* Printable resize handle */}
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 cursor-se-resize flex items-center justify-center"
                        onMouseDown={handlePrintableResizeMouseDown}
                      >
                        <Maximize2 className="w-3 h-3 text-white rotate-90" />
                      </div>

                      {/* Dimension labels */}
                      <div className="absolute -top-5 left-0 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded font-mono">
                        {formData.printable_width} x {formData.printable_height}
                      </div>
                      <div className="absolute top-0 -left-12 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded font-mono">
                        ({formData.printable_x}, {formData.printable_y})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Blue outline:</strong> Shirt image boundary (drag to position, corner to resize)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Green outline:</strong> Printable area (relative to shirt, drag to position, corner to resize)
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Preview scale: {Math.round(scale * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {template ? 'Save Changes' : 'Add Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
