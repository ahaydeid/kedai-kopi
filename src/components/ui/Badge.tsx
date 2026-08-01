import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyled = "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-tight transition-colors";
  
  const variantStyles = {
    default: "bg-slate-900 text-white border-transparent",
    secondary: "bg-slate-500 text-white border-transparent",
    destructive: "bg-rose-500 text-white border-transparent",
    outline: "text-slate-600 border-slate-200",
    success: "bg-emerald-500 text-white border-transparent",
    warning: "bg-amber-500 text-white border-transparent",
    info: "bg-sky-500 text-white border-transparent",
  };

  const currentVariantStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`${baseStyled} ${currentVariantStyle} ${className}`} {...props} />
  );
}

export default Badge;
