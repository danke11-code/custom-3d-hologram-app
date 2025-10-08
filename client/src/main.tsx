import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom'
import './index.css'
import Converter from './pages/Converter'
import Playlist from './pages/Playlist'
import Uploader from './pages/Uploader'
import Settings from './pages/Settings'
import Connection from './pages/Connection'

function ConnectionDot({ ok }: { ok: boolean | null }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
}

function useAutoReconnect() {
  const [ok, setOk] = React.useState<boolean | null>(null)
  React.useEffect(() => {
    const ip = localStorage.getItem('fan_ip')
    if (!ip) return
    let aborted = false
    const check = async () => {
      try {
        const resp = await fetch('/api/connection/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip }) })
        const data = await resp.json()
        if (!aborted) setOk(!!data.ok)
      } catch {
        if (!aborted) setOk(false)
      }
    }
    check()
    const id = setInterval(check, 5000)
    return () => { aborted = true; clearInterval(id) }
  }, [])
  return ok
}

function Layout() {
  const ok = useAutoReconnect()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-800">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="font-semibold">LED Hologram Fan Studio</h1>
          <nav className="ml-auto flex gap-3 text-sm">
            <Link to="/">Converter</Link>
            <Link to="/playlist">Playlist</Link>
            <Link to="/uploader">Uploader</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/connection">Connection</Link>
          </nav>
          <div className="ml-4" title="Fan connection status">
            <ConnectionDot ok={ok} />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-800 text-xs text-neutral-400 py-3 text-center">
        Local processing only. No internet required.
      </footer>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Layout />, children: [
    { index: true, element: <Converter /> },
    { path: 'playlist', element: <Playlist /> },
    { path: 'uploader', element: <Uploader /> },
    { path: 'settings', element: <Settings /> },
    { path: 'connection', element: <Connection /> },
  ]}
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
