import React from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortablePage({ id, index, content }) {
  // dnd-kit sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging ? '#f1f3ff' : '#fff',
    border: isDragging ? '2px dashed #3b82f6' : '1px solid #e5e7eb',
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    cursor: 'grab',
    userSelect: 'none',
    fontWeight: 500,
    boxShadow: isDragging ? '0 2px 12px rgba(59,130,246,0.1)' : '',
  }
  // For preview, show a snippet of plain text
  const getPreview = (html) =>
    html ? html.replace(/<[^>]+>/g, '').slice(0, 48) : ''

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span style={{ marginRight: 12, color: '#6366f1' }}>
        Page {index + 1}
      </span>
      <span style={{ color: '#6b7280', fontSize: 13 }}>
        {getPreview(content)}
      </span>
    </div>
  )
}

export default function PageList({ pages, onReorder }) {
  const [items, setItems] = React.useState(pages.map((page) => page.id))

  React.useEffect(() => {
    setItems(pages.map((page) => page.id))
  }, [pages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id)
      const newIndex = items.indexOf(over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      setItems(newOrder) // Optimistic update
      onReorder(newOrder) // Notify parent
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id, idx) => {
          const page = pages.find((p) => p.id === id)
          return (
            <SortablePage
              key={id}
              id={id}
              index={idx}
              content={page?.content || ''}
            />
          )
        })}
      </SortableContext>
    </DndContext>
  )
}
