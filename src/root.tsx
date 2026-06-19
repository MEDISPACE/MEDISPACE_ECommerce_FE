import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '~/contexts/AuthContext'
import { CartProvider } from '~/contexts/CartContext'
import { BreadcrumbProvider } from '~/contexts/BreadcrumbContext'
import { SocketProvider } from '~/contexts/SocketContext'
import { WishlistProvider } from './hooks'
import { Toaster } from './components/ui/sonner'
import './style/globals.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collection time (formerly cacheTime in v4)
      retry: 3, // Retry failed requests 3 times
      refetchOnWindowFocus: true, // Refetch when window regains focus
    },
  },
})

export const links: LinksFunction = () => []

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='vi'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='color-scheme' content='only light' />
        <meta name='theme-color' content='rgba(255, 255, 255, 0.999)' />
        <meta name='description' content='Nền tảng mua thuốc trực tuyến uy tín, an toàn và tiện lợi' />
        <Meta />
        <Links />
      </head>
      <body style={{ backgroundColor: '#F8FAFB', colorScheme: 'light' }}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <WishlistProvider>
              <BreadcrumbProvider>
                <Outlet />
                <Toaster position='top-right' />
              </BreadcrumbProvider>
            </WishlistProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
