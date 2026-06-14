/**
 * RecommendationCarousel — Shared UI component cho tất cả recommendation sections
 * Design đồng bộ với hệ thống: blue gradient header, ProductCard, ScrollReveal animation
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, ShoppingBag, ArrowRight, EyeOff, Clock3, Info } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../ui/button'
import { ProductCard } from './ProductCard'
import { ScrollReveal } from '../shared/ScrollReveal'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import type { RecommendedProduct } from '../../services/recommendationService'
import type { Product } from '../../types/product'
import { recommendationService } from '../../services/recommendationService'
import {
  getProductSalePrice,
  getProductOriginalPrice,
  getProductUnit,
  getDiscountPercentage,
  isProductOnSale,
} from '../../utils/productHelpers'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'trending' | 'for-you' | 'bundle' | 'post-purchase' | 'related'

interface RecommendationCarouselProps {
  title: string
  subtitle?: string
  badge?: BadgeVariant
  products: RecommendedProduct[]
  loading: boolean
  viewAllLink?: string
  itemsPerPage?: number
  className?: string
  layout?: 'compact' | 'centered'
  algorithm?: string
  section?: string
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<BadgeVariant, { icon: React.ElementType; label: string; color: string }> = {
  trending: {
    icon: TrendingUp,
    label: 'Xu Hướng',
    color: 'from-orange-500 to-red-500',
  },
  'for-you': {
    icon: Sparkles,
    label: 'Dành Cho Bạn',
    color: 'from-purple-500 to-pink-500',
  },
  bundle: {
    icon: ShoppingBag,
    label: 'Mua Kèm',
    color: 'from-emerald-500 to-teal-500',
  },
  'post-purchase': {
    icon: Sparkles,
    label: 'Gợi Ý',
    color: 'from-blue-500 to-cyan-500',
  },
  related: {
    icon: Sparkles,
    label: 'Liên Quan',
    color: 'from-indigo-500 to-blue-500',
  },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className='bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden animate-pulse'>
      <div className='aspect-square bg-gradient-to-br from-blue-50 to-slate-100' />
      <div className='p-4 space-y-3'>
        <div className='h-3 bg-blue-100 rounded-full w-1/3' />
        <div className='h-4 bg-slate-200 rounded-full w-full' />
        <div className='h-4 bg-slate-200 rounded-full w-3/4' />
        <div className='h-5 bg-blue-100 rounded-full w-1/2' />
        <div className='h-9 bg-blue-100 rounded-lg w-full mt-2' />
      </div>
    </div>
  )
}

// ─── Transform helper: RecommendedProduct → ProductCard format ────────────────

function toProductCardFormat(p: RecommendedProduct) {
  // Lấy default variant để tính giá
  const defaultVariant = p.priceVariants?.find((v) => v.isDefault) ?? p.priceVariants?.[0]

  // Build a minimal Product-compatible object
  const productLike = {
    _id: p._id,
    id: p._id,
    name: p.name,
    slug: p.slug,
    featuredImage: p.featuredImage,
    image: p.featuredImage,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stockQuantity: p.stockQuantity,
    requiresPrescription: p.requiresPrescription,
    priceVariants: p.priceVariants,
    brand: p.brand?.[0] ? { name: p.brand[0].name } : undefined,
    inStock: p.stockQuantity > 0,
  } as Parameters<typeof getProductSalePrice>[0]

  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.[0]?.name ?? '',
    image: p.featuredImage ?? '/placeholder-product.png',
    originalPrice: getProductOriginalPrice(productLike),
    salePrice: getProductSalePrice(productLike) ?? defaultVariant?.price ?? 0,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    inStock: p.stockQuantity > 0,
    isPrescription: p.requiresPrescription ?? false,
    isOnSale: isProductOnSale(productLike),
    discountPercentage: getDiscountPercentage(productLike),
    unit: getProductUnit(productLike),
    packaging: '',
    needsConsultation: p.requiresPrescription ?? false,
    priceVariants: p.priceVariants,
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecommendationCarousel({
  title,
  subtitle,
  badge,
  products,
  loading,
  viewAllLink,
  itemsPerPage = 4,
  className = '',
  layout = 'compact',
  algorithm = 'unknown',
  section,
}: RecommendationCarouselProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [currentPage, setCurrentPage] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const availableProducts = products.filter((product) => product.stockQuantity > 0)
  const visibleProducts = availableProducts.filter((product) => !dismissed.has(product._id))
  const totalPages = Math.ceil(visibleProducts.length / itemsPerPage)
  const badgeConfig = badge ? BADGE_CONFIG[badge] : null
  const BadgeIcon = badgeConfig?.icon
  const trackingSection = section ?? badge ?? 'recommendation'

  useEffect(() => {
    setCurrentPage(0)
  }, [products, itemsPerPage])

  useEffect(() => {
    if (loading) return
    visibleProducts
      .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
      .forEach((product, index) => {
        void recommendationService.trackEvent({
          productId: product._id,
          algorithm,
          section: trackingSection,
          position: currentPage * itemsPerPage + index,
          eventType: 'impression',
          requestId: product.attribution?.requestId,
          attributionToken: product.attribution?.attributionToken,
          modelVersion: product.attribution?.modelVersion,
          experimentId: product.attribution?.experimentId,
          experimentVariant: product.attribution?.experimentVariant,
        })
      })
  // Tracking only when the visible recommendation page changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, loading, visibleProducts.map((product) => product._id).join(',')])

  // Ẩn section nếu không loading và không có data
  if (!loading && availableProducts.length === 0) return null

  const handlePrev = () => setCurrentPage((p) => (p === 0 ? totalPages - 1 : p - 1))
  const handleNext = () => setCurrentPage((p) => (p === totalPages - 1 ? 0 : p + 1))
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (totalPages <= 1) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlePrev()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNext()
    }
  }

  return (
    <ScrollReveal direction='up' delay={0.2}>
      <section className={`py-16 ${className}`} tabIndex={0} onKeyDown={handleKeyDown} aria-label={title}>
        <div className='max-w-7xl mx-auto px-4'>
          {/* Header */}
          {layout === 'compact' ? (
            <div className='flex items-center justify-between mb-8'>
              <div className='flex items-center gap-4'>
                {badgeConfig && BadgeIcon && (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badgeConfig.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <BadgeIcon className='w-6 h-6 text-white' />
                  </div>
                )}
                <div>
                  <h2 className='text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent pb-1'>
                    {title}
                  </h2>
                  {subtitle && <p className='text-gray-500 text-sm mt-1'>{subtitle}</p>}
                </div>
              </div>

              <div className='flex items-center gap-3'>
                {/* Navigation Arrows */}
                {!loading && totalPages > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrev}
                      className='h-10 w-10 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white shadow-md transition-all flex items-center justify-center'
                      aria-label='Previous'
                    >
                      <ChevronLeft className='w-5 h-5' />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      className='h-10 w-10 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white shadow-md transition-all flex items-center justify-center'
                      aria-label='Next'
                    >
                      <ChevronRight className='w-5 h-5' />
                    </motion.button>
                  </>
                )}

                {viewAllLink && (
                  <Link to={viewAllLink}>
                    <Button variant='outline' size='sm' className='border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hidden sm:flex'>
                      Xem tất cả
                      <ArrowRight className='w-3.5 h-3.5 ml-1.5' />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Centered Layout (HomePage style)
            <div className='text-center mb-8'>
              <div className='flex items-center justify-center gap-3 mb-4'>
                {badgeConfig && BadgeIcon && (
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${badgeConfig.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <BadgeIcon className='w-5 h-5 text-white' />
                  </div>
                )}
                <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent pb-2'>
                  {title}
                </h2>
              </div>
              {subtitle && (
                <p className='text-xl text-gray-600 max-w-2xl mx-auto mb-6'>
                  {subtitle}
                </p>
              )}
              {viewAllLink && (
                <Link to={viewAllLink}>
                  <Button variant='outline' className='border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-6'>
                    Xem tất cả sản phẩm
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Products Grid / Skeleton */}
          {loading ? (
            <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${layout === 'centered' ? 'px-16 lg:px-20' : ''}`}>
              {Array.from({ length: itemsPerPage }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className={`relative ${layout === 'centered' ? 'px-16 lg:px-20 py-[10px]' : ''}`}>
              {/* Centered Layout Navigation Arrows */}
              {layout === 'centered' && totalPages > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrev}
                    className='absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center'
                    aria-label='Previous'
                  >
                    <ChevronLeft className='w-6 h-6' />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className='absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center'
                    aria-label='Next'
                  >
                    <ChevronRight className='w-6 h-6' />
                  </motion.button>
                </>
              )}

              <div className='overflow-hidden rounded-2xl pb-4'>
                <motion.div
                  className='flex'
                  animate={{ x: `${-currentPage * 100}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                >
                  {Array.from({ length: totalPages }).map((_, pageIndex) => (
                    <div
                      key={pageIndex}
                      className='w-full flex-shrink-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-1 pt-2'
                    >
                      {visibleProducts
                        .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                        .map((rawProduct, productIndex) => {
                          const product = toProductCardFormat(rawProduct)
                          return (
                            <motion.div
                              key={rawProduct._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: productIndex * 0.1, duration: 0.5, ease: 'easeOut' }}
                              whileHover={{ y: -5, transition: { duration: 0.2 } }}
                              className='h-full relative'
                              onClick={(event) => {
                                if ((event.target as HTMLElement).closest('button')) return
                                void recommendationService.trackClick({
                                  productId: rawProduct._id,
                                  algorithm,
                                  section: trackingSection,
                                  position: pageIndex * itemsPerPage + productIndex,
                                  requestId: rawProduct.attribution?.requestId,
                                  attributionToken: rawProduct.attribution?.attributionToken,
                                  modelVersion: rawProduct.attribution?.modelVersion,
                                  experimentId: rawProduct.attribution?.experimentId,
                                  experimentVariant: rawProduct.attribution?.experimentVariant,
                                })
                              }}
                            >
                              <div className='absolute right-2 top-2 z-30 flex gap-1'>
                                <button
                                  type='button'
                                  className='rounded-full bg-white/95 p-1.5 text-gray-500 shadow hover:text-red-600'
                                  title={trackingSection === 'replenishment' ? 'Nhắc lại sau' : 'Không quan tâm'}
                                  onClick={() => {
                                    setDismissed((previous) => new Set(previous).add(rawProduct._id))
                                    void recommendationService.trackEvent({
                                      productId: rawProduct._id,
                                      algorithm,
                                      section: trackingSection,
                                      position: pageIndex * itemsPerPage + productIndex,
                                      eventType: trackingSection === 'replenishment' ? 'snooze' : 'dismiss',
                                      requestId: rawProduct.attribution?.requestId,
                                      attributionToken: rawProduct.attribution?.attributionToken,
                                      modelVersion: rawProduct.attribution?.modelVersion,
                                      experimentId: rawProduct.attribution?.experimentId,
                                      experimentVariant: rawProduct.attribution?.experimentVariant,
                                    })
                                  }}
                                >
                                  {trackingSection === 'replenishment' ? <Clock3 className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                                </button>
                              </div>
                              <ProductCard
                                product={product}
                                variant='grid'
                                onAddToCart={(selectedUnit) => {
                                  const variant = rawProduct.priceVariants?.find((v) => v.unit === selectedUnit)
                                  const price = variant?.price ?? rawProduct.priceVariants?.[0]?.price
                                  void addToCart(rawProduct as unknown as Product, 1, selectedUnit, price)
                                  void recommendationService.trackEvent({
                                    productId: rawProduct._id,
                                    algorithm,
                                    section: trackingSection,
                                    position: pageIndex * itemsPerPage + productIndex,
                                    eventType: 'add_to_cart',
                                    requestId: rawProduct.attribution?.requestId,
                                    attributionToken: rawProduct.attribution?.attributionToken,
                                    modelVersion: rawProduct.attribution?.modelVersion,
                                    experimentId: rawProduct.attribution?.experimentId,
                                    experimentVariant: rawProduct.attribution?.experimentVariant,
                                    value: price,
                                  })
                                }}
                                onToggleWishlist={() => toggleWishlist(rawProduct._id)}
                                isInWishlist={isInWishlist(rawProduct._id)}
                              />
                              {rawProduct.recommendation?.reason && (
                                <div className='mt-2 flex items-start gap-1.5 px-1 text-xs text-slate-500' title={rawProduct.recommendation.evidence.join(', ')}>
                                  <Info className='mt-0.5 h-3.5 w-3.5 flex-shrink-0' />
                                  <span>{rawProduct.recommendation.reason}</span>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* Page dots */}
          {!loading && totalPages > 1 && (
            <div className='flex justify-center gap-2 mt-6'>
              {Array.from({ length: totalPages }).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === currentPage ? 'w-8 bg-blue-600 shadow-md' : 'w-2.5 bg-blue-200 hover:bg-blue-300'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Trang ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </ScrollReveal>
  )
}

export default RecommendationCarousel
