import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { authService } from '../../services/authService'
import { toast } from 'sonner'

export function VerifyEmailPage() {
    const { token } = useParams()
    const navigate = useNavigate()

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Token xác thực không hợp lệ hoặc bị thiếu.')
            return
        }

        const verify = async () => {
            try {
                await authService.verifyEmail(token)
                setStatus('success')
            } catch (error: any) {
                setStatus('error')
                setMessage(error.message || 'Xác thực email thất bại. Token có thể đã hết hạn.')
            }
        }

        verify()
    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xác thực...</h2>
                        <p className="text-gray-600">Vui lòng đợi trong giây lát.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thành công!</h2>
                        <p className="text-gray-600 mb-8">
                            Email của bạn đã được xác thực. Bây giờ bạn có thể sử dụng đầy đủ tính năng của MediSpace.
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-semibold"
                        >
                            Đăng nhập ngay
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực thất bại</h2>
                        <p className="text-gray-600 mb-8">{message}</p>
                        <div className="space-y-3 w-full">
                            <Button
                                onClick={() => navigate('/login')}
                                variant="outline"
                                className="w-full h-12 rounded-xl font-semibold"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại đăng nhập
                            </Button>
                            {/* Có thể thêm nút Gửi lại email xác thực ở đây nếu cần */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
