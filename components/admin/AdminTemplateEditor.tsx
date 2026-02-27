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
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import Image from 'next/image'

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
  const [dragOver, setDragOver] = useState(false)

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image_url: event.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image_url: event.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
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
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-muted-foreground'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {formData.image_url ? (
                <div className="relative w-32 h-32 mx-auto">
                  <Image
                    src={formData.image_url}
                    alt="Template preview"
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drag and drop an image here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
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
