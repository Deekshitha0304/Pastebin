'use client';

import { useEffect, useRef } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  titleBadge?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Modal built with native <dialog> (focus trap + Escape handled by browser)
 * and Tailwind for styling. No custom focus useEffect needed.
 */
export function Modal({ open, onClose, title, titleBadge, subtitle, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.classList.add('overflow-hidden');
    } else {
      dialog.close();
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  const handleClose = () => onClose();

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleClose}
      onClose={handleClose}
      className="fixed inset-0 m-auto max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border-0 bg-white p-8 shadow-2xl [&::backdrop]:bg-black/50"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close modal"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            {title}
          </h2>
          {titleBadge}
        </div>
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>

      {children}
    </dialog>
  );
}
