import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'prescription' | 'payment';
}

export function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === 'order') {
      switch (status) {
        case 'pending_payment':
          return { text: 'Chờ thanh toán', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' } };
        case 'confirmed':
          return { text: 'Đã xác nhận', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-consultation-bg)', color: 'var(--medical-consultation)', borderColor: 'var(--medical-consultation)' } };
        case 'processing':
          return { text: 'Đang xử lý', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-consultation-bg)', color: 'var(--medical-consultation)', borderColor: 'var(--medical-consultation)' } };
        case 'preparing':
          return { text: 'Đang chuẩn bị', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-pharmacy-bg)', color: 'var(--medical-pharmacy)', borderColor: 'var(--medical-pharmacy)' } };
        case 'shipping':
          return { text: 'Đang giao hàng', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-pharmacy-bg)', color: 'var(--medical-pharmacy)', borderColor: 'var(--medical-pharmacy)' } };
        case 'delivered':
          return { text: 'Hoàn thành', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-otc-bg)', color: 'var(--medical-otc)', borderColor: 'var(--medical-otc)' } };
        case 'cancelled':
          return { text: 'Đã hủy', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-rx-bg)', color: 'var(--medical-rx)', borderColor: 'var(--medical-rx)' } };
        default:
          return { text: status, className: 'border text-xs font-medium', style: { backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)', borderColor: 'var(--gray-200)' } };
      }
    }
    
    if (type === 'prescription') {
      switch (status) {
        case 'pending':
          return { text: 'Chờ xử lý', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' } };
        case 'reviewing':
          return { text: 'Đang xem xét', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-consultation-bg)', color: 'var(--medical-consultation)', borderColor: 'var(--medical-consultation)' } };
        case 'approved':
          return { text: 'Đã duyệt', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-otc-bg)', color: 'var(--medical-otc)', borderColor: 'var(--medical-otc)' } };
        case 'rejected':
          return { text: 'Từ chối', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-rx-bg)', color: 'var(--medical-rx)', borderColor: 'var(--medical-rx)' } };
        case 'completed':
          return { text: 'Hoàn thành', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-otc-bg)', color: 'var(--medical-otc)', borderColor: 'var(--medical-otc)' } };
        default:
          return { text: status, className: 'border text-xs font-medium', style: { backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)', borderColor: 'var(--gray-200)' } };
      }
    }
    
    if (type === 'payment') {
      switch (status) {
        case 'pending':
          return { text: 'Chờ thanh toán', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' } };
        case 'paid':
          return { text: 'Đã thanh toán', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-otc-bg)', color: 'var(--medical-otc)', borderColor: 'var(--medical-otc)' } };
        case 'failed':
          return { text: 'Thất bại', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--medical-rx-bg)', color: 'var(--medical-rx)', borderColor: 'var(--medical-rx)' } };
        case 'refunded':
          return { text: 'Đã hoàn tiền', className: 'border text-xs font-medium', style: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' } };
        default:
          return { text: status, className: 'border text-xs font-medium', style: { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#e2e8f0' } };
      }
    }
    
    return { text: status, className: 'border text-xs font-medium', style: { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#e2e8f0' } };
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={config.className}
      style={config.style}
    >
      {config.text}
    </Badge>
  );
}