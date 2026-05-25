import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

const ALERT_STYLES = {
  success: {
    bg: 'rgba(18, 163, 109, 0.08)',
    border: 'rgba(18, 163, 109, 0.25)',
    icon: CheckCircle,
    iconColor: '#12A36D',
    titleColor: '#03031F',
  },
  error: {
    bg: 'rgba(198, 32, 32, 0.08)',
    border: 'rgba(198, 32, 32, 0.25)',
    icon: AlertCircle,
    iconColor: '#C62020',
    titleColor: '#03031F',
  },
  warning: {
    bg: 'rgba(156, 122, 74, 0.08)',
    border: 'rgba(156, 122, 74, 0.25)',
    icon: AlertTriangle,
    iconColor: '#9C7A4A',
    titleColor: '#03031F',
  },
  info: {
    bg: 'rgba(0, 136, 204, 0.08)',
    border: 'rgba(0, 136, 204, 0.25)',
    icon: Info,
    iconColor: '#0088CC',
    titleColor: '#03031F',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  const s = ALERT_STYLES[type];
  const Icon = s.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-salex-md border ${className}`}
      style={{
        background: s.bg,
        borderColor: s.border,
      }}
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: s.iconColor }} />

      <div className="flex-1 min-w-0">
        <p
          className="font-sans font-semibold text-[13px] leading-snug"
          style={{ color: s.titleColor }}
        >
          {title}
        </p>
        {message && (
          <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: '#6F6D7A' }}>
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 transition-colors"
          style={{ color: '#6F6D7A' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};
