import React, { useState, useEffect } from 'react'

// Local helper to resolve photo source
const resolvePhotoSrc = (photo: string | null) => photo;

type AvatarProps = {
  name?: string;
  photo?: string | null;
  size?: "small" | "smedium" | "medium" | "large";
  className?: string;
  shape?: "circle" | "square";
};

export default function Avatar({
  name = "",
  photo = null,
  size = "medium",
  className = "",
  shape = "circle",
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if photo changes
  useEffect(() => {
    setHasError(false);
  }, [photo]);

  const sizeClasses = {
    small: "w-7 h-7 text-xs",   // Sync with small size h-7 w-7 on navbar
    smedium: "w-9 h-9 text-xs", // Di antara small (w-7) dan medium (w-12)
    medium: "w-12 h-12 text-sm",
    large: "w-32 h-32 text-2xl",
  };

  const shapeClass = shape === "square" ? "rounded" : "rounded-full";
  const photoUrl = resolvePhotoSrc(photo);

  if (!photoUrl || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center ${shapeClass} overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${className}`}
        aria-label={name || "User"}
        role="img"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full opacity-60"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="50" fill="#6b7280" />
          <circle cx="50" cy="36" r="14" fill="white" />
          <path
            d="M24 78c5-16 16-25 26-25s21 9 26 25c-7 6-16 10-26 10s-19-4-26-10Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name || "User"}
      className={`${sizeClasses[size]} ${shapeClass} object-cover ${className}`}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
