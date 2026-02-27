'use client'

import { ShirtTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shirt, Check } from 'lucide-react'
import Image from 'next/image'
import { useState, useMemo } from 'react'

interface ShirtSelectorProps {
  templates: ShirtTemplate[]
  selectedId: string | null
  onSelect: (template: ShirtTemplate) => void
}

export function ShirtSelector({ templates, selectedId, onSelect }: ShirtSelectorProps) {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterView, setFilterView] = useState<'all' | 'front' | 'back'>('all')

  const enabledTemplates = templates.filter((t) => t.enabled)

  const productTypes = useMemo(() => {
    const types = [...new Set(enabledTemplates.map((t) => t.product_type))]
    return ['all', ...types]
  }, [enabledTemplates])

  const filteredTemplates = useMemo(() => {
    return enabledTemplates.filter((t) => {
      const matchesType = filterType === 'all' || t.product_type === filterType
      const matchesView = filterView === 'all' || t.view === filterView
      return matchesType && matchesView
    })
  }, [enabledTemplates, filterType, filterView])

  // Group by product type for better organization
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, ShirtTemplate[]> = {}
    filteredTemplates.forEach((t) => {
      if (!groups[t.product_type]) {
        groups[t.product_type] = []
      }
      groups[t.product_type].push(t)
    })
    return groups
  }, [filteredTemplates])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Shirt className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Select Product</h2>
            <p className="text-xs text-muted-foreground">Choose your base</p>
          </div>
        </div>

        {/* Product Type Filter */}
        <div className="flex flex-wrap gap-2">
          {productTypes.map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="text-xs capitalize"
            >
              {type === 'all' ? 'All Products' : type}
            </Button>
          ))}
        </div>

        {/* View Filter */}
        <div className="flex gap-2">
          <Button
            variant={filterView === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterView('all')}
            className="flex-1 text-xs"
          >
            All Views
          </Button>
          <Button
            variant={filterView === 'front' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterView('front')}
            className="flex-1 text-xs"
          >
            Front
          </Button>
          <Button
            variant={filterView === 'back' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterView('back')}
            className="flex-1 text-xs"
          >
            Back
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedTemplates).map(([productType, templates]) => (
            <div key={productType} className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {productType}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => {
                  const isSelected = selectedId === template.id
                  return (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-accent ring-2 ring-accent/20'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="aspect-[4/5] bg-secondary relative">
                        <Image
                          src={template.image_url}
                          alt={template.name}
                          fill
                          className="object-contain p-2"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-accent-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-card">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {template.view}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Shirt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No templates found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
