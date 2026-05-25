import React from 'react';

// ── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'muted';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: 'rgba(18, 163, 109, 0.12)', text: '#0E8558',   dot: '#12A36D' },
  warning: { bg: 'rgba(156, 122, 74, 0.12)', text: '#7D5F2F',   dot: '#9C7A4A' },
  error:   { bg: 'rgba(198, 32, 32, 0.12)',  text: '#C62020',   dot: '#C62020' },
  info:    { bg: 'rgba(0, 136, 204, 0.12)',  text: '#0077B5',   dot: '#0088CC' },
  default: { bg: '#F5F3F1',                  text: '#03031F',   dot: '#6F6D7A' },
  muted:   { bg: '#F5F3F1',                  text: '#6F6D7A',   dot: '#A8A6B0' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const style = BADGE_STYLES[variant] ?? BADGE_STYLES.default;

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`badge-pill ${sizeClass} ${className}`}
      style={{
        background: style.bg,
        color: style.text,
      }}
    >
      {dot && (
        <span
          className="status-dot"
          style={{ background: style.dot }}
        />
      )}
      {label}
    </span>
  );
};
