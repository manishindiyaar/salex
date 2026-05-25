import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(3, 3, 31, 0.45)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-salex-xl w-full ${sizeClasses[size]} animate-scale-in overflow-hidden`}
        style={{
          border: '1px solid #E5E4E3',
          boxShadow: '0 20px 60px rgba(3, 3, 31, 0.18)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 border-b"
          style={{ borderColor: '#E5E4E3' }}
        >
          <div>
            <h3
              className="font-serif text-[20px] leading-tight"
              style={{ color: '#03031F', fontWeight: 400 }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-[12px]" style={{ color: '#A8A6B0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded-salex-md hover:bg-[#F5F3F1] transition-colors flex-shrink-0"
            style={{ color: '#A8A6B0' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: '#E5E4E3', background: '#FAFAF9' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
