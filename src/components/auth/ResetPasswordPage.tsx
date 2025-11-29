import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { PasswordInput } from '../forms/PasswordInput'
import { Shield, AlertCircle, CheckCircle, ArrowLeft, Loader2, XCircle } from 'lucide-react'
import { authService } from '../../services/authService'
import { toast } from 'sonner'
import { PageTransition } from '../shared/PageTransition'
import { getErrorMessage } from '../../constants/errorMapping'

export function ResetPasswordPage() {
    const { token } = useParams()
    const finalToken = token

    const navigate = useNavigate()

    const [passwords, setPasswords] = useState({
        password: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isVerifying, setIsVerifying] = useState(true)

    useEffect(() => {
        const verifyToken = async () => {
            if (!finalToken) {
                setErrors({ general: 'Token không hợp lệ hoặc bị thiếu.' })
                setIsVerifying(false)
                return
            }

            try {
                await authService.verifyForgotPasswordToken(finalToken)
                setIsVerifying(false)
            } catch (error: any) {
                setErrors({ general: getErrorMessage(error.message) || 'Token không hợp lệ hoặc đã hết hạn.' })
                setIsVerifying(false)
            }
        }

        verifyToken()
    }, [finalToken])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!finalToken) {
            setErrors({ general: 'Token không hợp lệ hoặc bị thiếu.' })
            return
        }

        const newErrors: Record<string, string> = {}

        if (!passwords.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu mới'
        } else if (passwords.password.length < 8) {
            newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.password)) {
            newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
        }

        if (!passwords.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        } else if (passwords.password !== passwords.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
        }

        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setIsLoading(true)

        try {
            await authService.resetPassword(finalToken, passwords.password, passwords.confirmPassword)
            setIsSuccess(true)
            toast.success('Đặt lại mật khẩu thành công')
        } catch (error: any) {
            if (error.errors) {
                const fieldErrors: Record<string, string> = {}
                Object.keys(error.errors).forEach((key) => {
                    const msg = error.errors[key].msg
                    fieldErrors[key] = getErrorMessage(msg)
                })
                setErrors(fieldErrors)
            } else {
                setErrors({ general: getErrorMessage(error.message) || 'Đã có lỗi xảy ra. Vui lòng thử lại.' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600">Đang kiểm tra token...</p>
                </div>
            </div>
        )
    }

    if (errors.general && !isSuccess) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
                <div className='bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center'>
                    <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                        <XCircle className='w-10 h-10 text-red-600' />
                    </div>
                    <h2 className='text-2xl font-bold text-gray-800 mb-2'>Liên kết không hợp lệ</h2>
                    <p className='text-gray-600 mb-8'>{errors.general}</p>
                    <Button
                        onClick={() => navigate('/forgot-password')}
                        className='w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-semibold'
                    >
                        <ArrowLeft className='w-5 h-5 mr-2' />
                        Yêu cầu lại mật khẩu
                    </Button>
                </div>
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div className='text-center p-8'>
                <div className='relative mb-8'>
                    <div className='w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl'>
                        <CheckCircle className='w-12 h-12 text-white' />
                    </div>
                    <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse'></div>
                </div>

                <h2 className='text-3xl font-bold mb-4 text-blue-800'>Hoàn tất!</h2>

                <p className='text-gray-600 mb-8 text-lg leading-relaxed'>
                    Mật khẩu của bạn đã được đặt lại thành công.
                    <br />
                    Bây giờ bạn có thể đăng nhập với mật khẩu mới.
                </p>

                <Button
                    onClick={() => navigate('/login')}
                    className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-white'
                >
                    <ArrowLeft className='w-5 h-5 mr-2' />
                    Đăng nhập ngay
                </Button>
            </div>
        )
    }

    return (
        <PageTransition>
            <div className='p-8'>
                <div className='text-center mb-8'>
                    <div className='relative mb-6'>
                        <div className='w-20 h-20 bg-white/80 backdrop-blur-lg border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                            <Shield className='w-10 h-10 text-blue-600' />
                        </div>
                        <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse'></div>
                    </div>
                    <h2 className='text-3xl font-bold mb-3 text-blue-800'>Đặt lại mật khẩu</h2>
                    <p className='text-gray-600 text-lg'>Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='space-y-2'>
                        <Label className='text-gray-700 font-medium'>Mật khẩu mới</Label>
                        <PasswordInput
                            value={passwords.password}
                            onChange={(password) => setPasswords({ ...passwords, password })}
                            placeholder='Nhập mật khẩu mới'
                            error={errors.password}
                            showStrength={true}
                            className='bg-blue-50/50 focus:bg-white backdrop-blur-sm border-blue-200 focus:border-blue-500'
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-700 font-medium'>Xác nhận mật khẩu</Label>
                        <PasswordInput
                            value={passwords.confirmPassword}
                            onChange={(confirmPassword) => setPasswords({ ...passwords, confirmPassword })}
                            placeholder='Nhập lại mật khẩu mới'
                            error={errors.confirmPassword}
                            className='bg-blue-50/50 focus:bg-white backdrop-blur-sm border-blue-200 focus:border-blue-500'
                        />
                    </div>

                    <Button
                        type='submit'
                        className='w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-white'
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className='flex items-center gap-2'>
                                <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                Đang cập nhật...
                            </div>
                        ) : (
                            <>
                                <Shield className='w-5 h-5 mr-2' />
                                Đặt lại mật khẩu
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </PageTransition>
    )
}
