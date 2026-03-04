'use client'

import { useState } from 'react'
import { Template } from '@/lib/types'
import { templateCategories } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Plus } from 'lucide-react'
import Image from 'next/image'

interface TemplateLibraryProps {
  templates: Template[]
  onAddTemplate: (template: Template) => void
  disabled?: boolean
}

export function TemplateLibrary({ templates, onAddTemplate, disabled }: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = templates.filter((template) => {
    if (!template.enabled) return false
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="relative flex flex-col h-full bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {disabled && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            Select a product first to add designs
          </p>
        </div>
      )}
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-3">Template Library</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-3 border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {templateCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Template Grid */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onAddTemplate(template)}
              className="group relative aspect-square bg-secondary rounded-xl p-4 hover:bg-muted transition-colors border border-transparent hover:border-accent/50"
            >
              <div className="relative w-full h-full">
                <Image
                  src={template.image_url}
                  alt={template.name}
                  fill
                  className="object-contain"
                />
              </div>
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-primary/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Plus className="w-6 h-6 text-primary-foreground" />
                <span className="text-xs font-medium text-primary-foreground text-center px-2">
                  {template.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">No templates found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
