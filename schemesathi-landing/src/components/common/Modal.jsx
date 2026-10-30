import { useEffect, useRef, useState } from 'react';
import './Modal.css';

/**
 * Modal Component - Accessible modal dialog with overlay
 * 
 * Features:
 * - Centered modal window with backdrop blur
 * - Smooth entrance/exit animations
 * - Keyboard support (Esc to close)
 * - Focus trap (Tab navigation within modal)
 * - Backdrop click to close
 * - Page scroll prevention when open
 * - Full accessibility support (ARIA attributes)
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @param {ReactNode} props.children - Modal content
 * @param {string} props.title - Modal title
 * @param {boolean} [props.showHeader=true] - Whether to show header with title and close button
 * @returns {JSX.Element | null} Rendered modal or null if not open
 */
export default function Modal({ isOpen, onClose, children, title, showHeader = true }) {
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle scroll prevention
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      document.body.style.overflow = 'auto';
      setIsAnimating(false);
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle keyboard events (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      // Tab focus trap
      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
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
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus on the first focusable element
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isAnimating) {
    return null;
  }

  return (
    <div
      className={`modal-overlay ${isOpen ? 'modal-open' : 'modal-closing'}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`modal-container ${isOpen ? 'modal-open' : 'modal-closing'}`}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {showHeader && (
          <div className="modal-header">
            <h2 className="modal-title" id="modal-title">
              {title}
            </h2>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
