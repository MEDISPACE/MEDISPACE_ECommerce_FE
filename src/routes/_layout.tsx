import { Outlet } from 'react-router'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { FloatingChatWidget } from '../components/chat'

export default function Layout() {
  return (
    <div className='min-h-screen w-full min-w-0 overflow-x-hidden bg-background'>
      {/* Header with navigation, user menu, cart icon */}
      <Header />

      <div className='flex w-full min-w-0 overflow-x-hidden'>
        {/* Future: Sidebar for navigation/categories */}
        {/* <Sidebar /> */}

        <main className='w-full min-w-0 flex-1 overflow-x-hidden'>
          <Outlet />
        </main>
      </div>

      {/* Footer with links, contact info */}
      <Footer />

      {/* Floating Chat Widget (Customer only) */}
      <FloatingChatWidget />
    </div>
  )
}
