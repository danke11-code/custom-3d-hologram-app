import React, { useEffect, useState } from 'react'

export default function Settings() {
  const [fps, setFps] = useState<number>(() => Number(localStorage.getItem('fps') || 24))
  const [brightness, setBrightness] = useState<number>(() => Number(localStorage.getItem('brightness') || 255))
  const [rotation, setRotation] = useState<number>(() => Number(localStorage.getItem('rotation') || 0))

  useEffect(() => { localStorage.setItem('fps', String(fps)) }, [fps])
  useEffect(() => { localStorage.setItem('brightness', String(brightness)) }, [brightness])
  useEffect(() => { localStorage.setItem('rotation', String(rotation)) }, [rotation])

  const savePreset = () => {
    const name = prompt('Preset name?')
    if (!name) return
    const presets = JSON.parse(localStorage.getItem('presets') || '{}')
    presets[name] = { fps, brightness, rotation }
    localStorage.setItem('presets', JSON.stringify(presets))
  }
  const loadPreset = () => {
    const presets = JSON.parse(localStorage.getItem('presets') || '{}')
    const name = prompt('Preset name to load?')
    if (!name || !presets[name]) return
    setFps(presets[name].fps)
    setBrightness(presets[name].brightness)
    setRotation(presets[name].rotation)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm" title="Frames per second">
          FPS
          <input type="number" min={1} max={60} value={fps} onChange={e=>setFps(Number(e.target.value))} className="w-full bg-neutral-900 rounded px-2 py-2 mt-1" />
        </label>
        <label className="text-sm" title="Brightness scale (0-255)">
          Brightness
          <input type="number" min={1} max={255} value={brightness} onChange={e=>setBrightness(Number(e.target.value))} className="w-full bg-neutral-900 rounded px-2 py-2 mt-1" />
        </label>
        <label className="text-sm" title="Rotation angle in degrees">
          Rotation
          <input type="number" min={0} max={359} value={rotation} onChange={e=>setRotation(Number(e.target.value))} className="w-full bg-neutral-900 rounded px-2 py-2 mt-1" />
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={savePreset} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded" title="Save current settings as preset">Save Preset</button>
        <button onClick={loadPreset} className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded" title="Load a saved preset">Load Preset</button>
      </div>
    </div>
  )
}
