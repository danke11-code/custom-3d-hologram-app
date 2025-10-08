import React, { useEffect, useState } from 'react'
import { testConnection, smartConfig } from '../utils/connectionAPI'

export default function Connection() {
  const [ip, setIp] = useState<string>(() => localStorage.getItem('fan_ip') || '')
  const [testing, setTesting] = useState(false)
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => { localStorage.setItem('fan_ip', ip) }, [ip])

  const onTest = async () => {
    if (!ip) return
    setTesting(true)
    const res = await testConnection(ip)
    setOk(res.ok)
    setTesting(false)
  }

  const onSmartConfig = async () => {
    const ssid = prompt('Wi-Fi SSID?')
    const password = prompt('Wi-Fi Password?')
    if (!ssid || !password) return
    const res = await smartConfig(ssid, password)
    if (res.ok) alert('SmartConfig broadcast sent'); else alert(res.error || 'Failed')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm" title="Manual IP entry">
          Fan IP
          <input value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.50" className="w-full bg-neutral-900 rounded px-2 py-2 mt-1" />
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={onTest} disabled={!ip || testing} className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded" title="Test Connection">
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={onSmartConfig} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded" title="SmartConfig: send SSID/Password via UDP broadcast">
          SmartConfig
        </button>
      </div>
      {ok != null && (
        <div className={`text-sm ${ok ? 'text-green-400' : 'text-red-400'}`}>
          {ok ? 'Fan reachable' : 'Fan unreachable'}
        </div>
      )}
    </div>
  )
}
