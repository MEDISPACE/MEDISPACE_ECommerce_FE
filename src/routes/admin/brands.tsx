import { BrandManagementPage } from '~/components/admin'

export function meta() {
    return [
        { title: 'Quản lý thương hiệu | MEDISPACE Admin' },
        { name: 'description', content: 'Quản lý thương hiệu và nhà cung cấp' },
    ]
}

export default function BrandsRoute() {
    return <BrandManagementPage />
}
