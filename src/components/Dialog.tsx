import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Hide the visible title (it is still announced to screen readers). */
  hideTitle?: boolean;
}

/**
 * Accessible modal built on the native <dialog> element, which provides
 * focus containment, Escape-to-close and an inert background.
 */
export function Dialog({ open, onClose, title, children, footer, className = '', hideTitle = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnFocus.current = document.activeElement;
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      if (typeof el.close === 'function') el.close();
      else el.removeAttribute('open');
      if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className="dialog__head" style={hideTitle ? { padding: 0 } : undefined}>
            <h2 id={titleId} className={hideTitle ? 'sr-only' : 'dialog__title'}>
              {title}
            </h2>
            {!hideTitle && (
              <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
                <X size={18} />
              </button>
            )}
          </div>
          {children}
          {footer && <div className="dialog__foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}
