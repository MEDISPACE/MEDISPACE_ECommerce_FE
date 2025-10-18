import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { XCircle, RefreshCw, Home, HelpCircle, Phone, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { UniversalBreadcrumb } from '../shared/UniversalBreadcrumb'

export function OrderFailurePage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error") || "UNKNOWN";
  const errorMessage = searchParams.get("message") || "Đã có lỗi xảy ra trong quá trình xử lý đơn hàng";

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const breadcrumbItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Thanh toán", href: "/cart/checkout" },
    { label: "Đặt hàng thất bại" }
  ];

  const getErrorDetails = (code: string) => {
    switch (code) {
      case "PAYMENT_FAILED":
        return {
          title: "Thanh toán thất bại",
          description: "Giao dịch thanh toán của bạn không thể hoàn tất. Vui lòng kiểm tra thông tin thanh toán và thử lại.",
          suggestions: [
            "Kiểm tra số dư tài khoản",
            "Xác minh thông tin thẻ/tài khoản",
            "Thử phương thức thanh toán khác",
            "Liên hệ ngân hàng của bạn"
          ]
        };
      case "OUT_OF_STOCK":
        return {
          title: "Sản phẩm hết hàng",
          description: "Một số sản phẩm trong giỏ hàng của bạn đã hết hàng. Vui lòng cập nhật giỏ hàng và thử lại.",
          suggestions: [
            "Kiểm tra lại giỏ hàng",
            "Chọn sản phẩm thay thế",
            "Liên hệ với chúng tôi để đặt hàng trước",
            "Đăng ký nhận thông báo khi có hàng"
          ]
        };
      case "TIMEOUT":
        return {
          title: "Hết thời gian xử lý",
          description: "Phiên giao dịch đã hết hạn. Vui lòng thực hiện lại đơn hàng.",
          suggestions: [
            "Làm mới trang và thử lại",
            "Kiểm tra kết nối internet",
            "Thực hiện thanh toán nhanh hơn",
            "Liên hệ hỗ trợ nếu vấn đề tiếp diễn"
          ]
        };
      case "PRESCRIPTION_REQUIRED":
        return {
          title: "Cần đơn thuốc",
          description: "Một số sản phẩm trong đơn hàng yêu cầu đơn thuốc từ bác sĩ. Vui lòng upload đơn thuốc trước khi đặt hàng.",
          suggestions: [
            "Upload ảnh đơn thuốc hợp lệ",
            "Đảm bảo đơn thuốc còn hạn sử dụng",
            "Liên hệ dược sĩ để tư vấn",
            "Xem hướng dẫn upload đơn thuốc"
          ]
        };
      default:
        return {
          title: "Đặt hàng thất bại",
          description: errorMessage,
          suggestions: [
            "Kiểm tra lại thông tin đơn hàng",
            "Thử lại sau vài phút",
            "Liên hệ bộ phận hỗ trợ",
            "Sử dụng phương thức thanh toán khác"
          ]
        };
    }
  };

  const errorDetails = getErrorDetails(errorCode);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
        <UniversalBreadcrumb items={breadcrumbItems} />
        {/* Error Animation */}
        <div className="text-center mb-8 animate-slide-in-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg mb-6 animate-pulse">
            <XCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent mb-3">
            {errorDetails.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {errorDetails.description}
          </p>
        </div>

        {/* Error Details */}
        <Card className="bg-white/80 backdrop-blur-lg shadow-lg rounded-2xl border border-red-200 mb-6 animate-slide-in-up">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-3 text-red-900">
              <HelpCircle className="w-6 h-6" />
              Có thể bạn cần biết
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {errorDetails.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                    {index + 1}
                  </div>
                  <p className="text-gray-900 flex-1">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Code */}
        <Alert className="mb-6 border-2 border-orange-200 bg-orange-50 animate-slide-in-up">
          <AlertDescription className="text-orange-800">
            <strong>Mã lỗi:</strong> {errorCode} • <strong>Thời gian:</strong> {new Date().toLocaleString('vi-VN')}
            <br />
            <span className="text-sm">Vui lòng cung cấp mã lỗi này khi liên hệ với bộ phận hỗ trợ để được giúp đỡ nhanh hơn.</span>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg"
          >
            <Link to="/cart/checkout" className="gap-2">
              <RefreshCw className="w-5 h-5" />
              Thử lại thanh toán
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Link to="/cart" className="gap-2">
              Quay lại giỏ hàng
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Link to="/" className="gap-2">
              <Home className="w-5 h-5" />
              Về trang chủ
            </Link>
          </Button>
        </div>

        {/* Support Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 animate-slide-in-up">
          <CardHeader>
            <CardTitle className="text-blue-900">Cần hỗ trợ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Đội ngũ hỗ trợ của MEDISPACE luôn sẵn sàng giúp đỡ bạn. Chúng tôi có thể giải quyết vấn đề của bạn qua các kênh sau:
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="tel:19001234"
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Hotline</p>
                  <p className="text-blue-600">1900 1234</p>
                  <p className="text-xs text-gray-500">24/7</p>
                </div>
              </a>

              <a
                href="mailto:support@medispace.vn"
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-green-600 text-sm">support@medispace.vn</p>
                  <p className="text-xs text-gray-500">Phản hồi trong 2h</p>
                </div>
              </a>

              <Link
                to="/consultation/chat"
                className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Live Chat</p>
                  <p className="text-purple-600">Chat với dược sĩ</p>
                  <p className="text-xs text-gray-500">Trực tuyến</p>
                </div>
              </Link>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 text-center">
                💡 <strong>Mẹo:</strong> Chụp ảnh màn hình trang này và gửi kèm khi liên hệ hỗ trợ để được giải quyết nhanh hơn!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
