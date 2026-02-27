'use client'

import { useState, useEffect } from 'react'
import { DesignState, Template, ShirtTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { FolderOpen, Trash2, Clock, Shirt } from 'lucide-react'
import Image from 'next/image'

interface SavedDesign extends DesignState {
  id: string
  savedAt: string
}

interface SavedDesignsProps {
  templates: Template[]
  shirtTemplates: ShirtTemplate[]
  onLoadDesign: (design: DesignState) => void
}

const SAVED_DESIGNS_KEY = 'tshirt_saved_designs'

export function getSavedDesignsFromStorage(): SavedDesign[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(SAVED_DESIGNS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function saveDesignToStorage(design: DesignState): void {
  if (typeof window === 'undefined') return
  const designs = getSavedDesignsFromStorage()
  const newDesign: SavedDesign = {
    ...design,
    id: Math.random().toString(36).substring(2, 15),
    savedAt: new Date().toISOString(),
  }
  designs.unshift(newDesign)
  // Keep only last 20 designs
  const trimmed = designs.slice(0, 20)
  localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(trimmed))
}

export function deleteDesignFromStorage(id: string): void {
  if (typeof window === 'undefined') return
  const designs = getSavedDesignsFromStorage()
  const filtered = designs.filter((d) => d.id !== id)
  localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(filtered))
}

export function SavedDesigns({ templates, shirtTemplates, onLoadDesign }: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setDesigns(getSavedDesignsFromStorage())
    }
  }, [open])

  const handleDelete = (id: string) => {
    deleteDesignFromStorage(id)
    setDesigns((prev) => prev.filter((d) => d.id !== id))
  }

  const handleLoad = (design: SavedDesign) => {
    const { id, savedAt, ...designState } = design
    onLoadDesign(designState)
    setOpen(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getShirtTemplate = (shirtTemplateId: string | null) => {
    if (!shirtTemplateId) return null
    return shirtTemplates.find((t) => t.id === shirtTemplateId)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="w-4 h-4 mr-2" />
          My Designs
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Saved Designs</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          {designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">No saved designs</p>
              <p className="text-xs mt-1">
                Your saved designs will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {designs.map((design) => {
                const shirtTemplate = getShirtTemplate(design.shirtTemplateId)
                return (
                  <div
                    key={design.id}
                    className="bg-secondary rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {shirtTemplate && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-12 bg-background rounded overflow-hidden relative">
                              <Image
                                src={shirtTemplate.image_url}
                                alt={shirtTemplate.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{shirtTemplate.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {shirtTemplate.product_type}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {design.placedTemplates.length} design
                          {design.placedTemplates.length !== 1 ? 's' : ''} placed
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(design.savedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Template previews */}
                    {design.placedTemplates.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {design.placedTemplates.slice(0, 4).map((placed) => {
                          const template = templates.find(
                            (t) => t.id === placed.templateId
                          )
                          if (!template) return null
                          return (
                            <div
                              key={placed.id}
                              className="px-2 py-1 bg-background rounded text-xs"
                            >
                              {template.name}
                            </div>
                          )
                        })}
                        {design.placedTemplates.length > 4 && (
                          <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                            +{design.placedTemplates.length - 4} more
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoad(design)}
                        className="flex-1"
                      >
                        Load Design
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(design.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
