export default function ProductsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6">Sản phẩm - MEDISPACE</h1>
      <div className="grid gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2>Danh mục thuốc</h2>
          <p className="text-muted-foreground">Tìm thuốc theo danh mục</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h2>Tìm kiếm</h2>
          <p className="text-muted-foreground">Tìm thuốc theo tên, thành phần</p>
        </div>
      </div>
    </div>
  );
}