import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, MessageCircle, Search, ShoppingBag } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'
import articleService from '@/services/articleService'
import type { Article } from '@/types/article'

type CheckerResult = {
  level: 'urgent' | 'pharmacist' | 'selfcare'
  title: string
  description: string
  query: string
}

const symptomOptions = [
  { id: 'fever', label: 'Sốt hoặc ớn lạnh', query: 'sốt' },
  { id: 'cough', label: 'Ho, đau họng hoặc nghẹt mũi', query: 'ho cảm cúm' },
  { id: 'digestive', label: 'Đau bụng, tiêu chảy hoặc buồn nôn', query: 'tiêu hóa' },
  { id: 'rash', label: 'Nổi mẩn, ngứa hoặc dị ứng da', query: 'dị ứng' },
  { id: 'pain', label: 'Đau đầu, đau cơ hoặc đau nhức', query: 'đau giảm đau' },
]

const riskOptions = [
  { id: 'chestPain', label: 'Đau ngực, khó thở, tím tái hoặc choáng' },
  { id: 'severe', label: 'Triệu chứng nặng, kéo dài hoặc tái phát nhiều lần' },
  { id: 'pregnant', label: 'Đang mang thai, cho con bú hoặc trẻ nhỏ dùng thuốc' },
  { id: 'chronic', label: 'Có bệnh nền hoặc đang dùng thuốc điều trị dài ngày' },
  { id: 'prescription', label: 'Đang định mua thuốc kê đơn, kháng sinh hoặc corticoid' },
]

