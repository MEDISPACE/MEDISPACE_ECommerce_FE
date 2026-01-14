import { useParams, Link } from 'react-router'
import { ArrowLeft, Printer, FileText, Download } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export function meta({ params }: { params: { id: string } }) {
    return [
        { title: `Đơn hàng #${params.id} | Dược sĩ` },
        { name: 'description', content: 'Chi tiết đơn hàng' }
    ]
}

export default function PharmacistOrderDetailPage() {
    const { id } = useParams()

    // TODO: Implement full order detail page with:
    // - Complete order information
    // - Print invoice functionality
    // - Export PDF functionality
    // - Order timeline/history

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/pharmacist/orders">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Chi tiết đơn hàng
                        </h1>
                        <p className="text-gray-500 font-mono">#{id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" disabled>
                        <Printer className="w-4 h-4" />
                        In hóa đơn
                    </Button>
                    <Button variant="outline" className="gap-2" disabled>
                        <Download className="w-4 h-4" />
                        Xuất PDF
                    </Button>
                </div>
            </div>

            {/* Placeholder content */}
            <Card className="border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Thông tin đơn hàng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">Tính năng đang phát triển</p>
                        <p className="text-sm mt-2">
                            Trang chi tiết đầy đủ với in hóa đơn, xuất PDF sẽ được triển khai sau.
                        </p>
                        <p className="text-sm mt-4">
                            Hiện tại, vui lòng xem chi tiết từ{' '}
                            <Link to="/pharmacist/orders" className="text-blue-600 hover:underline">
                                trang Quản lý đơn hàng
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
