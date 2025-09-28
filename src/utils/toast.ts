import { toast as sonnerToast } from 'sonner';

// Custom toast utilities for MEDISPACE
export const toast = {
  success: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      id: options?.id,
      className: 'medispace-toast-success',
    });
  },

  error: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 5000,
      id: options?.id,
      className: 'medispace-toast-error',
    });
  },

  loading: (message: string, options?: { id?: string }) => {
    return sonnerToast.loading(message, {
      id: options?.id,
      className: 'medispace-toast-loading',
    });
  },

  info: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      id: options?.id,
      className: 'medispace-toast-info',
    });
  },

  warning: (message: string, options?: { id?: string; duration?: number }) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 4000,
      id: options?.id,
      className: 'medispace-toast-warning',
    });
  },

  // Specific MEDISPACE branded toasts
  auth: {
    loginSuccess: () => toast.success('🏥 Chào mừng bạn đến với MEDISPACE! Sức khỏe là ưu tiên hàng đầu.'),
    loginError: () => toast.error('❌ Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu!'),
    registerSuccess: () => toast.success('🎉 Chào mừng gia nhập cộng đồng MEDISPACE! Hãy kiểm tra email để xác thực tài khoản.', { duration: 6000 }),
    registerError: () => toast.error('❌ Đăng ký thất bại. Vui lòng thử lại sau!'),
    resetSuccess: () => toast.success('📧 Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.', { duration: 6000 }),
    resetError: () => toast.error('❌ Không thể gửi email khôi phục. Vui lòng thử lại!'),
    validationError: (message: string) => toast.error(`⚠️ ${message}`),
    sessionExpired: () => toast.warning('⏰ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!'),
    accountLocked: () => toast.error('🔒 Tài khoản tạm thời bị khóa. Vui lòng liên hệ hỗ trợ!'),
  },

  // Dismiss toast
  dismiss: (id?: string) => sonnerToast.dismiss(id),

  // Dismiss all toasts
  dismissAll: () => sonnerToast.dismiss(),
};