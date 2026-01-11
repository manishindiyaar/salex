import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-sm">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-salex-black-light border rounded-salex-md px-salex-md py-salex-md text-salex-base text-salex-white placeholder-salex-gray-dark transition-colors ${
          error ? 'border-salex-red focus:border-salex-red' : 'border-salex-gray-border focus:border-salex-green'
        } focus:outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-salex-xs text-salex-red mt-salex-sm">{error}</p>}
      {helperText && !error && (
        <p className="text-salex-xs text-salex-secondary mt-salex-sm">{helperText}</p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-sm">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-salex-black-light border rounded-salex-md px-salex-md py-salex-md text-salex-base text-salex-white transition-colors ${
          error ? 'border-salex-red focus:border-salex-red' : 'border-salex-gray-border focus:border-salex-green'
        } focus:outline-none ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-salex-xs text-salex-red mt-salex-sm">{error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-sm">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-salex-black-light border rounded-salex-md px-salex-md py-salex-md text-salex-base text-salex-white placeholder-salex-gray-dark transition-colors ${
          error ? 'border-salex-red focus:border-salex-red' : 'border-salex-gray-border focus:border-salex-green'
        } focus:outline-none resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-salex-xs text-salex-red mt-salex-sm">{error}</p>}
    </div>
  );
};
