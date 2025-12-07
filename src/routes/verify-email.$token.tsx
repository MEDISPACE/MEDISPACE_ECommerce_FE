import { VerifyEmailPage } from '~/components/auth/VerifyEmailPage'

export function meta() {
    return [
        { title: 'Xác thực Email | MEDISPACE' },
        { name: 'description', content: 'Xác thực địa chỉ email của bạn' },
    ]
}

export default function VerifyEmail() {
    return <VerifyEmailPage />
}
