export async function uploadToFan(ip: string, files: string[], port = 8899) {
  const resp = await fetch('/api/uploader/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, port, files })
  })
  if (!resp.ok) throw new Error('Upload failed')
  return await resp.json()
}
