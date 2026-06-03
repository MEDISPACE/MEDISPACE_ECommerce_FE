export interface HealthCategory {
  _id: string
  name: string
  slug: string
  description: string
  icon?: string
  color?: string
  articleCount: number
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Article {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  images?: string[]
  categoryId: string
  category?: HealthCategory
  tags?: string[]
  authorId: string
  authorName: string
  authorTitle?: string
  viewCount: number
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  references?: Array<{
    title: string
    url?: string
  }>
  reviewedBy?: string
  reviewedByTitle?: string
  reviewedAt?: string
  lastMedicallyReviewedAt?: string
  contentVersion?: number
  riskLevel?: 'general' | 'medication' | 'disease' | 'emergency-sensitive'
  targetAudiences?: string[]
  symptoms?: string[]
  activeIngredients?: string[]
  healthTopics?: string[]
  status: 'draft' | 'pending' | 'published' | 'archived'
  isPublished: boolean
  isFeatured: boolean
  isPinned: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  readTime?: number
  relatedArticleIds?: string[]
  relatedProductIds?: string[]
}

export interface ArticleFilter {
  page?: number
  limit?: number
  categoryId?: string
  status?: string
  isPublished?: boolean
  isFeatured?: boolean
  search?: string
  tags?: string
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'title'
  sortOrder?: 'asc' | 'desc'
  authorId?: string
}

export interface HealthCategoryFilter {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  sortBy?: 'name' | 'order' | 'articleCount' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ArticlesResponse {
  message: string
  result: {
    articles: Article[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalCount: number
    }
  }
}

export interface ArticleResponse {
  message: string
  result: Article
}

export interface HealthCategoriesResponse {
  message: string
  result: {
    categories: HealthCategory[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalCount: number
    }
  }
}

export interface HealthCategoryResponse {
  message: string
  result: HealthCategory
}
