import type { Product } from '~/types/product'
import type { Review, ReviewStats } from '~/types/review'
import { generateProductStructuredData } from '~/utils/seo'

/**
 * React component to inject structured data into page head
 * Renders a JSON-LD script tag for Google rich snippets
 */
export function ProductStructuredData({
  product,
  reviews,
  stats,
}: {
  product: Product
  reviews: Review[]
  stats: ReviewStats | null
}) {
  const structuredData = generateProductStructuredData(product, reviews, stats)

  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
