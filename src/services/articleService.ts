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
