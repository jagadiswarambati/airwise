import React, { useEffect, useRef } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traverses ancestors up to document.body and applies the inert attribute
 * to all sibling subtrees, returning a cleanup function to restore them.
 */
function applyInertToBackground(dialogEl: HTMLElement | null): () => void {
  if (typeof document === 'undefined' || !dialogEl) {
    return () => {};
  }

  const inertElements: HTMLElement[] = [];
  const backdrop = dialogEl.parentElement || dialogEl;
  let curr: HTMLElement | null = backdrop;

  while (curr && curr !== document.body) {
    const parent: HTMLElement | null = curr.parentElement;
    if (parent) {
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i];
        if (child instanceof HTMLElement && child !== curr && !child.hasAttribute('inert')) {
          child.setAttribute('inert', '');
          inertElements.push(child);
        }
      }
    }
    curr = parent;
  }

  return () => {
    inertElements.forEach((el) => {
      el.removeAttribute('inert');
    });
  };
}

/**
 * Traps Tab and Shift+Tab key navigation within the focusable elements of the dialog.
 */
function handleDialogTabTrap(e: KeyboardEvent, dialogEl: HTMLElement | null): void {
  if (e.key !== 'Tab' || !dialogEl) return;

  const focusables = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (focusables.length === 0) {
    e.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function useDialogFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  dialogRef: React.RefObject<HTMLDivElement | null>,
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef<() => void>(onClose);

  // Keep latest onClose callback in a ref so effect only re-runs when isOpen flips
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    if (typeof document !== 'undefined') {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const cleanupInert = applyInertToBackground(dialogRef.current);

    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      handleDialogTabTrap(e, dialogRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      cleanupInert();

      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus();
      }
    };
  }, [isOpen, dialogRef]);
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  titleId,
  ariaLabel,
  children,
  className = '',
  overlayClassName = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(isOpen, onClose, dialogRef);

  if (!isOpen) return null;

  return (
    <div
      className={`aw-dialog-backdrop ${overlayClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={!titleId ? ariaLabel : undefined}
        tabIndex={-1}
        className={`aw-dialog-surface ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
