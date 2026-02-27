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
  canvas_width: 400,
  canvas_height: 500,
  printable_x: 85,
  printable_y: 120,
  printable_width: 230,
  printable_height: 280,
  enabled: true,
}

export function ShirtTemplateEditor({
  template,
  open,
  onClose,
  onSave,
}: ShirtTemplateEditorProps) {
  const [formData, setFormData] = useState<Omit<ShirtTemplate, 'id' | 'created_at'>>(DEFAULT_TEMPLATE)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (template) {
      const { id, created_at, ...rest } = template
      setFormData(rest)
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

  const handlePrintableAreaMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - formData.printable_x,
      y: e.clientY - formData.printable_y,
    })
  }, [formData.printable_x, formData.printable_y])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      width: formData.printable_width,
      height: formData.printable_height,
      x: e.clientX,
      y: e.clientY,
    })
  }, [formData.printable_width, formData.printable_height])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, formData.canvas_width - formData.printable_width))
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, formData.canvas_height - formData.printable_height))
      setFormData((prev) => ({
        ...prev,
        printable_x: Math.round(newX),
        printable_y: Math.round(newY),
      }))
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      const newWidth = Math.max(50, Math.min(resizeStart.width + deltaX, formData.canvas_width - formData.printable_x))
      const newHeight = Math.max(50, Math.min(resizeStart.height + deltaY, formData.canvas_height - formData.printable_y))
      setFormData((prev) => ({
        ...prev,
        printable_width: Math.round(newWidth),
        printable_height: Math.round(newHeight),
      }))
    }
  }, [isDragging, isResizing, dragStart, resizeStart, formData.canvas_width, formData.canvas_height, formData.printable_x, formData.printable_y, formData.printable_width, formData.printable_height])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
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

  // Calculate scale factor for preview
  const maxPreviewWidth = 500
  const maxPreviewHeight = 600
  const scaleX = maxPreviewWidth / formData.canvas_width
  const scaleY = maxPreviewHeight / formData.canvas_height
  const scale = Math.min(scaleX, scaleY, 1)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Shirt Template' : 'Add Shirt Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-4">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
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

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Canvas Dimensions
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="canvas_width">Width (px)</Label>
                  <Input
                    id="canvas_width"
                    type="number"
                    value={formData.canvas_width}
                    onChange={(e) => setFormData((prev) => ({ ...prev, canvas_width: parseInt(e.target.value) || 400 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canvas_height">Height (px)</Label>
                  <Input
                    id="canvas_height"
                    type="number"
                    value={formData.canvas_height}
                    onChange={(e) => setFormData((prev) => ({ ...prev, canvas_height: parseInt(e.target.value) || 500 }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Printable Area
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag the blue rectangle to position. Drag the corner to resize.
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

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Preview & Printable Area
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

            {/* Canvas Preview with Printable Area */}
            {formData.image_url && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-background/80"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                >
                  <X className="w-4 h-4" />
                </Button>

                <div
                  ref={canvasRef}
                  className="relative bg-secondary rounded-xl overflow-hidden select-none"
                  style={{
                    width: formData.canvas_width * scale,
                    height: formData.canvas_height * scale,
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Shirt Image */}
                  <Image
                    src={formData.image_url}
                    alt="Shirt template"
                    fill
                    className="object-contain pointer-events-none"
                  />

                  {/* Printable Area Overlay */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
                    style={{
                      left: formData.printable_x * scale,
                      top: formData.printable_y * scale,
                      width: formData.printable_width * scale,
                      height: formData.printable_height * scale,
                    }}
                    onMouseDown={handlePrintableAreaMouseDown}
                  >
                    {/* Drag indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white p-1 rounded">
                      <Move className="w-4 h-4" />
                    </div>

                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 cursor-se-resize flex items-center justify-center"
                      onMouseDown={handleResizeMouseDown}
                    >
                      <Maximize2 className="w-3 h-3 text-white rotate-90" />
                    </div>

                    {/* Dimension labels */}
                    <div className="absolute -top-6 left-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                      {formData.printable_width} x {formData.printable_height}px
                    </div>
                    <div className="absolute -left-12 top-0 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                      ({formData.printable_x}, {formData.printable_y})
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Scale: {Math.round(scale * 100)}% | Canvas: {formData.canvas_width} x {formData.canvas_height}px
                </p>
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
