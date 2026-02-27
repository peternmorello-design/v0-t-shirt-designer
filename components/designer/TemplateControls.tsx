'use client'

import { PlacedTemplate, Template, SHIRT_COLORS, PRINTABLE_AREA } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  RotateCcw,
  Trash2,
  Move,
  RotateCw,
  Layers,
  Palette,
  FlipHorizontal,
  Save,
  Download,
} from 'lucide-react'

interface TemplateControlsProps {
  selectedTemplateId: string | null
  placedTemplates: PlacedTemplate[]
  templates: Template[]
  shirtColor: string
  view: 'front' | 'back'
  onUpdateTemplate: (id: string, updates: Partial<PlacedTemplate>) => void
  onRemoveTemplate: (id: string) => void
  onResetPosition: (id: string) => void
  onSetShirtColor: (color: string) => void
  onSetView: (view: 'front' | 'back') => void
  onSaveDesign: () => void
}

export function TemplateControls({
  selectedTemplateId,
  placedTemplates,
  templates,
  shirtColor,
  view,
  onUpdateTemplate,
  onRemoveTemplate,
  onResetPosition,
  onSetShirtColor,
  onSetView,
  onSaveDesign,
}: TemplateControlsProps) {
  const selectedPlaced = placedTemplates.find((t) => t.id === selectedTemplateId)
  const selectedTemplate = selectedPlaced
    ? templates.find((t) => t.id === selectedPlaced.templateId)
    : null

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Shirt Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Shirt Color</h3>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {SHIRT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onSetShirtColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    shirtColor === color.value
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* View Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FlipHorizontal className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">View</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'front' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => onSetView('front')}
                className="flex-1"
              >
                Front
              </Button>
              <Button
                variant={view === 'back' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => onSetView('back')}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>

          <Separator />

          {/* Template Controls */}
          {selectedPlaced && selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Selected Template</h3>
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
              <p className="text-sm">Select a template to edit</p>
              <p className="text-xs mt-1">or add one from the library</p>
            </div>
          )}

          <Separator />

          {/* Placed Templates List */}
          {placedTemplates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Added Templates ({placedTemplates.length})</h3>
              <div className="space-y-2">
                {placedTemplates.map((placed) => {
                  const template = templates.find((t) => t.id === placed.templateId)
                  if (!template) return null
                  return (
                    <div
                      key={placed.id}
                      onClick={() => {}}
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
        </div>
      </ScrollArea>

      {/* Save Button */}
      <div className="p-4 border-t border-border">
        <Button onClick={onSaveDesign} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          Save Design
        </Button>
      </div>
    </div>
  )
}
