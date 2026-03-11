import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen bg-bg overflow-hidden grain-overlay">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 mesh-gradient">
        <TopBar />
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
