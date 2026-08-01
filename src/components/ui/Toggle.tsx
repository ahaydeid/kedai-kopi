import React from "react";

interface ToggleProps {
  leftLabel: string;
  rightLabel: string;
  checked: boolean; // true = left, false = right
  onChange: (checked: boolean) => void;
  activeColorClass?: string; // e.g. bg-emerald-600, bg-rose-600
  leftActiveColorClass?: string;
  rightActiveColorClass?: string;
  className?: string; // for custom styling
  fontSizeClass?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  leftLabel,
  rightLabel,
  checked,
  onChange,
  activeColorClass,
  leftActiveColorClass = "bg-rose-600",
  rightActiveColorClass = "bg-emerald-500",
  className = "",
  fontSizeClass = "text-xs",
}) => {
  const leftBg = activeColorClass && checked ? activeColorClass : leftActiveColorClass;
  const rightBg = activeColorClass && !checked ? activeColorClass : rightActiveColorClass;

  return (
    <div
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full p-0.5 cursor-pointer select-none ${className}`}
    >
      {/* Left Option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(true);
        }}
        className={`px-2.5 py-0.5 ${fontSizeClass} font-normal rounded-full text-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
          checked
            ? `${leftBg} text-white shadow-xs`
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        {leftLabel}
      </button>

      {/* Right Option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(false);
        }}
        className={`px-2.5 py-0.5 ${fontSizeClass} font-normal rounded-full text-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
          !checked
            ? `${rightBg} text-white shadow-xs`
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
};

export default Toggle;
