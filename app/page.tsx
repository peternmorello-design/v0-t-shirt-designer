'use client'

import { useState, useCallback, useEffect } from 'react'
import { Template, PlacedTemplate, DesignState, ShirtTemplate } from '@/lib/types'
import { getStoredTemplates, getStoredShirtTemplates, generateId } from '@/lib/store'
import { buildDesignPayload, handleAddToCartFlow, CartStatus } from '@/lib/cart'
import { ShirtCanvas } from '@/components/designer/ShirtCanvas'
import { ShirtSelector } from '@/components/designer/ShirtSelector'
import { TemplateLibrary } from '@/components/designer/TemplateLibrary'
import { TemplateControls } from '@/components/designer/TemplateControls'
import { SavedDesigns, saveDesignToStorage } from '@/components/designer/SavedDesigns'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shirt, Settings, RotateCcw, Palette, Layers } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function DesignerPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [shirtTemplates, setShirtTemplates] = useState<ShirtTemplate[]>([])
  const [selectedShirtTemplate, setSelectedShirtTemplate] = useState<ShirtTemplate | null>(null)
  const [cartStatus, setCartStatus] = useState<CartStatus>('idle')
  const [designState, setDesignState] = useState<DesignState>({
    shirtTemplateId: null,
    placedTemplates: [],
    selectedTemplateId: null,
    shirtColor: '#FFFFFF',
    view: 'front',
  })

  useEffect(() => {
    const loadedTemplates = getStoredTemplates()
    const loadedShirtTemplates = getStoredShirtTemplates()
    setTemplates(loadedTemplates)
    setShirtTemplates(loadedShirtTemplates)
    
    // Auto-select first enabled shirt template
    const firstEnabled = loadedShirtTemplates.find((t) => t.enabled)
    if (firstEnabled) {
      setSelectedShirtTemplate(firstEnabled)
      setDesignState((prev) => ({
        ...prev,
        shirtTemplateId: firstEnabled.id,
        view: firstEnabled.view,
      }))
    }
  }, [])

  const handleSelectShirtTemplate = useCallback((template: ShirtTemplate) => {
    setSelectedShirtTemplate(template)
    setDesignState((prev) => ({
      ...prev,
      shirtTemplateId: template.id,
      view: template.view,
      // Reset placed templates when changing shirt to avoid position issues
      // Or we could try to maintain them if dimensions match
    }))
    toast.success(`Selected ${template.name}`)
  }, [])

  const handleAddTemplate = useCallback((template: Template) => {
    if (!selectedShirtTemplate) {
      toast.error('Please select a shirt template first')
      return
    }

    // Calculate center position within printable area
    const centerX = selectedShirtTemplate.printable_x + 
      (selectedShirtTemplate.printable_width - template.width) / 2
    const centerY = selectedShirtTemplate.printable_y + 
      (selectedShirtTemplate.printable_height - template.height) / 2

    const newPlaced: PlacedTemplate = {
      id: generateId(),
      templateId: template.id,
      x: centerX,
      y: centerY,
      rotation: template.rotation,
    }

    setDesignState((prev) => ({
      ...prev,
      placedTemplates: [...prev.placedTemplates, newPlaced],
      selectedTemplateId: newPlaced.id,
    }))

    toast.success(`Added "${template.name}" to design`)
  }, [selectedShirtTemplate])

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
      if (!selectedShirtTemplate) return
      
      const placed = designState.placedTemplates.find((t) => t.id === id)
      if (!placed) return

      const template = templates.find((t) => t.id === placed.templateId)
      if (!template) return

      // Reset to center of printable area
      const centerX = selectedShirtTemplate.printable_x + 
        (selectedShirtTemplate.printable_width - template.width) / 2
      const centerY = selectedShirtTemplate.printable_y + 
        (selectedShirtTemplate.printable_height - template.height) / 2

      handleUpdateTemplate(id, {
        x: centerX,
        y: centerY,
        rotation: 0,
      })
      toast.success('Position reset')
    },
    [designState.placedTemplates, templates, handleUpdateTemplate, selectedShirtTemplate]
  )

  const handleSelectTemplate = useCallback((id: string | null) => {
    setDesignState((prev) => ({
      ...prev,
      selectedTemplateId: id,
    }))
  }, [])

  const handleSaveDesign = useCallback(() => {
    if (!selectedShirtTemplate) {
      toast.error('Please select a shirt template first')
      return
    }
    saveDesignToStorage(designState)
    toast.success('Design saved successfully!')
  }, [designState, selectedShirtTemplate])

  const handleLoadDesign = useCallback((design: DesignState) => {
    setDesignState(design)
    // Find and set the shirt template
    if (design.shirtTemplateId) {
      const shirtTemplate = shirtTemplates.find((t) => t.id === design.shirtTemplateId)
      if (shirtTemplate) {
        setSelectedShirtTemplate(shirtTemplate)
      }
    }
    toast.success('Design loaded!')
  }, [shirtTemplates])

  const handleClearDesign = useCallback(() => {
    setDesignState((prev) => ({
      ...prev,
      placedTemplates: [],
      selectedTemplateId: null,
    }))
    toast.success('Canvas cleared')
  }, [])

  const handleAddToCart = useCallback(async () => {
    if (!selectedShirtTemplate) {
      toast.error('Please select a product first')
      return
    }
    if (designState.placedTemplates.length === 0) {
      toast.error('Add at least one design to the shirt')
      return
    }

    const payload = buildDesignPayload(designState, templates, selectedShirtTemplate)

    try {
      await handleAddToCartFlow(payload, setCartStatus)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
      setCartStatus('idle')
    }
  }, [designState, templates, selectedShirtTemplate])

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
              <p className="text-xs text-muted-foreground">
                {selectedShirtTemplate ? selectedShirtTemplate.name : 'Select a product to begin'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleClearDesign}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <SavedDesigns 
              templates={templates} 
              shirtTemplates={shirtTemplates}
              onLoadDesign={handleLoadDesign} 
            />
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
          {/* Left Panel - Product & Template Selection */}
          <div className="h-[calc(100vh-120px)] bg-card rounded-2xl border border-border overflow-hidden order-2 lg:order-1">
            <Tabs defaultValue="products" className="h-full flex flex-col">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger 
                  value="products" 
                  className="flex-1 rounded-none data-[state=active]:bg-secondary data-[state=active]:shadow-none py-3"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Products
                </TabsTrigger>
                <TabsTrigger 
                  value="designs" 
                  className="flex-1 rounded-none data-[state=active]:bg-secondary data-[state=active]:shadow-none py-3"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Designs
                </TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="flex-1 m-0 overflow-hidden">
                <ShirtSelector
                  templates={shirtTemplates}
                  selectedId={selectedShirtTemplate?.id || null}
                  onSelect={handleSelectShirtTemplate}
                />
              </TabsContent>
              <TabsContent value="designs" className="flex-1 m-0 overflow-hidden">
                <TemplateLibrary 
                  templates={templates} 
                  onAddTemplate={handleAddTemplate}
                  disabled={!selectedShirtTemplate}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Canvas */}
          <div className="flex justify-center order-1 lg:order-2">
            <ShirtCanvas
              shirtTemplate={selectedShirtTemplate}
              placedTemplates={designState.placedTemplates}
              templates={templates}
              selectedTemplateId={designState.selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onUpdateTemplate={handleUpdateTemplate}
            />
          </div>

          {/* Right Panel - Controls */}
          <div className="h-[calc(100vh-120px)] order-3">
            <TemplateControls
              selectedTemplateId={designState.selectedTemplateId}
              placedTemplates={designState.placedTemplates}
              templates={templates}
              shirtTemplate={selectedShirtTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onRemoveTemplate={handleRemoveTemplate}
              onResetPosition={handleResetPosition}
              onSaveDesign={handleSaveDesign}
              onAddToCart={handleAddToCart}
              cartStatus={cartStatus}
            />
          </div>
        </div>
      </main>

      <Toaster position="bottom-center" />
    </div>
  )
}
