import { ReturnManagementPage } from '~/components/admin/ReturnManagementPage'

export function meta() {
    return [
        { title: 'Quản lý đổi/trả | MEDISPACE Admin' },
        { name: 'description', content: 'Quản lý yêu cầu đổi/trả hàng' },
    ]
}

export default function ReturnsRoute() {
    return <ReturnManagementPage />
}
