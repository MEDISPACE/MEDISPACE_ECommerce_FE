import { useState, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { apiClient } from '../../services/apiClient'

interface PointsPreview {
  canRedeem: boolean
  maxRedeemAmount: number
  pointsNeeded: number
  pointsBalance: number
  minRedeem: number
  maxRedeemRatio: number
}

interface PointsRedeemInputProps {
  subtotal: number
  onRedeemChange?: (pointsToRedeem: number, discountAmount: number) => void
  className?: string
}

export function PointsRedeemInput({ subtotal, onRedeemChange, className }: PointsRedeemInputProps) {
  const [preview, setPreview] = useState<PointsPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [isApplied, setIsApplied] = useState(false)
  const [error, setError] = useState('')

  // Load preview khi mount hoặc subtotal thay đổi
  useEffect(() => {
    const fetchPreview = async () => {
      if (subtotal <= 0) return
      setIsLoading(true)
      try {
        const res = await apiClient.post('/loyalty/preview-redeem', { orderSubtotal: subtotal })
        setPreview(res.data.result)
      } catch {
        // Not authenticated or no points — silently hide
        setPreview(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPreview()
  }, [subtotal])

  // Reset khi subtotal thay đổi
  useEffect(() => {
    if (isApplied) {
      setIsApplied(false)
      setPointsToRedeem(0)
      onRedeemChange?.(0, 0)
    }
  }, [subtotal])

  const handleToggleExpand = () => {
    if (!preview?.canRedeem) return
    setIsExpanded(prev => !prev)
    if (isExpanded && isApplied) {
      // Collapse = hủy áp dụng
      setIsApplied(false)
      setPointsToRedeem(0)
      onRedeemChange?.(0, 0)
    }
  }

  const handleApply = () => {
    if (!preview || pointsToRedeem <= 0) {
      setError('Vui lòng chọn số điểm muốn đổi.')
      return
    }
    setIsApplied(true)
    setError('')
    const discountAmount = pointsToRedeem // 1 điểm = 1đ
    onRedeemChange?.(pointsToRedeem, discountAmount)
  }

  const handleRemove = () => {
    setIsApplied(false)
    setPointsToRedeem(0)
    setError('')
    onRedeemChange?.(0, 0)
  }

  const handleSliderChange = (val: number[]) => {
    const pts = val[0]
    setPointsToRedeem(pts)
    if (isApplied) {
      setIsApplied(false)
      onRedeemChange?.(0, 0)
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const formatPoints = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' điểm'

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <Loader2 className='w-4 h-4 animate-spin' />
        <span>Đang tải điểm thưởng...</span>
      </div>
    )
  }

  // Không đăng nhập hoặc không đủ điểm tối thiểu
  if (!preview) return null

  return (
    <div className={`border border-purple-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header — luôn hiển thị */}
      <button
        onClick={handleToggleExpand}
        className='w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors'
        disabled={!preview.canRedeem}
      >
        <div className='flex items-center gap-2'>
          <Sparkles className='w-4 h-4 text-purple-600' />
          <span className='text-sm font-medium text-purple-800'>Dùng điểm thưởng</span>
          <Badge className='bg-purple-100 text-purple-700 text-xs hover:bg-purple-100'>
            {formatPoints(preview.pointsBalance)}
          </Badge>
          {isApplied && (
            <Badge className='bg-green-100 text-green-700 text-xs hover:bg-green-100'>
              -{formatCurrency(pointsToRedeem)}
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-1'>
          {!preview.canRedeem && (
            <span className='text-xs text-gray-400'>
              Cần tối thiểu {formatPoints(preview.minRedeem)}
            </span>
          )}
          {preview.canRedeem && (
            isExpanded ? <ChevronUp className='w-4 h-4 text-purple-500' /> : <ChevronDown className='w-4 h-4 text-purple-500' />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && preview.canRedeem && (
        <div className='px-4 py-4 bg-white space-y-4'>
          {/* Info */}
          <div className='flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg'>
            <AlertCircle className='w-3.5 h-3.5 shrink-0 mt-0.5' />
            <p>
              Tối đa <strong>{formatPoints(preview.pointsNeeded)}</strong> ({formatCurrency(preview.maxRedeemAmount)}) — tương đương ~30% giá trị đơn hàng. 1 điểm = 1đ.
            </p>
          </div>

          {/* Slider */}
          <div className='space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-600'>Số điểm muốn dùng</span>
              <span className='font-semibold text-purple-700'>{formatPoints(pointsToRedeem)}</span>
            </div>
            <Slider
              min={0}
              max={preview.pointsNeeded}
              step={1000}
              value={[pointsToRedeem]}
              onValueChange={handleSliderChange}
              className='w-full'
            />
            <div className='flex justify-between text-xs text-gray-400'>
              <span>0</span>
              <span>= {formatCurrency(pointsToRedeem)}</span>
              <span>{formatPoints(preview.pointsNeeded)}</span>
            </div>
          </div>

          {/* Quick select */}
          <div className='flex gap-2 flex-wrap'>
            {[25, 50, 75, 100].map(pct => {
              const pts = Math.min(
                Math.floor((preview.pointsNeeded * pct) / 100 / 1000) * 1000,
                preview.pointsNeeded
              )
              return (
                <button
                  key={pct}
                  onClick={() => { setPointsToRedeem(pts); setIsApplied(false); onRedeemChange?.(0, 0) }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    pointsToRedeem === pts
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {pct}%
                </button>
              )
            })}
            <button
              onClick={() => { setPointsToRedeem(preview.pointsNeeded); setIsApplied(false); onRedeemChange?.(0, 0) }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                pointsToRedeem === preview.pointsNeeded
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-purple-200 text-purple-600 hover:bg-purple-50'
              }`}
            >
              Tối đa
            </button>
          </div>

          {/* Error */}
          {error && <p className='text-red-500 text-xs'>{error}</p>}

          {/* Apply / Remove */}
          <div className='flex gap-2'>
            {isApplied ? (
              <Button
                variant='outline'
                size='sm'
                onClick={handleRemove}
                className='flex-1 border-red-200 text-red-600 hover:bg-red-50'
              >
                Bỏ áp dụng
              </Button>
            ) : (
              <Button
                size='sm'
                onClick={handleApply}
                disabled={pointsToRedeem <= 0}
                className='flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              >
                Dùng {formatPoints(pointsToRedeem)} (-{formatCurrency(pointsToRedeem)})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
