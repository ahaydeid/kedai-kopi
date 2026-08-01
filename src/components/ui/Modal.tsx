import { type ReactNode, useEffect } from "react";
import { FiX } from "react-icons/fi";

type ModalVariant = "center" | "fullscreen";
type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "7xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  size?: ModalSize;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  header,
  footer,
  variant = "center",
  showCloseButton = true,
  closeOnBackdrop = true,
  overlayClassName = "",
  panelClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFullscreen = variant === "fullscreen";
  const isFullSize = size === "full";
  const overlayClasses = `fixed inset-0 z-[70] bg-black/30 ${overlayClassName}`;
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-[71]"
    : isFullSize
    ? "fixed inset-0 z-[71]"
    : "fixed inset-0 z-[71] flex items-center justify-center px-4 py-6";
    
  const sizeClasses: Record<ModalSize, string> = {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  const hasMaxWidth = panelClassName.includes("max-w-");
  const panelClasses = isFullscreen
    ? `fixed inset-y-0 left-1/2 z-[71] flex w-full max-w-[430px] -translate-x-1/2 flex-col bg-white dark:bg-zinc-950 border-x border-zinc-100 dark:border-zinc-800/80 shadow-xl ${panelClassName}`
    : isFullSize
    ? `flex w-full h-screen max-h-screen flex-col bg-white dark:bg-zinc-950 shadow-xl rounded-none ${panelClassName}`
    : `flex w-full ${hasMaxWidth ? "" : sizeClasses[size]} flex-col rounded bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 shadow-xl max-h-[calc(100vh-3rem)] ${panelClassName}`;

  return (
    <div aria-modal="true" role="dialog" className="lms-modal-wrapper">
      <div className={overlayClasses} onClick={closeOnBackdrop ? onClose : undefined} />
      <div className={containerClasses} onClick={closeOnBackdrop ? onClose : undefined}>
        <div className={panelClasses} onClick={(e) => e.stopPropagation()}>
          {(header || title || showCloseButton) && (
            <div className={`flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-3 ${headerClassName}`}>
              <div className="min-w-0 flex-1">
                {header ?? (title ? <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2> : null)}
              </div>
              {showCloseButton ? (
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 cursor-pointer text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                  aria-label="Tutup modal"
                >
                  <FiX className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )}

          <div className={`min-h-0 flex-1 overflow-y-auto thin-scroll ${bodyClassName}`}>{children}</div>

          {footer ? <div className={`border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-3 ${footerClassName}`}>{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default Modal;
