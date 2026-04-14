import type { Product } from '~/types/product'
import type { Review, ReviewStats } from '~/types/review'

/**
 * Generate JSON-LD structured data for product with reviews
 * This helps Google display rich snippets with star ratings in search results
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */
export function generateProductStructuredData(product: Product, reviews: Review[], stats: ReviewStats | null) {
  // Base product data
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images?.[0] || product.featuredImage,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'MEDISPACE',
    },
  }

  // Add offers (price and availability)
  if (product.price) {
    structuredData.offers = {
      '@type': 'Offer',
      price: product.salePrice || product.price,
      priceCurrency: 'VND',
      availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : '',
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    }
  }

  // Add aggregate rating if we have reviews
  if (stats && stats.total > 0) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: stats.averageRating.toFixed(1),
      reviewCount: stats.total,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Add individual reviews (max 5 for performance)
  if (reviews.length > 0) {
    structuredData.review = reviews
      .filter((review) => review.status === 'approved') // Only approved reviews
      .slice(0, 5) // Limit to 5 reviews
      .map((review) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.userName || 'Anonymous',
        },
        datePublished: new Date(review.createdAt).toISOString().split('T')[0],
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.comment,
      }))
  }

  return structuredData
}
