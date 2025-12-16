import { useState } from "react";
import { Package, Bell, Gift, Heart, Pill, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface Notification {
  id: string;
  type: "order" | "prescription" | "promotion" | "health" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onAction?: (actionUrl: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onAction }: NotificationItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case "order":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "prescription":
        return <Pill className="w-5 h-5 text-green-600" />;
      case "promotion":
        return <Gift className="w-5 h-5 text-purple-600" />;
      case "health":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case "order": return "Đơn hàng";
      case "prescription": return "Đơn thuốc";
      case "promotion": return "Khuyến mãi";
      case "health": return "Sức khỏe";
      case "system": return "Hệ thống";
      default: return "Thông báo";
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case "order": return "bg-blue-100 text-blue-800";
      case "prescription": return "bg-green-100 text-green-800";
      case "promotion": return "bg-purple-100 text-purple-800";
      case "health": return "bg-red-100 text-red-800";
      case "system": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;

    setIsProcessing(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = () => {
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${!notification.isRead
      ? "border-blue-200 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent"
      : "border-blue-200"
      }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`text-xs ${getTypeColor()}`}>
                  {getTypeLabel()}
                </Badge>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatTimestamp(notification.timestamp)}
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
              {notification.title}
            </h4>

            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {notification.actionUrl && notification.actionText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAction}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    {notification.actionText}
                  </Button>
                )}
              </div>

              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={isProcessing}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Đánh dấu đã đọc
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
