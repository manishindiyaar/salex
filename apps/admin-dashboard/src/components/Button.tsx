import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-salex-bold rounded-salex-md transition-colors duration-200 flex items-center justify-center gap-2';

  const variantStyles = {
    primary: 'bg-salex-green text-salex-black hover:bg-salex-green-dark disabled:bg-salex-gray-darker',
    secondary: 'bg-salex-gray-variant text-salex-white border border-salex-gray-border hover:bg-salex-black-lighter disabled:bg-salex-gray-darker',
    danger: 'bg-salex-red text-salex-white hover:bg-salex-red disabled:bg-salex-gray-darker',
    ghost: 'text-salex-green hover:bg-salex-gray-variant disabled:text-salex-gray-darker',
  };

  const sizeStyles = {
    sm: 'px-salex-md py-salex-sm text-salex-sm min-h-touch',
    md: 'px-salex-lg py-salex-md text-salex-base min-h-touch',
    lg: 'px-salex-xl py-salex-lg text-salex-lg min-h-touch',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
