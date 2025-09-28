export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6">Dashboard - MEDISPACE</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2>Đơn hàng gần đây</h2>
          <p className="text-muted-foreground">Xem các đơn hàng của bạn</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2>Sản phẩm yêu thích</h2>
          <p className="text-muted-foreground">Thuốc đã lưu</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2>Đơn thuốc</h2>
          <p className="text-muted-foreground">Upload đơn thuốc</p>
        </div>
      </div>
    </div>
  );
}