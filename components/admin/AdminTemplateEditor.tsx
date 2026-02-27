'use client'

import { useState, useCallback } from 'react'
import { Template, PRINTABLE_AREA } from '@/lib/types'
import { generateId } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { ImageUploader } from './ImageUploader'

// Get categories from store
import { templateCategories as categories } from '@/lib/store'

interface AdminTemplateEditorProps {
  template: Template | null
  open: boolean
  onClose: () => void
  onSave: (template: Template) => void
}

export function AdminTemplateEditor({
  template,
  open,
  onClose,
  onSave,
}: AdminTemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<Template>>(() =>
    template || {
      name: '',
      image_url: '',
      category: 'Logos',
      width: 100,
      height: 100,
      default_x: 150,
      default_y: 200,
      rotation: 0,
      enabled: true,
    }
  )
  // Reset form when template changes
  useState(() => {
    if (template) {
      setFormData(template)
    } else {
      setFormData({
        name: '',
        image_url: '',
        category: 'Logos',
        width: 100,
        height: 100,
        default_x: 150,
        default_y: 200,
        rotation: 0,
        enabled: true,
      })
    }
  })

  const handleImageChange = useCallback((url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newTemplate: Template = {
      id: template?.id || generateId(),
      name: formData.name || 'Untitled',
      image_url: formData.image_url || '/templates/logo-1.svg',
      category: formData.category || 'Logos',
      width: formData.width || 100,
      height: formData.height || 100,
      default_x: formData.default_x || 150,
      default_y: formData.default_y || 200,
      rotation: formData.rotation || 0,
      enabled: formData.enabled ?? true,
      created_at: template?.created_at || new Date().toISOString(),
    }

    onSave(newTemplate)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Add New Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Template Image</Label>
            <ImageUploader
              value={formData.image_url || ''}
              onChange={handleImageChange}
              folder="design-templates"
              label="Upload Design Template Image"
            />
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c !== 'All').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dimensions (Locked) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Locked Dimensions</Label>
              <span className="text-xs text-muted-foreground">
                Users cannot resize templates
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-xs">
                  Width: {formData.width}px
                </Label>
                <Slider
                  value={[formData.width || 100]}
                  min={40}
                  max={220}
                  step={5}
                  onValueChange={([value]) =>
                    setFormData((prev) => ({ ...prev, width: value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-xs">
                  Height: {formData.height}px
                </Label>
                <Slider
                  value={[formData.height || 100]}
                  min={40}
                  max={260}
                  step={5}
                  onValueChange={([value]) =>
                    setFormData((prev) => ({ ...prev, height: value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Default Position */}
          <div className="space-y-4">
            <Label>Default Position</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_x" className="text-xs">
                  X Position: {formData.default_x}px
                </Label>
                <Slider
                  value={[formData.default_x || 150]}
                  min={PRINTABLE_AREA.x}
                  max={PRINTABLE_AREA.x + PRINTABLE_AREA.width - (formData.width || 100)}
                  step={5}
                  onValueChange={([value]) =>
                    setFormData((prev) => ({ ...prev, default_x: value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_y" className="text-xs">
                  Y Position: {formData.default_y}px
                </Label>
                <Slider
                  value={[formData.default_y || 200]}
                  min={PRINTABLE_AREA.y}
                  max={PRINTABLE_AREA.y + PRINTABLE_AREA.height - (formData.height || 100)}
                  step={5}
                  onValueChange={([value]) =>
                    setFormData((prev) => ({ ...prev, default_y: value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <Label>Default Rotation: {formData.rotation}°</Label>
            <Slider
              value={[formData.rotation || 0]}
              min={-180}
              max={180}
              step={5}
              onValueChange={([value]) =>
                setFormData((prev) => ({ ...prev, rotation: value }))
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Save Changes' : 'Add Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