export function HealthCheckerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<CheckerResult | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)

  const selectedLabels = useMemo(
    () => [...symptomOptions, ...riskOptions].filter((item) => selected.has(item.id)).map((item) => item.label),
    [selected],
  )

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const evaluate = async () => {
    const symptomQuery = symptomOptions.find((item) => selected.has(item.id))?.query || 'sức khỏe'
    const nextResult: CheckerResult = selected.has('chestPain')
      ? {
          level: 'urgent',
          title: 'Cần tư vấn y tế ngay',
          description: 'Dấu hiệu bạn chọn có thể cần xử trí trực tiếp. Không tự mua thuốc để trì hoãn thăm khám.',
          query: symptomQuery,
        }
      : selected.has('prescription') || selected.has('pregnant') || selected.has('chronic') || selected.has('severe')
        ? {
            level: 'pharmacist',
            title: 'Nên hỏi dược sĩ trước khi mua',
            description: 'Ngữ cảnh này cần kiểm tra tương tác thuốc, chống chỉ định hoặc thông tin đơn thuốc.',
            query: symptomQuery,
          }
        : {
            level: 'selfcare',
            title: 'Có thể đọc thêm và chọn sản phẩm phù hợp',
            description: 'Bạn có thể tham khảo bài viết liên quan, nhưng vẫn cần theo dõi diễn tiến triệu chứng.',
            query: symptomQuery,
          }

    setResult(nextResult)
    setLoadingArticles(true)
    const related = await articleService.searchArticles(nextResult.query, 3)
    setArticles(related)
    setLoadingArticles(false)
  }

  const resultStyles = {
    urgent: 'border-red-200 bg-red-50 text-red-900',
    pharmacist: 'border-amber-200 bg-amber-50 text-amber-900',
    selfcare: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50'>
      <div className='bg-white border-b'>
        <div className='container mx-auto px-4 py-4'>
          <UniversalBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Góc sức khỏe', href: '/health' },
              { label: 'Kiểm tra nhanh' },
            ]}
          />
        </div>
      </div>

      <main className='container mx-auto px-4 py-8'>
        <Link to='/health' className='inline-block mb-6'>
          <Button variant='ghost' className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Quay lại
          </Button>
        </Link>

        <div className='max-w-5xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-gray-900'>Kiểm tra nhanh trước khi đọc hoặc mua</h1>
            <p className='text-gray-600 mt-3'>
              Chọn triệu chứng và ngữ cảnh hiện tại để Medispace gợi ý bước tiếp theo phù hợp hơn.
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card className='lg:col-span-2 border-blue-100 bg-white/90'>
              <CardContent className='p-6'>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>Bạn đang gặp vấn đề gì?</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-6'>
                  {symptomOptions.map((option) => (
                    <label
                      key={option.id}
                      className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-blue-300'
                    >
                      <Checkbox checked={selected.has(option.id)} onCheckedChange={() => toggle(option.id)} />
                      <span className='text-sm text-gray-800'>{option.label}</span>
                    </label>
                  ))}
                </div>

                <h2 className='text-lg font-semibold text-gray-900 mb-4'>Có yếu tố cần thận trọng không?</h2>
                <div className='space-y-3'>
                  {riskOptions.map((option) => (
                    <label
                      key={option.id}
                      className='flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:border-blue-300'
                    >
                      <Checkbox checked={selected.has(option.id)} onCheckedChange={() => toggle(option.id)} />
                      <span className='text-sm text-gray-800'>{option.label}</span>
                    </label>
                  ))}
                </div>

                <Button
                  className='mt-6 bg-blue-600 hover:bg-blue-700 text-white'
                  onClick={evaluate}
                  disabled={selected.size === 0}
                >
                  <CheckCircle2 className='h-4 w-4 mr-2' />
                  Xem gợi ý
                </Button>
              </CardContent>
            </Card>

            <div className='space-y-6'>
              <Card className='border-blue-100 bg-white/90'>
                <CardContent className='p-6'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-3'>Thông tin đã chọn</h2>
                  {selectedLabels.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {selectedLabels.map((label) => (
                        <Badge key={label} variant='outline' className='border-blue-200 text-blue-700'>
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>Chưa chọn triệu chứng hoặc yếu tố thận trọng.</p>
                  )}
                </CardContent>
              </Card>

              {result && (
                <Card className={`border ${resultStyles[result.level]}`}>
                  <CardContent className='p-6'>
                    <div className='flex items-start gap-3'>
                      <AlertTriangle className='h-5 w-5 mt-0.5 flex-shrink-0' />
                      <div>
                        <h2 className='font-semibold'>{result.title}</h2>
                        <p className='text-sm mt-2'>{result.description}</p>
                      </div>
                    </div>
                    <div className='mt-5 space-y-2'>
                      <Button asChild className='w-full bg-blue-600 hover:bg-blue-700 text-white'>
                        <Link to='/community'>
                          <MessageCircle className='h-4 w-4 mr-2' />
                          Hỏi dược sĩ
                        </Link>
                      </Button>
                      <Button asChild variant='outline' className='w-full bg-white'>
                        <Link to='/upload-prescription'>
                          <FileText className='h-4 w-4 mr-2' />
                          Gửi đơn thuốc
                        </Link>
                      </Button>
                      <Button asChild variant='outline' className='w-full bg-white'>
                        <Link to={`/search?q=${encodeURIComponent(result.query)}`}>
                          <ShoppingBag className='h-4 w-4 mr-2' />
                          Tìm sản phẩm
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {result && (
            <section className='mt-8'>
              <div className='flex items-center gap-2 mb-4'>
                <Search className='h-5 w-5 text-blue-600' />
                <h2 className='text-2xl font-bold text-gray-900'>Bài viết nên đọc</h2>
              </div>
              {loadingArticles ? (
                <p className='text-sm text-gray-500'>Đang tìm bài viết liên quan...</p>
              ) : articles.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {articles.map((article) => (
                    <Link key={article._id} to={`/health/article/${article.slug}`}>
                      <Card className='h-full border-blue-100 bg-white hover:shadow-md transition-shadow'>
                        <CardContent className='p-5'>
                          <Badge variant='outline' className='mb-3 border-blue-200 text-blue-700'>
                            {article.category?.name || 'Sức khỏe'}
                          </Badge>
                          <h3 className='font-semibold text-gray-900 line-clamp-2 mb-2'>{article.title}</h3>
                          <p className='text-sm text-gray-600 line-clamp-3'>{article.excerpt}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-500'>Chưa tìm thấy bài viết phù hợp.</p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
