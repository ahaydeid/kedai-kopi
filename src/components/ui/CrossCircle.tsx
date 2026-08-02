import React from "react";
import { FiX } from "react-icons/fi";

export interface CrossCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function CrossCircle({ className = "", size = "md", ...props }: CrossCircleProps) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizeStyles = {
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentIconSize = iconSizeStyles[size] || iconSizeStyles.md;

  return (
    <div
      className={`rounded-full bg-rose-400 flex items-center justify-center shrink-0 ${currentSize} ${className}`}
      {...props}
    >
      <FiX className={`text-white stroke-[3px] ${currentIconSize}`} />
    </div>
  );
}

export default CrossCircle;
