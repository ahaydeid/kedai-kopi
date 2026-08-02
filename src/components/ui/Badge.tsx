import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const baseStyled = "inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-normal transition-colors";
  
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    secondary: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400",
    destructive: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    outline: "border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 bg-transparent",
    success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    info: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
  };

  const currentVariantStyle = variantStyles[variant] || variantStyles.default;

  return (
    <span className={`${baseStyled} ${currentVariantStyle} ${className}`} {...props} />
  );
}

export default Badge;
