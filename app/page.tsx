'use client'

import { useState, useCallback, useEffect } from 'react'
import { Template, PlacedTemplate, DesignState } from '@/lib/types'
import { getStoredTemplates, generateId } from '@/lib/store'
import { ShirtCanvas } from '@/components/designer/ShirtCanvas'
import { TemplateLibrary } from '@/components/designer/TemplateLibrary'
import { TemplateControls } from '@/components/designer/TemplateControls'
import { SavedDesigns, saveDesignToStorage } from '@/components/designer/SavedDesigns'
import { Button } from '@/components/ui/button'
import { Shirt, Settings, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function DesignerPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [designState, setDesignState] = useState<DesignState>({
    placedTemplates: [],
    selectedTemplateId: null,
    shirtColor: '#FFFFFF',
    view: 'front',
  })

  useEffect(() => {
    setTemplates(getStoredTemplates())
  }, [])

  const handleAddTemplate = useCallback((template: Template) => {
    const newPlaced: PlacedTemplate = {
      id: generateId(),
      templateId: template.id,
      x: template.default_x,
      y: template.default_y,
      rotation: template.rotation,
    }

    setDesignState((prev) => ({
      ...prev,
      placedTemplates: [...prev.placedTemplates, newPlaced],
      selectedTemplateId: newPlaced.id,
    }))

    toast.success(`Added "${template.name}" to design`)
  }, [])

  const handleUpdateTemplate = useCallback((id: string, updates: Partial<PlacedTemplate>) => {
    setDesignState((prev) => ({
      ...prev,
      placedTemplates: prev.placedTemplates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }))
  }, [])

  const handleRemoveTemplate = useCallback((id: string) => {
    setDesignState((prev) => ({
      ...prev,
      placedTemplates: prev.placedTemplates.filter((t) => t.id !== id),
      selectedTemplateId: prev.selectedTemplateId === id ? null : prev.selectedTemplateId,
    }))
    toast.success('Template removed')
  }, [])

  const handleResetPosition = useCallback(
    (id: string) => {
      const placed = designState.placedTemplates.find((t) => t.id === id)
      if (!placed) return

      const template = templates.find((t) => t.id === placed.templateId)
      if (!template) return

      handleUpdateTemplate(id, {
        x: template.default_x,
        y: template.default_y,
        rotation: template.rotation,
      })
      toast.success('Position reset')
    },
    [designState.placedTemplates, templates, handleUpdateTemplate]
  )

  const handleSelectTemplate = useCallback((id: string | null) => {
    setDesignState((prev) => ({
      ...prev,
      selectedTemplateId: id,
    }))
  }, [])

  const handleSetShirtColor = useCallback((color: string) => {
    setDesignState((prev) => ({
      ...prev,
      shirtColor: color,
    }))
  }, [])

  const handleSetView = useCallback((view: 'front' | 'back') => {
    setDesignState((prev) => ({
      ...prev,
      view,
    }))
  }, [])

  const handleSaveDesign = useCallback(() => {
    saveDesignToStorage(designState)
    toast.success('Design saved successfully!')
  }, [designState])

  const handleLoadDesign = useCallback((design: DesignState) => {
    setDesignState(design)
    toast.success('Design loaded!')
  }, [])

  const handleClearDesign = useCallback(() => {
    setDesignState({
      placedTemplates: [],
      selectedTemplateId: null,
      shirtColor: '#FFFFFF',
      view: 'front',
    })
    toast.success('Canvas cleared')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shirt className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Custom Designer</h1>
              <p className="text-xs text-muted-foreground">Create your perfect t-shirt</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleClearDesign}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <SavedDesigns templates={templates} onLoadDesign={handleLoadDesign} />
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Designer */}
      <main className="max-w-[1600px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6 items-start">
          {/* Left Panel - Template Library */}
          <div className="h-[calc(100vh-120px)] order-2 lg:order-1">
            <TemplateLibrary templates={templates} onAddTemplate={handleAddTemplate} />
          </div>

          {/* Center - Canvas */}
          <div className="flex justify-center order-1 lg:order-2">
            <ShirtCanvas
              shirtColor={designState.shirtColor}
              placedTemplates={designState.placedTemplates}
              templates={templates}
              selectedTemplateId={designState.selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              view={designState.view}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="h-[calc(100vh-120px)] order-3">
            <TemplateControls
              selectedTemplateId={designState.selectedTemplateId}
              placedTemplates={designState.placedTemplates}
              templates={templates}
              shirtColor={designState.shirtColor}
              view={designState.view}
              onUpdateTemplate={handleUpdateTemplate}
              onRemoveTemplate={handleRemoveTemplate}
              onResetPosition={handleResetPosition}
              onSetShirtColor={handleSetShirtColor}
              onSetView={handleSetView}
              onSaveDesign={handleSaveDesign}
            />
          </div>
        </div>
      </main>

      <Toaster position="bottom-center" />
    </div>
  )
}
