'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Minimal image lightbox using native <dialog>
 * 
 * Features:
 * - Native dialog element (accessible by default)
 * - Closes on: Escape key, backdrop click, close button
 * - Subtle fade-in animation
 * - No external dependencies
 */
export default function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    // Only close if clicking directly on the dialog backdrop
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );
    
    // The dialog content is smaller than the backdrop, so if the click is within
    // the dialog bounds but not on the image container, it's a backdrop click
    if (e.target === dialog) {
      onClose();
    }
  }, [onClose]);

  // Handle native dialog close (Escape key)
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!src) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onClick={handleBackdropClick}
      className="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-0 bg-black/90 backdrop:bg-transparent border-none outline-none"
      style={{
        // Animation
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Lukk"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image container */}
        <div 
          className="relative max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            priority
          />
        </div>
      </div>
    </dialog>
  );
}
