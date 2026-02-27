'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShirtTemplate } from '@/lib/types'
import { getStoredShirtTemplates, saveShirtTemplates, generateId } from '@/lib/store'
import { ShirtTemplateTable } from '@/components/admin/ShirtTemplateTable'
import { ShirtTemplateEditor } from '@/components/admin/ShirtTemplateEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Shirt, Plus, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function ShirtTemplatesPage() {
  const [templates, setTemplates] = useState<ShirtTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<ShirtTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setTemplates(getStoredShirtTemplates())
  }, [])

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.product_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveTemplate = useCallback((template: ShirtTemplate) => {
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === template.id)
      let updated: ShirtTemplate[]
      if (exists) {
        updated = prev.map((t) => (t.id === template.id ? template : t))
        toast.success('Shirt template updated successfully')
      } else {
        updated = [...prev, template]
        toast.success('Shirt template added successfully')
      }
      saveShirtTemplates(updated)
      return updated
    })
    setEditingTemplate(null)
    setIsEditorOpen(false)
  }, [])

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      saveShirtTemplates(updated)
      return updated
    })
    setDeleteId(null)
    toast.success('Shirt template deleted')
  }, [])

  const handleToggleEnabled = useCallback((id: string, enabled: boolean) => {
    setTemplates((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, enabled } : t))
      saveShirtTemplates(updated)
      return updated
    })
    toast.success(enabled ? 'Template enabled' : 'Template disabled')
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingTemplate(null)
    setIsEditorOpen(true)
  }, [])

  const handleEdit = useCallback((template: ShirtTemplate) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }, [])

  // Get unique product types
  const productTypes = [...new Set(templates.map((t) => t.product_type))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Shirt className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Shirt Templates</h1>
                <p className="text-xs text-muted-foreground">Manage base product mockups</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Templates</p>
            <p className="text-3xl font-semibold mt-1">{templates.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Active Templates</p>
            <p className="text-3xl font-semibold mt-1">
              {templates.filter((t) => t.enabled).length}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Product Types</p>
            <p className="text-3xl font-semibold mt-1">{productTypes.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Front/Back Views</p>
            <p className="text-3xl font-semibold mt-1">
              {templates.filter((t) => t.view === 'front').length} / {templates.filter((t) => t.view === 'back').length}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shirt templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shirt Template
          </Button>
        </div>

        {/* Table */}
        <ShirtTemplateTable
          templates={filteredTemplates}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          onToggleEnabled={handleToggleEnabled}
        />
      </main>

      {/* Editor Dialog */}
      <ShirtTemplateEditor
        template={editingTemplate}
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleSaveTemplate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shirt Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shirt template? This action cannot be undone.
              Saved designs using this template may no longer display correctly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteTemplate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-center" />
    </div>
  )
}
