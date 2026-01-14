import { ReturnManagementPage } from '~/components/pharmacist/ReturnManagementPage'

export function meta() {
    return [
        { title: 'Quản lý đổi/trả | MEDISPACE Pharmacist' },
        { name: 'description', content: 'Quản lý yêu cầu đổi/trả hàng' },
    ]
}

export default function ReturnsRoute() {
    return <ReturnManagementPage />
}
