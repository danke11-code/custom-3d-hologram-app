import React from 'react'

export default function FileUpload({ onFiles, title }: { onFiles: (files: File[]) => void; title?: string }) {
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    onFiles(dropped)
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : []
    onFiles(picked)
  }

  return (
    <div onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}
         className="border-2 border-dashed rounded-lg p-8 text-center text-neutral-400">
      {title || 'Drag & drop files here'}
      <div className="mt-4">
        <label className="inline-block bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded cursor-pointer" title="Upload File">
          Browse...
          <input type="file" multiple className="hidden" onChange={onPick} />
        </label>
      </div>
    </div>
  )
}
