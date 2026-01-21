import { useEffect, useCallback, useRef, useId } from "react";
import type { ReactNode } from "react";

type Section = "about" | "projects" | "skills" | "experience" | "contact";

const SECTION_LABELS: Record<Section, { label: string; icon: string }> = {
  about: { label: "About", icon: "👤" },
  projects: { label: "Projects", icon: "💼" },
  skills: { label: "Skills", icon: "⚡" },
  experience: { label: "Experience", icon: "📋" },
  contact: { label: "Contact", icon: "📬" },
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Show section navigation tabs */
  showNav?: boolean;
  /** Current active section (for highlighting) */
  currentSection?: Section;
  /** Callback when user clicks a different section */
  onNavigate?: (section: Section) => void;
}

export default function Modal({ 
  title, 
  onClose, 
  children,
  showNav = false,
  currentSection,
  onNavigate,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Focus trap - keep focus within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap with Tab key
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose]
  );

  // Auto-focus close button and restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    window.addEventListener("keydown", handleKeyDown);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [handleKeyDown]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sections = Object.keys(SECTION_LABELS) as Section[];

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4 md:p-8"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-slate-900 border border-slate-700 rounded-xl sm:rounded-2xl max-w-3xl w-full max-h-[85vh] landscape:max-h-[90vh] landscape:max-w-2xl overflow-hidden shadow-2xl shadow-black/50 animate-scaleIn"
      >
        {/* Header - compact on landscape mobile */}
        <div className="bg-slate-800/80 px-4 py-3 sm:px-8 sm:py-5 md:px-12 md:py-6 border-b border-slate-700 flex justify-between items-center">
          <h2 id={titleId} className="text-base sm:text-xl md:text-2xl font-bold text-white pixel-text">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xl sm:text-2xl leading-none p-1.5 sm:p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Section Navigation Tabs - more compact */}
        {showNav && onNavigate && (
          <nav className="bg-slate-800/30 px-3 py-2 sm:px-6 sm:py-4 border-b border-slate-700/50" aria-label="Portfolio sections">
            <ul className="flex gap-1 sm:gap-2 overflow-x-auto">
              {sections.map((section) => {
                const isActive = section === currentSection;
                return (
                  <li key={section}>
                    <button
                      onClick={() => onNavigate(section)}
                      className={`
                        px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all
                        flex items-center gap-1 sm:gap-2
                        ${isActive 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-400
                      `}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span aria-hidden="true" className="text-sm sm:text-base">{SECTION_LABELS[section].icon}</span>
                      <span className="hidden sm:inline">{SECTION_LABELS[section].label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Content - smaller text and padding on mobile landscape */}
        <div className="p-4 sm:p-8 md:p-12 overflow-y-auto max-h-[calc(85vh-80px)] landscape:max-h-[calc(90vh-70px)] text-slate-200 text-sm sm:text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
