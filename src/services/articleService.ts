import apiClient from './apiClient'
import type {
  Article,
  ArticleFilter,
  ArticlesResponse,
  ArticleResponse,
  HealthCategory,
  HealthCategoryFilter,
  HealthCategoriesResponse,
  HealthCategoryResponse,
} from '@/types/article'
import type { Product } from '@/types/product'

export type ArticleJourneyEventType =
  | 'cta_chat'
  | 'cta_prescription_upload'
  | 'cta_product_search'
  | 'related_product_click'
  | 'article_share'
  | 'source_click'
  | 'article_ai_ask'
  | 'article_save'
  | 'topic_follow'

export interface ArticleAiAssistResult {
  action: string
  result: {
    suggestions?: string[]
    title?: string
    excerpt?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
    outline?: string[]
    faq?: Array<{ question: string; answer: string }>
    warnings?: string[]
    sourceTopics?: string[]
  }
}

export interface ArticleAskResult {
  answer: string
  suggested_questions: string[]
  is_escalated: boolean
}

function getArticleSessionId() {
  const key = 'medispace_article_session_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(key, sessionId)
  return sessionId
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ArticleService {
  // ==================== HEALTH CATEGORIES ====================

  async getHealthCategories(filter?: HealthCategoryFilter): Promise<HealthCategory[]> {
    try {
      const response = await apiClient.get<HealthCategoriesResponse>('/health-categories', {
        params: filter,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result?.categories || []
    } catch (error) {
      console.error('Error fetching health categories:', error)
      return []
    }
  }

  async getHealthCategory(idOrSlug: string): Promise<HealthCategory | null> {
    try {
      const response = await apiClient.get<HealthCategoryResponse>(`/health-categories/${idOrSlug}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result || null
    } catch (error) {
      console.error('Error fetching health category:', error)
      return null
    }
  }

  async createHealthCategory(data: any): Promise<HealthCategory> {
    const response = await apiClient.post('/health-categories', data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).result
  }

  async updateHealthCategory(id: string, data: any): Promise<HealthCategory> {
    const response = await apiClient.put(`/health-categories/${id}`, data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).result
  }

  async deleteHealthCategory(id: string): Promise<void> {
    await apiClient.delete(`/health-categories/${id}`)
  }

  // ==================== ARTICLES ====================

  async getArticles(filter?: ArticleFilter): Promise<{
    articles: Article[]
    pagination: {
      page: number
      limit: number
      totalPages: number
      totalCount: number
    }
  }> {
    try {
      const response = await apiClient.get<ArticlesResponse>('/articles', {
        params: filter,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result || response.data.result
    } catch (error) {
      console.error('Error fetching articles:', error)
      return {
        articles: [],
        pagination: { page: 1, limit: 20, totalPages: 0, totalCount: 0 },
      }
    }
  }

  async getArticle(slugOrId: string): Promise<Article | null> {
    try {
      const response = await apiClient.get<ArticleResponse>(`/articles/${slugOrId}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result
    } catch (error) {
      console.error('Error fetching article:', error)
      return null
    }
  }

  async incrementViewCount(slugOrId: string): Promise<void> {
    try {
      await apiClient.post(`/articles/${slugOrId}/view`)
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  async getRelatedArticles(slugOrId: string, limit = 6): Promise<Article[]> {
    try {
      const response = await apiClient.get<{ message: string; result: Article[] }>(`/articles/${slugOrId}/related`, {
        params: { limit },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result
    } catch (error) {
      console.error('Error fetching related articles:', error)
      return []
    }
  }

  async getRelatedProducts(slugOrId: string, limit = 8): Promise<Product[]> {
    try {
      const response = await apiClient.get<{ message: string; result: Product[] }>(
        `/articles/${slugOrId}/related-products`,
        {
          params: { limit },
        },
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.data as any).result || []
    } catch (error) {
      console.error('Error fetching related products:', error)
      return []
    }
  }

  async trackJourneyEvent(
    slugOrId: string,
    event: {
      eventType: ArticleJourneyEventType
      targetType?: 'chat' | 'prescription' | 'search' | 'product' | 'source' | 'article' | 'ai'
      targetId?: string
      targetUrl?: string
      metadata?: Record<string, unknown>
    },
  ): Promise<void> {
    try {
      await apiClient.post(`/articles/${slugOrId}/journey-events`, {
        ...event,
        sessionId: getArticleSessionId(),
      })
    } catch (error) {
      console.error('Error tracking article journey event:', error)
    }
  }

  async generateAiAssistance(payload: {
    action: 'outline' | 'seo' | 'excerpt' | 'faq' | 'quality_check' | 'sources'
    title?: string
    excerpt?: string
    content?: string
    categoryName?: string
    tags?: string[]
  }): Promise<ArticleAiAssistResult | null> {
    try {
      const response = await apiClient.post<{ message: string; result: ArticleAiAssistResult }>('/articles/ai-assist', payload)
      return response.data.result
    } catch (error) {
      console.error('Error generating article AI assistance:', error)
      return null
    }
  }

  async askArticleAssistant(slugOrId: string, question: string): Promise<ArticleAskResult | null> {
    try {
      const response = await apiClient.post<{ message: string; result: ArticleAskResult }>(`/articles/${slugOrId}/ask-ai`, {
        question,
      })
      return response.data.result
    } catch (error) {
      console.error('Error asking article AI assistant:', error)
      return null
    }
  }

  async getPersonalizedArticles(
    limit = 8,
  ): Promise<{ source: 'personalized' | 'fallback'; reasons?: string[]; articles: Article[] } | null> {
    try {
      const response = await apiClient.get<{
        message: string
        result: { source: 'personalized' | 'fallback'; reasons?: string[]; articles: Article[] }
      }>('/articles/personalized', {
        params: { limit },
      })
      return response.data.result
    } catch (error) {
      console.error('Error fetching personalized articles:', error)
      return null
    }
  }

  async getArticlePreferences(): Promise<{ savedArticleIds: string[]; followedHealthTopics: string[] } | null> {
    try {
      const response = await apiClient.get<{
        message: string
        result: { savedArticleIds: string[]; followedHealthTopics: string[] }
      }>('/articles/me/preferences')
      return response.data.result
    } catch (error) {
      console.error('Error fetching article preferences:', error)
      return null
    }
  }

  async setSavedArticle(slugOrId: string, saved: boolean): Promise<boolean> {
    try {
      const response = await apiClient.patch<{ message: string; result: { saved: boolean } }>(`/articles/${slugOrId}/save`, {
        saved,
      })
      return response.data.result.saved
    } catch (error) {
      console.error('Error setting saved article:', error)
      throw error
    }
  }

  async setFollowedHealthTopic(topicId: string, following: boolean): Promise<boolean> {
    try {
      const response = await apiClient.patch<{ message: string; result: { following: boolean } }>(
        `/articles/topics/${encodeURIComponent(topicId)}/follow`,
        { following },
      )
      return response.data.result.following
    } catch (error) {
      console.error('Error setting followed health topic:', error)
      throw error
    }
  }

  // Helper: Get featured articles
  async getFeaturedArticles(limit = 3): Promise<Article[]> {
    const result = await this.getArticles({
      isFeatured: true,
      isPublished: true,
      status: 'published',
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    })
    return result.articles
  }

  // Helper: Get latest articles
  async getLatestArticles(limit = 10): Promise<Article[]> {
    const result = await this.getArticles({
      isPublished: true,
      status: 'published',
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    })
    return result.articles
  }

  // Helper: Get popular articles (by view count)
  async getPopularArticles(limit = 5): Promise<Article[]> {
    const result = await this.getArticles({
      isPublished: true,
      status: 'published',
      limit,
      sortBy: 'viewCount',
      sortOrder: 'desc',
    })
    return result.articles
  }

  // Helper: Get articles by category
  async getArticlesByCategory(categorySlug: string, limit = 10): Promise<Article[]> {
    const result = await this.getArticles({
      categoryId: categorySlug,
      isPublished: true,
      status: 'published',
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    })
    return result.articles
  }

  // Helper: Search articles
  async searchArticles(query: string, limit = 20): Promise<Article[]> {
    const result = await this.getArticles({
      search: query,
      isPublished: true,
      status: 'published',
      limit,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    })
    return result.articles
  }
}

const articleService = new ArticleService()
export default articleService
