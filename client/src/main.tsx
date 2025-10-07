import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link, Outlet } from 'react-router-dom'
import './index.css'
import Converter from './pages/Converter'
import Playlist from './pages/Playlist'
import Uploader from './pages/Uploader'
import Settings from './pages/Settings'

function Layout() {
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
          </nav>
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
  ]}
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
