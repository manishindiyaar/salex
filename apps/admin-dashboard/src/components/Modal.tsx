import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-salex-black-light border border-salex-gray-border rounded-salex-lg w-full mx-salex-lg ${sizeStyles[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-salex-lg border-b border-salex-gray-border">
          <h3 className="text-salex-lg font-salex-bold text-salex-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-salex-sm hover:bg-salex-black-lighter rounded-salex-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-salex-lg max-h-96 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-salex-lg border-t border-salex-gray-border flex items-center justify-end gap-salex-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
