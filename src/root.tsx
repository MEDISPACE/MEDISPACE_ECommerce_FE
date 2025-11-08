import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { LinksFunction } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './hooks'
import { Toaster } from 'sonner'
import './style/globals.css'

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
  )
}

export default function Root() {
  return <Outlet />
}
