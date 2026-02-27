'use client'

import { Template } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface AdminTemplateTableProps {
  templates: Template[]
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

export function AdminTemplateTable({
  templates,
  onEdit,
  onDelete,
  onToggleEnabled,
}: AdminTemplateTableProps) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Default Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <div className="relative w-12 h-12 bg-secondary rounded-lg overflow-hidden">
                  <Image
                    src={template.image_url}
                    alt={template.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{template.category}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {template.width} x {template.height}px
              </TableCell>
              <TableCell className="text-muted-foreground">
                ({template.default_x}, {template.default_y})
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.enabled}
                    onCheckedChange={(checked) => onToggleEnabled(template.id, checked)}
                  />
                  <span className={`text-xs ${template.enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {template.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No templates found. Add your first template to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
