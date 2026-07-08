import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
  Search,
  Filter,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Checkbox } from '../../ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'

import { returnRequestService, returnStatusLabels, returnReasonLabels } from '../../../services/returnRequestService'
import type { ReturnRequest, ReturnStatus } from '../../../types/returnRequest'
import { ReturnStatus as ReturnStatusEnum } from '../../../types/returnRequest'
import { StatsCard, type StatCardConfig } from '../../../utils/useStatsCards'
import { PaginationComponent } from '../PaginationComponent'
import { ReturnRequestDetailsSheet } from './ReturnRequestDetailsSheet'
import ahamoveLogo from '../../../assets/ahamoveLogo.svg'
import GHNLogo from '../../../assets/GHN_Logo.png'
import GHTKLogo from '../../../assets/GHTKLogo.svg'

interface ReturnManagementPageProps {
  role?: 'admin' | 'pharmacist'
}

// Status badge colors
const statusColors: Record<ReturnStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  reviewing: { bg: 'bg-[#E8EDF5]', text: 'text-blue-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  awaiting_return: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  received: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  refund_processing: { bg: 'bg-[#E8EDF5]', text: 'text-[#0A2463]' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
}

const paymentProviderLabels: Record<string, string> = {
  cod: 'COD',
  vnpay: 'VNPay',
  payos: 'PayOS',
  bank_transfer: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử',
  manual: 'Ghi nhận thủ công',
}

const refundMethodLabels: Record<string, string> = {
  original: 'Hoàn về phương thức thanh toán ban đầu',
  bank_transfer: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử',
  manual: 'Ghi nhận thủ công',
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  pending_collection: 'Chờ thu tiền',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
}

const returnCarrierOptions = [
  {
    value: 'mock_carrier',
    label: 'MEDISPACE Delivery',
    description: 'Đội thu hồi nội bộ MEDISPACE',
    recommended: true,
  },
  {
    value: 'ghn',
    label: 'GHN',
    description: 'Giao hàng nhanh toàn quốc',
    logo: GHNLogo,
  },
  {
    value: 'ghtk',
    label: 'GHTK',
    description: 'Giao hàng tiết kiệm toàn quốc',
    logo: GHTKLogo,
  },
  {
    value: 'ahamove',
    label: 'Ahamove',
    description: 'Thu hồi nhanh trong nội thành',
    logo: ahamoveLogo,
  },
]

export function ReturnManagementPage({ role = 'admin' }: ReturnManagementPageProps) {
  const queryClient = useQueryClient()
  const basePath = role === 'admin' ? '/admin' : '/pharmacist'
  const canProcessRefund = role === 'admin'
  const canCompleteReturn = role === 'admin'

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null)
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]) // For bulk actions
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Dialog states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvedAmount, setApprovedAmount] = useState(0)

  const [arrangeDialogOpen, setArrangeDialogOpen] = useState(false)
  const [arrangeCarrier, setArrangeCarrier] = useState('mock_carrier')
  const [arrangeNotes, setArrangeNotes] = useState('')

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [itemCondition, setItemCondition] = useState<'good' | 'damaged' | 'opened' | 'unusable'>('good')
  const [conditionNotes, setConditionNotes] = useState('')

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundTransactionId, setRefundTransactionId] = useState('')
  const [refundNotes, setRefundNotes] = useState('')

  // Confirm dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    request: ReturnRequest
    action: 'approved' | 'rejected'
  } | null>(null)

  const pageSize = 10

  // Fetch return requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['admin-return-requests', statusFilter, currentPage, searchQuery],
    queryFn: () =>
      returnRequestService.getAllReturnRequests({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? (statusFilter as ReturnStatus) : undefined,
        search: searchQuery.trim() || undefined,
      }),
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery])

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['return-request-stats'],
    queryFn: returnRequestService.getReturnRequestStats,
  })

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: (data: {
      requestId: string
      status: 'approved' | 'rejected'
      approvedAmount?: number
      reviewNotes?: string
      rejectionReason?: string
    }) =>
      returnRequestService.reviewReturnRequest(data.requestId, {
        status: data.status,
        approvedAmount: data.approvedAmount,
        reviewNotes: data.reviewNotes,
        rejectionReason: data.rejectionReason,
      }),
    onSuccess: () => {
      toast.success(reviewAction === 'approved' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu')
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
      setReviewDialogOpen(false)
      resetReviewForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    },
  })

  const arrangeMutation = useMutation({
    mutationFn: (data: { requestId: string; carrier?: string; notes?: string }) =>
      returnRequestService.arrangeReturnShipping(data.requestId, {
        carrier: data.carrier,
        notes: data.notes,
      }),
    onSuccess: (updatedRequest) => {
      toast.success(`Đã sắp xếp thu hồi. Mã vận đơn: ${updatedRequest.returnShippingInfo?.trackingNumber || 'đã tạo'}`)
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
      setArrangeDialogOpen(false)
      resetArrangeForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi sắp xếp thu hồi')
    },
  })

  const receiveMutation = useMutation({
    mutationFn: (data: { requestId: string; condition: string; conditionNotes?: string }) =>
      returnRequestService.receiveReturnItems(data.requestId, {
        condition: data.condition as 'good' | 'damaged' | 'opened' | 'unusable',
        conditionNotes: data.conditionNotes,
      }),
    onSuccess: () => {
      toast.success('Đã xác nhận nhận hàng')
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
      setReceiveDialogOpen(false)
      resetReceiveForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    },
  })

  const mockTrackingMutation = useMutation({
    mutationFn: (data: {
      requestId: string
      status: 'picked_up' | 'in_transit' | 'delivered_to_store'
      message: string
    }) =>
      returnRequestService.updateMockReturnTracking(data.requestId, {
        status: data.status,
        message: data.message,
        location: 'MEDISPACE Demo Hub',
      }),
    onSuccess: (updatedRequest) => {
      toast.success('Đã cập nhật tracking thu hồi')
      setSelectedRequest(updatedRequest)
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật tracking')
    },
  })

  const refundMutation = useMutation({
    mutationFn: (data: {
      requestId: string
      refundedAmount: number
      refundTransactionId?: string
      refundNotes?: string
    }) =>
      returnRequestService.processRefund(data.requestId, {
        refundedAmount: data.refundedAmount,
        refundTransactionId: data.refundTransactionId,
        refundNotes: data.refundNotes,
      }),
    onSuccess: () => {
      toast.success('Đã xử lý hoàn tiền')
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
      setRefundDialogOpen(false)
      resetRefundForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    },
  })

  const completeMutation = useMutation({
    mutationFn: (requestId: string) => returnRequestService.completeReturnRequest(requestId),
    onSuccess: () => {
      toast.success('Đã hoàn tất yêu cầu')
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    },
  })

  // Reset form functions
  const resetReviewForm = () => {
    setReviewNotes('')
    setRejectionReason('')
    setApprovedAmount(0)
    setSelectedRequest(null)
  }

  const resetArrangeForm = () => {
    setArrangeCarrier('mock_carrier')
    setArrangeNotes('')
    setSelectedRequest(null)
  }

  const resetReceiveForm = () => {
    setItemCondition('good')
    setConditionNotes('')
    setSelectedRequest(null)
  }

  const resetRefundForm = () => {
    setRefundAmount(0)
    setRefundTransactionId('')
    setRefundNotes('')
    setSelectedRequest(null)
  }

  // Action handlers
  const handleReview = (request: ReturnRequest, action: 'approved' | 'rejected') => {
    setPendingAction({ request, action })
    setConfirmDialogOpen(true)
  }

  const confirmReview = () => {
    if (pendingAction) {
      setSelectedRequest(pendingAction.request)
      setReviewAction(pendingAction.action)
      setApprovedAmount(pendingAction.request.requestedAmount)
      setConfirmDialogOpen(false)
      setReviewDialogOpen(true)
      setPendingAction(null)
    }
  }

  const handleArrangeReturn = (request: ReturnRequest) => {
    setSelectedRequest(request)
    setArrangeCarrier(request.returnShippingInfo?.carrier || 'mock_carrier')
    setArrangeNotes(request.returnShippingInfo?.pickupNotes || '')
    setArrangeDialogOpen(true)
  }

  const handleReceive = (request: ReturnRequest) => {
    setSelectedRequest(request)
    setReceiveDialogOpen(true)
  }

  const handleRefund = async (request: ReturnRequest) => {
    try {
      const detailedRequest = await returnRequestService.getReturnRequestByIdAdmin(request._id)
      setSelectedRequest(detailedRequest)
      setRefundAmount(detailedRequest.approvedAmount || detailedRequest.requestedAmount)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải thông tin thanh toán gốc')
      setSelectedRequest(request)
      setRefundAmount(request.approvedAmount || request.requestedAmount)
    }
    setRefundDialogOpen(true)
  }

  const handleComplete = (request: ReturnRequest) => {
    completeMutation.mutate(request._id)
  }

  const handleMockTracking = (
    request: ReturnRequest,
    status: 'picked_up' | 'in_transit' | 'delivered_to_store',
    message: string,
  ) => {
    mockTrackingMutation.mutate({ requestId: request._id, status, message })
  }

  const handleViewDetails = async (request: ReturnRequest) => {
    try {
      const detailedRequest = await returnRequestService.getReturnRequestByIdAdmin(request._id)
      setSelectedRequest(detailedRequest)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết giao dịch hoàn trả')
      setSelectedRequest(request)
    }
    setDetailsOpen(true)
  }

  // Bulk action handlers
  const toggleSelection = (id: string) => {
    setSelectedRequests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    // Only select pending/reviewing requests that can be bulk processed
    const selectableRequests = requests.filter((r: ReturnRequest) => r.status === 'pending' || r.status === 'reviewing')
    if (selectedRequests.length === selectableRequests.length && selectableRequests.length > 0) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(selectableRequests.map((r: ReturnRequest) => r._id))
    }
  }

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedRequests.length === 0) {
      toast.error('Vui lòng chọn ít nhất một yêu cầu')
      return
    }

    try {
      // Process each request sequentially
      for (const requestId of selectedRequests) {
        const request = requests.find((r: ReturnRequest) => r._id === requestId)
        if (request) {
          await returnRequestService.reviewReturnRequest(requestId, {
            status: action,
            approvedAmount: action === 'approved' ? request.requestedAmount : undefined,
            reviewNotes: action === 'approved' ? 'Duyệt hàng loạt' : undefined,
            rejectionReason: action === 'rejected' ? 'Từ chối hàng loạt' : undefined,
          })
        }
      }

      toast.success(
        action === 'approved'
          ? `Đã duyệt ${selectedRequests.length} yêu cầu`
          : `Đã từ chối ${selectedRequests.length} yêu cầu`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] })
      queryClient.invalidateQueries({ queryKey: ['return-request-stats'] })
      setSelectedRequests([])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý hàng loạt')
    }
  }

  // Stats cards
  const statsCards: StatCardConfig[] = [
    {
      title: 'Chờ xử lý',
      value: (stats?.pending || 0) + (stats?.reviewing || 0),
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Đã duyệt',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'blue',
    },
    {
      title: 'Đang thu hồi',
      value: stats?.awaitingReturn || 0,
      icon: Truck,
      color: 'blue',
    },
    {
      title: 'Đã từ chối',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Đang hoàn tiền',
      value: stats?.refundProcessing || 0,
      icon: CreditCard,
      color: 'purple',
    },
    {
      title: 'Hoàn tất',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'green',
    },
  ]

  const requests = requestsData?.requests || []
  const totalPages = requestsData?.pagination?.totalPages || 1

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1
            className='text-3xl font-bold bg-clip-text text-transparent'
            style={{
              backgroundImage: `linear-gradient(to right, #0A2463, #1E40AF)`,
            }}
          >
            Quản lý đổi/trả hàng
          </h1>
          <p className='text-gray-600 mt-2'>Xem xét và xử lý các yêu cầu đổi/trả từ khách hàng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4'>
        {statsCards.map((stat, idx) => (
          <StatsCard key={idx} config={stat} />
        ))}
      </div>

      {/* Filters */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] p-4'>
        <div className='flex flex-col lg:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo mã yêu cầu, đơn hàng...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-40 border-2 border-[#BFDBFE] focus:border-[#1E40AF]'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              {Object.entries(returnStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className='flex items-center gap-3 mt-4 p-3 bg-[#F0F6FF] border border-[#BFDBFE] rounded-lg'>
            <span className='text-sm text-blue-800'>Đã chọn {selectedRequests.length} yêu cầu</span>
            <div className='flex gap-2 ml-auto'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('approved')}
                className='!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100 hover:!text-green-800 hover:!border-green-100'
              >
                <CheckCircle className='w-4 h-4 mr-1' />
                Duyệt hàng loạt
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleBulkAction('rejected')}
                className='!bg-red-50 !text-red-700 !border-red-200 hover:!bg-red-100 hover:!text-red-800 hover:!border-red-100'
              >
                <XCircle className='w-4 h-4 mr-1' />
                Từ chối hàng loạt
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  toast.success(`Đã xuất ${selectedRequests.length} yêu cầu`)
                  setSelectedRequests([])
                }}
                className='!bg-[#F0F6FF] !text-[#0A2463] !border-[#BFDBFE] hover:!bg-[#E8EDF5] hover:!text-blue-800 hover:!border-[#E8EDF5]'
              >
                <Download className='w-4 h-4 mr-1' />
                Xuất
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-[#E8EDF5] overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-[#F8FAFB] to-[#F0F6FF] border-b border-[#BFDBFE]'>
              <tr>
                <th className='p-4'>
                  <Checkbox
                    checked={
                      selectedRequests.length > 0 &&
                      selectedRequests.length ===
                        requests.filter((r: ReturnRequest) => r.status === 'pending' || r.status === 'reviewing').length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Mã yêu cầu</th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Đơn hàng</th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Lý do</th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Số tiền</th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Trạng thái</th>
                <th className='p-4 text-left text-sm font-medium text-gray-700'>Ngày tạo</th>
                <th className='p-4 text-center text-sm font-medium text-gray-700'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className='p-12 text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E40AF] mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className='p-12 text-center'>
                    <RotateCcw className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                    <h3 className='text-lg text-gray-900 mb-2'>Không tìm thấy yêu cầu</h3>
                    <p className='text-gray-500'>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                requests.map((request: ReturnRequest) => (
                  <tr key={request._id} className='hover:bg-[#F0F6FF]/50 transition-colors'>
                    <td className='p-4'>
                      {request.status === 'pending' || request.status === 'reviewing' ? (
                        <Checkbox
                          checked={selectedRequests.includes(request._id)}
                          onCheckedChange={() => toggleSelection(request._id)}
                        />
                      ) : (
                        <div className='w-4 h-4' />
                      )}
                    </td>
                    <td className='p-4'>
                      <button
                        onClick={() => handleViewDetails(request)}
                        className='font-mono text-sm font-medium text-[#1E40AF] hover:text-blue-800 hover:underline cursor-pointer transition-colors'
                      >
                        {request.requestNumber}
                      </button>
                    </td>
                    <td className='p-4'>
                      <Link
                        to={`${basePath}/orders?search=${request.orderNumber}`}
                        className='text-[#1E40AF] hover:underline font-mono text-sm'
                      >
                        {request.orderNumber}
                      </Link>
                    </td>
                    <td className='p-4 text-sm text-gray-700'>{returnReasonLabels[request.reason]}</td>
                    <td className='p-4 text-sm font-medium text-gray-900'>{formatPrice(request.requestedAmount)}</td>
                    <td className='p-4'>
                      <Badge className={`${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                        {returnStatusLabels[request.status]}
                      </Badge>
                    </td>
                    <td className='p-4 text-sm text-gray-700'>{formatDate(request.createdAt)}</td>
                    <td className='p-4 text-center'>
                      <div className='flex items-center justify-center gap-1'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleViewDetails(request)}
                          className='!bg-[#F0F6FF] !text-[#0A2463] !border-[#BFDBFE] hover:!bg-[#E8EDF5] hover:!text-blue-800 hover:!border-[#E8EDF5]'
                        >
                          <Eye className='w-4 h-4 mr-1' />
                          Xem
                        </Button>

                        {/* Actions based on status */}
                        {(request.status === 'pending' || request.status === 'reviewing') && (
                          <>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='!text-green-600 hover:!text-green-700 hover:!bg-green-100'
                              onClick={() => handleReview(request, 'approved')}
                              title='Duyệt'
                            >
                              <Check className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='!text-red-600 hover:!text-red-700 hover:!bg-red-100'
                              onClick={() => handleReview(request, 'rejected')}
                              title='Từ chối'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </>
                        )}

                        {request.status === 'approved' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-[#1E40AF] hover:text-[#1E40AF] hover:bg-[#F0F6FF]'
                            onClick={() => handleArrangeReturn(request)}
                            title='Sắp xếp thu hồi'
                          >
                            <Truck className='h-4 w-4' />
                          </Button>
                        )}

                        {request.status === 'awaiting_return' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-[#1E40AF] hover:text-[#1E40AF] hover:bg-[#F0F6FF]'
                            onClick={() => handleReceive(request)}
                            title='Xác nhận nhận hàng'
                          >
                            <Package className='h-4 w-4' />
                          </Button>
                        )}

                        {canProcessRefund && request.status === 'received' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-[#1E40AF] hover:text-[#1E40AF] hover:bg-[#F0F6FF]'
                            onClick={() => handleRefund(request)}
                            title='Xử lý hoàn tiền'
                          >
                            <CreditCard className='h-4 w-4' />
                          </Button>
                        )}

                        {canCompleteReturn && request.status === 'refund_processing' && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            onClick={() => handleComplete(request)}
                            title='Hoàn tất'
                          >
                            <CheckCircle className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approved' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}</DialogTitle>
            <DialogDescription>Yêu cầu: {selectedRequest?.requestNumber}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {reviewAction === 'approved' ? (
              <>
                <div>
                  <Label className='mb-2 block'>Số tiền duyệt</Label>
                  <Input
                    type='number'
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Yêu cầu: {formatPrice(selectedRequest?.requestedAmount || 0)}
                  </p>
                </div>
                <div>
                  <Label className='mb-2 block'>Ghi chú (tùy chọn)</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder='Ghi chú khi duyệt...'
                  />
                </div>
              </>
            ) : (
              <div>
                <Label className='mb-2 block'>Lý do từ chối</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder='Nhập lý do từ chối...'
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setReviewDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className={
                reviewAction === 'approved'
                  ? '!text-white !bg-green-600 hover:!bg-green-700'
                  : '!text-white !bg-red-600 hover:!bg-red-700'
              }
              onClick={() => {
                if (selectedRequest) {
                  reviewMutation.mutate({
                    requestId: selectedRequest._id,
                    status: reviewAction,
                    approvedAmount: reviewAction === 'approved' ? approvedAmount : undefined,
                    reviewNotes: reviewAction === 'approved' ? reviewNotes : undefined,
                    rejectionReason: reviewAction === 'rejected' ? rejectionReason : undefined,
                  })
                }
              }}
              disabled={reviewMutation.isPending || (reviewAction === 'rejected' && !rejectionReason)}
            >
              {reviewMutation.isPending ? 'Đang xử lý...' : reviewAction === 'approved' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === 'approved' ? 'Xác nhận duyệt yêu cầu' : 'Xác nhận từ chối yêu cầu'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn {pendingAction?.action === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu{' '}
              <span className='font-semibold'>{pendingAction?.request.requestNumber}</span>?
              {pendingAction?.action === 'approved' && (
                <span className='block mt-2 text-green-600'>
                  Số tiền hoàn: {new Intl.NumberFormat('vi-VN').format(pendingAction?.request.requestedAmount || 0)}đ
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='hover:!bg-[#E8EDF5]'>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReview}
              className={
                pendingAction?.action === 'approved'
                  ? 'bg-green-600 hover:!bg-green-700 text-white'
                  : 'bg-red-600 hover:!bg-red-700 text-white'
              }
            >
              {pendingAction?.action === 'approved' ? 'Tiếp tục duyệt' : 'Tiếp tục từ chối'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Arrange Return Pickup Dialog */}
      <Dialog open={arrangeDialogOpen} onOpenChange={setArrangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sắp xếp thu hồi hàng trả</DialogTitle>
            <DialogDescription>
              Yêu cầu: {selectedRequest?.requestNumber}. Mã vận đơn thu hồi sẽ được hệ thống tự tạo khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label className='mb-2 block'>Đơn vị thu hồi</Label>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                {returnCarrierOptions.map((carrier) => {
                  const selected = arrangeCarrier === carrier.value
                  return (
                    <button
                      key={carrier.value}
                      type='button'
                      onClick={() => setArrangeCarrier(carrier.value)}
                      className={`relative rounded-lg border p-3 text-left transition-all ${
                        selected
                          ? 'border-[#1E40AF] bg-[#F0F6FF] shadow-sm ring-2 ring-[#BFDBFE]'
                          : 'border-[#E8EDF5] bg-white hover:border-[#BFDBFE] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                              selected ? 'border-[#BFDBFE] bg-white text-[#1E40AF]' : 'border-[#E8EDF5] bg-white text-[#0A2463]'
                            }`}
                          >
                            {carrier.logo ? (
                              <img src={carrier.logo} alt={carrier.label} className='max-h-6 max-w-7 object-contain' />
                            ) : (
                              <Truck className='h-4 w-4' />
                            )}
                          </span>
                          <div>
                            <p className='font-semibold text-gray-900'>{carrier.label}</p>
                          </div>
                        </div>
                        {selected && <CheckCircle className='h-5 w-5 text-[#1E40AF]' />}
                      </div>
                      <p className='mt-2 text-xs leading-5 text-gray-500'>{carrier.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label className='mb-2 block'>Ghi chú thu hồi</Label>
              <Textarea
                value={arrangeNotes}
                onChange={(e) => setArrangeNotes(e.target.value)}
                placeholder='Ví dụ: gọi khách trước khi đến, thu hồi tại địa chỉ giao hàng...'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setArrangeDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className='bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white'
              onClick={() => {
                if (selectedRequest) {
                  arrangeMutation.mutate({
                    requestId: selectedRequest._id,
                    carrier: arrangeCarrier.trim() || undefined,
                    notes: arrangeNotes.trim() || undefined,
                  })
                }
              }}
              disabled={arrangeMutation.isPending}
            >
              {arrangeMutation.isPending ? 'Đang sắp xếp...' : 'Xác nhận thu hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Items Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận nhận hàng</DialogTitle>
            <DialogDescription>Yêu cầu: {selectedRequest?.requestNumber}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label className='mb-2 block'>Tình trạng hàng</Label>
              <Select value={itemCondition} onValueChange={(v) => setItemCondition(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='good'>Tốt - Còn nguyên seal</SelectItem>
                  <SelectItem value='opened'>Đã mở - Còn sử dụng được</SelectItem>
                  <SelectItem value='damaged'>Hư hỏng - Không sử dụng được</SelectItem>
                  <SelectItem value='unusable'>Không thể sử dụng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className='mb-2 block'>Ghi chú tình trạng</Label>
              <Textarea
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder='Mô tả tình trạng hàng...'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setReceiveDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className='bg-[#0A2463] text-white hover:bg-[#071A49] hover:text-white'
              onClick={() => {
                if (selectedRequest) {
                  receiveMutation.mutate({
                    requestId: selectedRequest._id,
                    condition: itemCondition,
                    conditionNotes: conditionNotes || undefined,
                  })
                }
              }}
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-[#0A2463]'>
              <CreditCard className='h-5 w-5' />
              Xác nhận hoàn tiền
            </DialogTitle>
            <DialogDescription>
              Kiểm tra giao dịch thanh toán gốc và chứng từ hoàn tiền trước khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-5'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                <p className='text-xs font-medium text-gray-500'>Yêu cầu hoàn hàng</p>
                <p className='mt-1 font-semibold text-gray-900'>{selectedRequest?.requestNumber || '-'}</p>
              </div>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
                <p className='text-xs font-medium text-gray-500'>Đơn hàng mua</p>
                <p className='mt-1 font-semibold text-gray-900'>{selectedRequest?.orderNumber || '-'}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-4'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <div>
                  <p className='font-semibold text-gray-900'>Giao dịch thanh toán gốc</p>
                  <p className='text-xs text-gray-500'>Căn cứ để đối soát và ghi nhận hoàn tiền</p>
                </div>
                <Badge className='bg-[#E8EDF5] text-[#0A2463] hover:bg-[#E8EDF5]'>
                  {selectedRequest?.paymentTransaction
                    ? paymentStatusLabels[selectedRequest.paymentTransaction.status] || selectedRequest.paymentTransaction.status
                    : 'Cần kiểm tra'}
                </Badge>
              </div>

              {selectedRequest?.paymentTransaction ? (
                <div className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                  <div>
                    <p className='text-gray-500'>Phương thức thanh toán</p>
                    <p className='font-medium text-gray-900'>
                      {paymentProviderLabels[selectedRequest.paymentTransaction.provider] ||
                        selectedRequest.paymentTransaction.provider}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Số tiền đã thanh toán</p>
                    <p className='font-medium text-gray-900'>
                      {formatPrice(selectedRequest.paymentTransaction.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Mã đơn từ cổng thanh toán</p>
                    <p className='font-medium text-gray-900'>{selectedRequest.paymentTransaction.providerOrderCode || '-'}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Mã giao dịch thanh toán</p>
                    <p className='font-medium text-gray-900'>
                      {selectedRequest.paymentTransaction.providerTransactionId || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='rounded-md bg-amber-50 p-3 text-sm text-amber-800'>
                  Chưa tìm thấy giao dịch thanh toán đã xác nhận cho đơn hàng này. Vui lòng kiểm tra trạng thái thanh toán của đơn hàng trước khi hoàn tiền.
                </div>
              )}
            </div>

            <div className='rounded-lg border border-gray-200 p-4'>
              <p className='mb-3 font-semibold text-gray-900'>Thông tin hoàn tiền</p>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <Label className='mb-2 block'>Số tiền hoàn</Label>
                  <Input
                    type='number'
                    min={0}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                  />
                  <p className='mt-1 text-xs text-gray-500'>Đã duyệt: {formatPrice(selectedRequest?.approvedAmount || 0)}</p>
                </div>
                <div>
                  <Label className='mb-2 block'>Phương thức hoàn tiền</Label>
                  <div className='flex min-h-10 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900'>
                    {refundMethodLabels[selectedRequest?.refundMethod || 'original'] || 'Theo phương thức đã duyệt'}
                  </div>
                </div>
                <div className='sm:col-span-2'>
                  <Label className='mb-2 block'>Mã chứng từ hoàn tiền</Label>
                  <Input
                    value={refundTransactionId}
                    onChange={(e) => setRefundTransactionId(e.target.value)}
                    placeholder='VD: RF-20260708-001 hoặc mã giao dịch ngân hàng'
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Dùng để đối soát sao kê, biên lai chuyển khoản hoặc mã hoàn từ cổng thanh toán. Nếu để trống, hệ thống sẽ dùng mã ghi sổ nội bộ.
                  </p>
                </div>
                <div className='sm:col-span-2'>
                  <Label className='mb-2 block'>Ghi chú xử lý</Label>
                  <Textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder='Nhập ghi chú đối soát, tài khoản nhận tiền hoặc nội dung chuyển khoản nếu cần'
                  />
                </div>
              </div>
            </div>

            <div className='flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
              <p>
                Sau khi xác nhận, hệ thống sẽ ghi nhận giao dịch hoàn tiền cho yêu cầu này và cập nhật trạng thái hoàn tiền. Không thực hiện lại nếu chưa kiểm tra lịch sử đối soát.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setRefundDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className='bg-[#1E40AF] text-white hover:bg-[#0A2463] hover:text-white'
              onClick={() => {
                if (selectedRequest) {
                  refundMutation.mutate({
                    requestId: selectedRequest._id,
                    refundedAmount: refundAmount,
                    refundTransactionId: refundTransactionId || undefined,
                    refundNotes: refundNotes || undefined,
                  })
                }
              }}
              disabled={refundMutation.isPending || refundAmount <= 0}
            >
              {refundMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Details Sheet */}
      <ReturnRequestDetailsSheet
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        request={selectedRequest}
        orderSearchPath={selectedRequest ? `${basePath}/orders?search=${selectedRequest.orderNumber}` : undefined}
        onReview={handleReview}
        onArrangeReturn={handleArrangeReturn}
        onMockTracking={handleMockTracking}
      />
    </div>
  )
}
