import React from "react";
import { Badge } from "../ui/badge";
import { Stethoscope, Pill, MessageCircle, MapPin } from "lucide-react";

export type BadgeType = "rx" | "otc" | "consultation" | "pharmacy";

interface MedicalBadgeProps {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const badgeConfig = {
  rx: {
    label: "Kê đơn",
    icon: Stethoscope,
    className: "text-white border-2",
    lightClassName: "border-2",
    bgColor: "var(--medical-rx)",
    lightBgColor: "var(--medical-rx-bg)",
    textColor: "var(--medical-rx)",
    borderColor: "var(--medical-rx)"
  },
  otc: {
    label: "Không kê đơn", 
    icon: Pill,
    className: "text-white border-2",
    lightClassName: "border-2",
    bgColor: "var(--medical-otc)",
    lightBgColor: "var(--medical-otc-bg)",
    textColor: "var(--medical-otc)",
    borderColor: "var(--medical-otc)"
  },
  consultation: {
    label: "Tư vấn",
    icon: MessageCircle,
    className: "text-white border-2",
    lightClassName: "border-2",
    bgColor: "var(--medical-consultation)",
    lightBgColor: "var(--medical-consultation-bg)",
    textColor: "var(--medical-consultation)",
    borderColor: "var(--medical-consultation)"
  },
  pharmacy: {
    label: "Nhà thuốc",
    icon: MapPin,
    className: "text-white border-2",
    lightClassName: "border-2",
    bgColor: "var(--medical-pharmacy)",
    lightBgColor: "var(--medical-pharmacy-bg)",
    textColor: "var(--medical-pharmacy)",
    borderColor: "var(--medical-pharmacy)"
  }
};

const sizeConfig = {
  sm: {
    badge: "px-2 py-1 text-xs",
    icon: "w-3 h-3"
  },
  md: {
    badge: "px-3 py-1.5 text-sm", 
    icon: "w-4 h-4"
  },
  lg: {
    badge: "px-4 py-2 text-base",
    icon: "w-5 h-5"
  }
};

export function MedicalBadge({ 
  type, 
  size = "md", 
  showIcon = true, 
  className = "", 
  children 
}: MedicalBadgeProps) {
  const config = badgeConfig[type];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;
  
  const displayText = children || config.label;
  
  return (
    <Badge 
      className={`
        ${config.className} 
        ${sizeStyles.badge} 
        ${className}
        inline-flex items-center gap-1.5 font-medium
      `}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }}
    >
      {showIcon && <IconComponent className={sizeStyles.icon} />}
      {displayText}
    </Badge>
  );
}

// Light version for backgrounds
export function MedicalBadgeLight({ 
  type, 
  size = "md", 
  showIcon = true, 
  className = "", 
  children 
}: MedicalBadgeProps) {
  const config = badgeConfig[type];
  const sizeStyles = sizeConfig[size];
  const IconComponent = config.icon;
  
  const displayText = children || config.label;
  
  return (
    <Badge 
      className={`
        ${config.lightClassName} 
        ${sizeStyles.badge} 
        ${className}
        inline-flex items-center gap-1.5 font-medium
      `}
      style={{
        backgroundColor: config.lightBgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
    >
      {showIcon && <IconComponent className={sizeStyles.icon} />}
      {displayText}
    </Badge>
  );
}

// Quick access components
export const RxBadge = (props: Omit<MedicalBadgeProps, "type">) => 
  <MedicalBadge type="rx" {...props} />;

export const OTCBadge = (props: Omit<MedicalBadgeProps, "type">) => 
  <MedicalBadge type="otc" {...props} />;

export const ConsultationBadge = (props: Omit<MedicalBadgeProps, "type">) => 
  <MedicalBadge type="consultation" {...props} />;

export const PharmacyBadge = (props: Omit<MedicalBadgeProps, "type">) => 
  <MedicalBadge type="pharmacy" {...props} />;
