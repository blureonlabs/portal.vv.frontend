import { useState } from 'react'
import { Plus, Pencil, Trash2, Settings2 } from 'lucide-react'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ModalForm } from '../../components/ui/ModalForm'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { ConfigItem, ConfigDocumentType } from '../../types'

type AnyConfigItem = ConfigItem | ConfigDocumentType

interface ConfigCrudTableProps {
  title: string
  items: AnyConfigItem[]
  isLoading: boolean
  onAdd: (data: { name: string; code: string; applies_to?: string }) => void
  onUpdate: (id: string, data: { name: string; is_active: boolean; sort_order: number }) => void
  onDelete: (id: string) => void
  addPending?: boolean
  showAppliesTo?: boolean
}

function isDocType(item: AnyConfigItem): item is ConfigDocumentType {
  return 'applies_to' in item
}

export function ConfigCrudTable({
  title,
  items,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  addPending,
  showAppliesTo = false,
}: ConfigCrudTableProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<AnyConfigItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Add form state
  const [addName, setAddName] = useState('')
  const [addCode, setAddCode] = useState('')
  const [addAppliesTo, setAddAppliesTo] = useState('both')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editSortOrder, setEditSortOrder] = useState(0)

  const resetAddForm = () => {
    setAddName('')
    setAddCode('')
    setAddAppliesTo('both')
  }

  const handleOpenAdd = () => {
    resetAddForm()
    setAddOpen(true)
  }

  const handleAdd = () => {
    const data: { name: string; code: string; applies_to?: string } = {
      name: addName.trim(),
      code: addCode.trim(),
    }
    if (showAppliesTo) data.applies_to = addAppliesTo
    onAdd(data)
    setAddOpen(false)
    resetAddForm()
  }

  const handleOpenEdit = (item: AnyConfigItem) => {
    setEditItem(item)
    setEditName(item.name)
    setEditActive(item.is_active)
    setEditSortOrder(item.sort_order)
  }

  const handleUpdate = () => {
    if (!editItem) return
    onUpdate(editItem.id, {
      name: editName.trim(),
      is_active: editActive,
      sort_order: editSortOrder,
    })
    setEditItem(null)
  }

  const handleConfirmDelete = () => {
    if (!deleteId) return
    onDelete(deleteId)
    setDeleteId(null)
  }

  const columns: Column<AnyConfigItem>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium text-primary">{row.name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => <span className="text-muted font-mono text-xs">{row.code}</span>,
    },
  ]

  if (showAppliesTo) {
    columns.push({
      key: 'applies_to',
      header: 'Applies To',
      render: (row) => {
        const val = isDocType(row) ? row.applies_to : '—'
        const variant = val === 'driver' ? 'default' : val === 'vehicle' ? 'warning' : 'success'
        return <Badge variant={variant}>{val}</Badge>
      },
    })
  }

  columns.push(
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'muted'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'sort_order',
      header: 'Sort Order',
      align: 'center',
      render: (row) => <span className="text-muted tabular-nums">{row.sort_order}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenEdit(row) }}
            className="p-2 text-muted hover:text-primary hover:bg-surface rounded-lg transition-colors"
            title="Edit"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(row.id) }}
            className="p-2 text-muted hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
            title="Deactivate"
            aria-label="Deactivate"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus size={16} />
          Add {title.replace(/s$/, '')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        emptyIcon={Settings2}
        emptyTitle={`No ${title.toLowerCase()} found`}
        emptyDescription={`Add your first ${title.toLowerCase().replace(/s$/, '')} to get started.`}
      />

      {/* Add Modal */}
      <ModalForm open={addOpen} onClose={() => setAddOpen(false)} title={`Add ${title.replace(/s$/, '')}`}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleAdd() }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="e.g. Fuel"
            required
          />
          <Input
            label="Code"
            value={addCode}
            onChange={(e) => setAddCode(e.target.value)}
            placeholder="e.g. fuel"
            required
          />
          {showAppliesTo && (
            <Select
              label="Applies To"
              value={addAppliesTo}
              onChange={(e) => setAddAppliesTo(e.target.value)}
              options={[
                { value: 'driver', label: 'Driver' },
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'both', label: 'Both' },
              ]}
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addPending} disabled={!addName.trim() || !addCode.trim()}>
              Add
            </Button>
          </div>
        </form>
      </ModalForm>

      {/* Edit Modal */}
      <ModalForm
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        title={`Edit ${title.replace(/s$/, '')}`}
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleUpdate() }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Select
            label="Status"
            value={editActive ? 'true' : 'false'}
            onChange={(e) => setEditActive(e.target.value === 'true')}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
          <Input
            label="Sort Order"
            type="number"
            value={String(editSortOrder)}
            onChange={(e) => setEditSortOrder(Number(e.target.value))}
            min={0}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!editName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </ModalForm>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Deactivate Item"
        message="Are you sure you want to deactivate this item? It can be re-activated later."
        confirmLabel="Deactivate"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
