'use client'

import { PlacedTemplate, Template, ShirtTemplate, ShirtSize, SHIRT_SIZES, SHIRT_SIZE_LABELS } from '@/lib/types'
import { CartStatus, CART_STATUS_LABELS } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  RotateCcw,
  Trash2,
  Move,
  RotateCw,
  Layers,
  Shirt,
  Save,
  Info,
  ShoppingCart,
  Loader2,
  Ruler,
  AlertCircle,
} from 'lucide-react'

interface TemplateControlsProps {
  selectedTemplateId: string | null
  placedTemplates: PlacedTemplate[]
  templates: Template[]
  shirtTemplate: ShirtTemplate | null
  selectedSize: ShirtSize
  onUpdateTemplate: (id: string, updates: Partial<PlacedTemplate>) => void
  onRemoveTemplate: (id: string) => void
  onResetPosition: (id: string) => void
  onSaveDesign: () => void
  onAddToCart: () => void
  onSizeChange: (size: ShirtSize) => void
  cartStatus: CartStatus
}

export function TemplateControls({
  selectedTemplateId,
  placedTemplates,
  templates,
  shirtTemplate,
  selectedSize,
  onUpdateTemplate,
  onRemoveTemplate,
  onResetPosition,
  onSaveDesign,
  onAddToCart,
  onSizeChange,
  cartStatus,
}: TemplateControlsProps) {
  const selectedPlaced = placedTemplates.find((t) => t.id === selectedTemplateId)
  const selectedTemplate = selectedPlaced
    ? templates.find((t) => t.id === selectedPlaced.templateId)
    : null

  // Check if the selected size has a Shopify variant configured
  const hasVariantForSize = shirtTemplate?.shopifyVariantIds?.[selectedSize] != null

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Current Shirt Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Selected Product</h3>
            </div>
            {shirtTemplate ? (
              <div className="p-3 bg-secondary rounded-lg space-y-2">
                <p className="font-medium text-sm">{shirtTemplate.name}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {shirtTemplate.product_type}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {shirtTemplate.view}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <p>Canvas: {shirtTemplate.canvas_width} x {shirtTemplate.canvas_height}px</p>
                  <p>Print Area: {shirtTemplate.printable_width} x {shirtTemplate.printable_height}px</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">No product selected</p>
                <p className="text-xs text-muted-foreground mt-1">Select one from the Products tab</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Select Size</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SHIRT_SIZES.map((size) => {
                const isAvailable = shirtTemplate?.shopifyVariantIds?.[size] != null
                return (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSizeChange(size)}
                    className={`relative ${!isAvailable ? 'opacity-50' : ''}`}
                    title={isAvailable ? SHIRT_SIZE_LABELS[size] : `${SHIRT_SIZE_LABELS[size]} - Not available`}
                  >
                    {size}
                    {!isAvailable && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                    )}
                  </Button>
                )
              })}
            </div>
            {shirtTemplate && !hasVariantForSize && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Size {selectedSize} is not connected to Shopify. Configure a variant ID in the admin panel.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Template Controls */}
          {selectedPlaced && selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Selected Design</h3>
              </div>
              
              <div className="p-3 bg-secondary rounded-lg">
                <p className="font-medium text-sm">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.width} x {selectedTemplate.height}px (locked)
                </p>
              </div>

              {/* Position */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-xs font-medium">Position</Label>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">X: </span>
                    <span className="font-medium">{Math.round(selectedPlaced.x)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Y: </span>
                    <span className="font-medium">{Math.round(selectedPlaced.y)}</span>
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-xs font-medium">
                    Rotation: {selectedPlaced.rotation}°
                  </Label>
                </div>
                <Slider
                  value={[selectedPlaced.rotation]}
                  min={-180}
                  max={180}
                  step={5}
                  onValueChange={([value]) =>
                    onUpdateTemplate(selectedPlaced.id, { rotation: value })
                  }
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onResetPosition(selectedPlaced.id)}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveTemplate(selectedPlaced.id)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a design to edit</p>
              <p className="text-xs mt-1">or add one from the Designs tab</p>
            </div>
          )}

          <Separator />

          {/* Placed Templates List */}
          {placedTemplates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Added Designs ({placedTemplates.length})</h3>
              <div className="space-y-2">
                {placedTemplates.map((placed) => {
                  const template = templates.find((t) => t.id === placed.templateId)
                  if (!template) return null
                  return (
                    <div
                      key={placed.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTemplateId === placed.id
                          ? 'bg-accent/10 border border-accent/30'
                          : 'bg-secondary hover:bg-muted'
                      }`}
                    >
                      <span className="text-sm">{template.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveTemplate(placed.id)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Printable Area Info */}
          {shirtTemplate && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Printable Area</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Designs can only be placed within the dashed rectangle on the canvas. 
                  The printable area for this product is {shirtTemplate.printable_width} x {shirtTemplate.printable_height}px 
                  at position ({shirtTemplate.printable_x}, {shirtTemplate.printable_y}).
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Buttons */}
      <div className="shrink-0 p-4 border-t border-border space-y-2">
        <Button 
          onClick={onSaveDesign} 
          className="w-full" 
          size="lg"
          variant="outline"
          disabled={!shirtTemplate || placedTemplates.length === 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Design
        </Button>
        <Button
          onClick={onAddToCart}
          className="w-full"
          size="lg"
          disabled={
            !shirtTemplate ||
            placedTemplates.length === 0 ||
            !hasVariantForSize ||
            (cartStatus !== 'idle' && cartStatus !== 'error')
          }
        >
          {cartStatus !== 'idle' && cartStatus !== 'error' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          {CART_STATUS_LABELS[cartStatus]}
        </Button>
      </div>
    </div>
  )
}
