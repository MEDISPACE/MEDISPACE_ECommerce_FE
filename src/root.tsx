import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '~/contexts/AuthContext'
import { CartProvider } from '~/contexts/CartContext'
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

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <html lang='vi'>
              <head>
                <meta charSet='utf-8' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <meta name='color-scheme' content='light only' />
                <meta name='theme-color' content='#ffffff' />
                <meta name='title' content='MEDISPACE - Nền tảng mua thuốc trực tuyến' />
                <meta name='description' content='Nền tảng mua thuốc trực tuyến uy tín, an toàn và tiện lợi' />
                <Meta />
                <Links />
              </head>
              <body style={{ backgroundColor: '#ffffff', colorScheme: 'light' }}>
                {children}
                <Toaster position='top-right' />
                <ScrollRestoration />
                <Scripts />
              </body>
            </html>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default function Root() {
  return <Outlet />
}
