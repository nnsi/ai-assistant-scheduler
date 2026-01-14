import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useCallback, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export const Modal = ({ isOpen, onClose, title, children, size = "md" }: ModalProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          className={cn(
            "relative w-full bg-white rounded-2xl shadow-strong",
            "animate-scale-in",
            sizes[size]
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100">
              <h2 id="modal-title" className="text-lg sm:text-xl font-display text-stone-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 -mr-2 rounded-xl text-stone-400",
                  "hover:text-stone-600 hover:bg-stone-100",
                  "transition-colors duration-200"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-5 sm:px-6 py-4 sm:py-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
