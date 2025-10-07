import React, { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from '../components/ui/SortableItem'

export type PlaylistItem = { id: string; name: string; bin?: string }

export default function Playlist() {
  const [items, setItems] = useState<PlaylistItem[]>(() => {
    const s = localStorage.getItem('playlist')
    return s ? JSON.parse(s) : []
  })
  const [loop, setLoop] = useState<boolean>(() => localStorage.getItem('loop') === 'true')

  useEffect(() => { localStorage.setItem('playlist', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('loop', loop ? 'true' : 'false') }, [loop])

  const sensors = useSensors(useSensor(PointerSensor))

  const onDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    setItems(arrayMove(items, oldIndex, newIndex))
  }

  const addFromConverted = () => {
    const input = prompt('Enter .bin filename (from /output)')
    if (!input) return
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: input, bin: input }])
  }

  const remove = (id: string) => {
    if (!confirm('Delete this playlist item?')) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={addFromConverted} className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded" title="Add to Playlist">Add .bin</button>
        <label className="text-sm flex items-center gap-2" title="Auto-loop playback">
          <input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)} />
          🔁 Auto-loop
        </label>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map(i => (
              <SortableItem key={i.id} id={i.id}>
                <div className="flex items-center justify-between bg-neutral-900 rounded px-3 py-2">
                  <span className="text-sm">{i.name}</span>
                  <button className="text-red-400 text-xs" onClick={()=>remove(i.id)} title="Remove">Delete</button>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
