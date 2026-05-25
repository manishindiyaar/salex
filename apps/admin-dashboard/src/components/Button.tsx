import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-salex-md transition-all duration-150 select-none whitespace-nowrap';

  const variants: Record<string, string> = {
    primary:
      'bg-[#03031F] text-white hover:bg-[#1a1a3a] active:scale-[0.98] disabled:bg-[#C9C7CF] disabled:cursor-not-allowed',
    secondary:
      'bg-white text-[#03031F] border border-[#C9C7CF] hover:border-[#03031F] hover:bg-[#F5F3F1] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'bg-[#C62020] text-white hover:bg-[#a81a1a] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost:
      'bg-transparent text-[#6F6D7A] hover:bg-[#F5F3F1] hover:text-[#03031F] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
    outline:
      'bg-transparent text-[#12A36D] border border-[#12A36D] hover:bg-[rgba(18,163,109,0.08)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
  };

  const sizes: Record<string, string> = {
    xs: 'px-2.5 py-1.5 text-[11px] min-h-[32px]',
    sm: 'px-3 py-2 text-[13px] min-h-[36px]',
    md: 'px-4 py-2.5 text-[14px] min-h-[40px]',
    lg: 'px-6 py-3 text-[15px] min-h-[48px]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          className="spinner"
          style={{ width: 14, height: 14 }}
        />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
