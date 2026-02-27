'use client'

import { ShirtTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ShirtTemplateTableProps {
  templates: ShirtTemplate[]
  onEdit: (template: ShirtTemplate) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

export function ShirtTemplateTable({
  templates,
  onEdit,
  onDelete,
  onToggleEnabled,
}: ShirtTemplateTableProps) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Preview</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Product Type</TableHead>
            <TableHead>View</TableHead>
            <TableHead>Canvas</TableHead>
            <TableHead>Shirt</TableHead>
            <TableHead>Printable</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                No shirt templates found
              </TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="w-16 h-20 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                    {template.image_url ? (
                      <Image
                        src={template.image_url}
                        alt={template.name}
                        width={64}
                        height={80}
                        className="object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{template.product_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {template.view}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {template.canvas_width} x {template.canvas_height}px
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {template.printable_width} x {template.printable_height}px
                  <br />
                  <span className="text-xs">
                    at ({template.printable_x}, {template.printable_y})
                  </span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={template.enabled}
                    onCheckedChange={(checked) =>
                      onToggleEnabled(template.id, checked)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(template)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
