import { Outlet } from 'react-router'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function Layout() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header with navigation, user menu, cart icon */}
      <Header />

      <div className='flex'>
        {/* Future: Sidebar for navigation/categories */}
        {/* <Sidebar /> */}

        <main className='flex-1'>
          <Outlet />
        </main>
      </div>

      {/* Footer with links, contact info */}
      <Footer />
    </div>
  )
}
