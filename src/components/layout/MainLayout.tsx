import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="layout-root grain-overlay">
      <Sidebar />
      <div className="layout-content mesh-gradient">
        <TopBar />
        <main className="layout-main">
          <div className="layout-main-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
