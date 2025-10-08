import React, { useEffect, useState } from 'react'

export default function Uploader() {
  const [ip, setIp] = useState<string>(() => localStorage.getItem('fan_ip') || '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [available, setAvailable] = useState<string[]>([])
  const [uploading, setUploading] = useState<boolean>(false)

  useEffect(() => { localStorage.setItem('fan_ip', ip) }, [ip])
  useEffect(() => {
    // naive list by calling index of /output (static hosting disabled dir listing by default)
    // Instead, user will paste filenames; we can aid by reading recent jobs from /api/converter/jobs
    const poll = async () => {
      const resp = await fetch('/api/converter/jobs')
      const data = await resp.json()
      setAvailable(Array.from(new Set((data.jobs as any[]).map(j => j.resultFilename).filter(Boolean))))
    }
    poll()
  }, [])

  const upload = async () => {
    if (!ip || selected.size === 0) return
    setUploading(true)
    try {
      const resp = await fetch('/api/uploader/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, files: Array.from(selected) })
      })
      if (!resp.ok) throw new Error('Upload failed')
      alert('Upload complete')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm" title="Fan IP address">
          Fan IP
          <input value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.50" className="w-full bg-neutral-900 rounded px-2 py-2 mt-1" />
        </label>
      </div>
      <div className="space-y-2" title="Select .bin files to upload sequentially">
        <div className="text-sm text-neutral-400">Available .bin files</div>
        <div className="max-h-64 overflow-auto border border-neutral-800 rounded">
          {available.length === 0 && (
            <div className="text-xs text-neutral-500 p-2">No files yet. Convert some on the Converter tab.</div>
          )}
          {available.map(a => {
            const checked = selected.has(a)
            return (
              <label key={a} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e)=>{
                    setSelected(prev => {
                      const next = new Set(prev)
                      if (e.target.checked) next.add(a); else next.delete(a)
                      return next
                    })
                  }}
                />
                {a}
              </label>
            )
          })}
        </div>
      </div>
      <button onClick={upload} disabled={uploading || !ip || selected.size === 0} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded" title="Upload to Fan">
        {uploading ? 'Uploading...' : `Upload ${selected.size} file(s) to Fan`}
      </button>
    </div>
  )
}
