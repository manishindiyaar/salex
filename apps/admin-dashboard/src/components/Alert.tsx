import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  const typeStyles = {
    success: {
      bg: 'bg-salex-green bg-opacity-10',
      border: 'border-salex-green border-opacity-30',
      icon: CheckCircle,
      iconColor: 'text-salex-green',
    },
    error: {
      bg: 'bg-salex-red bg-opacity-10',
      border: 'border-salex-red border-opacity-30',
      icon: AlertCircle,
      iconColor: 'text-salex-red',
    },
    warning: {
      bg: 'bg-salex-amber bg-opacity-10',
      border: 'border-salex-amber border-opacity-30',
      icon: AlertTriangle,
      iconColor: 'text-salex-amber',
    },
    info: {
      bg: 'bg-salex-blue bg-opacity-10',
      border: 'border-salex-blue border-opacity-30',
      icon: Info,
      iconColor: 'text-salex-blue',
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-salex-md p-salex-lg flex items-start gap-salex-md ${className}`}
    >
      <Icon className={`${style.iconColor} flex-shrink-0 mt-salex-sm`} size={20} />
      <div className="flex-1">
        <h4 className="text-salex-sm font-salex-bold text-salex-white">{title}</h4>
        {message && <p className="text-salex-sm text-salex-secondary mt-salex-sm">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-salex-sm hover:bg-salex-black-lighter rounded-salex-md transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
