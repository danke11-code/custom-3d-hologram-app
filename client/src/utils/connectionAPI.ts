export async function testConnection(ip: string, port = 8899): Promise<{ ok: boolean; error?: string }> {
  const resp = await fetch('/api/connection/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, port })
  })
  return await resp.json()
}

export async function smartConfig(ssid: string, password: string, port = 7001, repeats = 20, intervalMs = 200): Promise<{ ok: boolean; error?: string }> {
  const resp = await fetch('/api/connection/smartconfig', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password, port, repeats, intervalMs })
  })
  return await resp.json()
}
