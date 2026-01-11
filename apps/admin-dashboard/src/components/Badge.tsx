import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-salex-green bg-opacity-20 text-salex-green border border-salex-green border-opacity-30',
    warning: 'bg-salex-amber bg-opacity-20 text-salex-amber border border-salex-amber border-opacity-30',
    error: 'bg-salex-red bg-opacity-20 text-salex-red border border-salex-red border-opacity-30',
    info: 'bg-salex-blue bg-opacity-20 text-salex-blue border border-salex-blue border-opacity-30',
    default: 'bg-salex-gray-variant text-salex-secondary border border-salex-gray-border',
  };

  const sizeStyles = {
    sm: 'px-salex-sm py-salex-xs text-salex-xs font-salex-medium rounded-salex-sm',
    md: 'px-salex-md py-salex-sm text-salex-sm font-salex-medium rounded-salex-md',
  };

  return (
    <span className={`inline-block ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {label}
    </span>
  );
};
