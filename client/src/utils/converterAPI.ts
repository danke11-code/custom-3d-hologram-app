export type ConvertSettings = { fps: number; brightness: number; rotation?: number; compression?: number }

export async function uploadAndConvert(files: File[], settings: ConvertSettings): Promise<string[]> {
  const form = new FormData()
  for (const f of files) form.append('files', f)
  form.append('fps', String(settings.fps))
  form.append('brightness', String(settings.brightness))
  if (settings.rotation != null) form.append('rotation', String(settings.rotation))
  if (settings.compression != null) form.append('compression', String(settings.compression))
  const resp = await fetch('/api/converter/convert', { method: 'POST', body: form })
  if (!resp.ok) throw new Error('Upload failed')
  const data = await resp.json()
  return data.jobIds
}
