/**
 * RecommendationCarousel — Shared UI component cho tất cả recommendation sections
 * Design đồng bộ với hệ thống: blue gradient header, ProductCard, ScrollReveal animation
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../ui/button'
import { ProductCard } from './ProductCard'
import { ScrollReveal } from '../shared/ScrollReveal'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../hooks/product/useWishlist'
import type { RecommendedProduct } from '../../services/recommendationService'
import {
  getProductSalePrice,
  getProductOriginalPrice,
  getProductUnit,
  getDiscountPercentage,
  isProductOnSale,
} from '../../utils/productHelpers'

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'trending' | 'for-you' | 'bundle' | 'post-purchase'

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
}: RecommendationCarouselProps) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [currentPage, setCurrentPage] = useState(0)

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const badgeConfig = badge ? BADGE_CONFIG[badge] : null
  const BadgeIcon = badgeConfig?.icon

  // Ẩn section nếu không loading và không có data
  if (!loading && products.length === 0) return null

  const handlePrev = () => setCurrentPage((p) => (p === 0 ? totalPages - 1 : p - 1))
  const handleNext = () => setCurrentPage((p) => (p === totalPages - 1 ? 0 : p + 1))

  return (
    <ScrollReveal direction='up' delay={0.2}>
      <section className={`py-16 ${className}`}>
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
                    className='absolute left-2 lg:left-6 top-[130px] md:top-[160px] lg:top-[170px] -translate-y-1/2 z-20 h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center'
                    aria-label='Previous'
                  >
                    <ChevronLeft className='w-6 h-6' />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className='absolute right-2 lg:right-6 top-[130px] md:top-[160px] lg:top-[170px] -translate-y-1/2 z-20 h-12 w-12 rounded-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl flex items-center justify-center'
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
                      {products
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
                              className='h-full'
                            >
                              <ProductCard
                                product={product}
                                variant='grid'
                                onAddToCart={(selectedUnit) => {
                                  const variant = rawProduct.priceVariants?.find((v) => v.unit === selectedUnit)
                                  const price = variant?.price ?? rawProduct.priceVariants?.[0]?.price
                                  addToCart(rawProduct as any, 1, selectedUnit, price)
                                }}
                                onToggleWishlist={() => toggleWishlist(rawProduct._id)}
                                isInWishlist={isInWishlist(rawProduct._id)}
                              />
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
