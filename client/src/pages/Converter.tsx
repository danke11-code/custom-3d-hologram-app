import React, { useMemo, useRef, useState } from 'react'
import { uploadAndConvert } from '../utils/converterAPI'
import LEDPreview from '../components/LEDPreview'
import FileUpload from '../components/FileUpload'

export default function Converter() {
  const [files, setFiles] = useState<File[]>([])
  const [jobs, setJobs] = useState<Record<string, any>>({})
  const [progress, setProgress] = useState<{total:number; done:number}>({ total: 0, done: 0 })
  const fpsRef = useRef<HTMLInputElement>(null)
  const brightnessRef = useRef<HTMLInputElement>(null)
  const rotationRef = useRef<HTMLInputElement>(null)

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(prev => [...prev, ...dropped])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    const fps = Number(fpsRef.current?.value || 24)
    const brightness = Number(brightnessRef.current?.value || 255)
    const rotation = Number(rotationRef.current?.value || 0)
    setProgress({ total: files.length, done: 0 })

    const jobIds = await uploadAndConvert(files, { fps, brightness, rotation })
    const jobMap: Record<string, any> = {}
    jobIds.forEach(id => jobMap[id] = { id, status: 'queued', progress: 0 })
    setJobs(jobMap)

    const poll = async () => {
      const resp = await fetch('/api/converter/jobs')
      const data = await resp.json()
      const newMap: Record<string, any> = {}
      let done = 0
      for (const j of data.jobs as any[]) {
        newMap[j.id] = j
        if (j.status === 'done' || j.status === 'error') done++
      }
      setJobs(newMap)
      setProgress(p => ({ total: p.total, done }))
      if (done < jobIds.length) setTimeout(poll, 1000)
    }
    poll()
  }

  const converted = useMemo(() => Object.values(jobs).filter(j => j.resultFilename), [jobs])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <FileUpload onFiles={(d)=>setFiles(prev => [...prev, ...d])} title="Upload File – MP4, JPG, PNG, GIF" />
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-neutral-900 px-3 py-2 rounded">
              <span>{f.name}</span>
              <button className="text-red-400 text-xs" onClick={()=>removeFile(i)} title="Remove from selection">Remove</button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs">FPS
            <input ref={fpsRef} defaultValue={24} type="number" min={1} max={60} className="w-full bg-neutral-900 rounded px-2 py-1" title="Frames per second"/>
          </label>
          <label className="text-xs">Brightness
            <input ref={brightnessRef} defaultValue={255} type="number" min={1} max={255} className="w-full bg-neutral-900 rounded px-2 py-1" title="Brightness scale (0-255)"/>
          </label>
          <label className="text-xs">Rotation
            <input ref={rotationRef} defaultValue={0} type="number" min={0} max={359} className="w-full bg-neutral-900 rounded px-2 py-1" title="Rotation angle in degrees"/>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleConvert} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded" title="Convert selected files">Convert</button>
        </div>
        <div className="text-sm text-neutral-400">Progress: {progress.done}/{progress.total}</div>
        <div className="space-y-2">
          {Object.values(jobs).map((j:any)=> (
            <div key={j.id} className="text-xs bg-neutral-900 rounded px-3 py-2 flex justify-between">
              <span>{j.filename}</span>
              <span>{j.status} {j.progress}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <LEDPreview files={converted.map((j:any)=>`/output/${j.resultFilename}`)} fpsOverride={undefined}/>
        <div className="space-y-1">
          {converted.map((j:any) => (
            <div key={j.id} className="flex items-center justify-between text-xs bg-neutral-900 px-3 py-2 rounded">
              <a href={`/api/converter/download/${j.resultFilename}`} className="text-blue-400" title="Download .bin">Download</a>
              <span className="text-neutral-400">{j.resultFilename}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
