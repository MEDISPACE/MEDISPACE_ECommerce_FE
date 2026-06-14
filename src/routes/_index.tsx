import { Navigate } from 'react-router'
import { HomePage } from '~/components/home/HomePage'
import { useAuth } from '~/contexts/AuthContext'
import { UserRole } from '~/types/user'

export function meta() {
  const title = 'MEDISPACE - Nhà thuốc trực tuyến #1 Việt Nam'
  const description = 'Mua thuốc trực tuyến an toàn, tiện lợi. Giao hàng nhanh, tư vấn miễn phí từ dược sĩ chuyên nghiệp.'

  return [
    { title },
    {
      name: 'description',
      content: description,
    },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: 'https://medispace.vn/og-cover.jpg' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://medispace.vn' },
    { property: 'og:site_name', content: 'MEDISPACE' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { tagName: 'link', rel: 'canonical', href: 'https://medispace.vn' },
  ]
}

const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'Pharmacy'],
      '@id': 'https://medispace.vn/#organization',
      name: 'MEDISPACE',
      url: 'https://medispace.vn',
      telephone: '1800 6928',
      areaServed: 'VN',
      slogan: 'Sức khỏe trong tầm tay',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://medispace.vn/#website',
      url: 'https://medispace.vn',
      name: 'MEDISPACE',
      publisher: { '@id': 'https://medispace.vn/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://medispace.vn/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth()

  // Redirect authenticated users based on their role
  if (!loading && isAuthenticated && user) {
    // Admin users go to admin dashboard
    if (user.role === UserRole.Admin) {
      return <Navigate to='/admin/dashboard' replace />
    }

    // Pharmacist users go to pharmacist dashboard
    if (user.role === UserRole.Pharmacist) {
      // return <Navigate to='/pharmacist/dashboard' replace />
      return <Navigate to='/pharmacist' replace />
    }

    // Customer users (UserRole.Customer) see the normal homepage
    // Fall through to return <HomePage />
  }

  // Unauthenticated users and customers see the normal homepage
  return (
    <>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }} />
      <HomePage />
    </>
  )
}
