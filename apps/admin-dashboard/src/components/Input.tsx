import React from 'react';

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#A8A6B0' }}
          >
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full font-sans text-[14px] rounded-salex-md
            border transition-all duration-150
            ${leftIcon ? 'pl-9' : 'px-3'}
            ${rightIcon ? 'pr-9' : 'px-3'}
            py-2.5 bg-white
            ${error
              ? 'border-[#C62020] focus:border-[#C62020] focus:shadow-none focus:ring-0'
              : 'border-[#C9C7CF] focus:border-[#03031F]'
            }
            focus:outline-none
            placeholder-[#A8A6B0]
            disabled:bg-[#F5F3F1] disabled:text-[#A8A6B0] disabled:cursor-not-allowed
            ${className}
          `}
          style={{
            color: '#03031F',
            boxShadow: error
              ? '0 0 0 3px rgba(198,32,32,0.08)'
              : undefined,
          }}
          {...props}
        />

        {rightIcon && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: '#A8A6B0' }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-[11px] font-medium" style={{ color: '#C62020' }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-[11px]" style={{ color: '#A8A6B0' }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// ── Select ──────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white
          border transition-all duration-150
          ${error
            ? 'border-[#C62020]'
            : 'border-[#C9C7CF] focus:border-[#03031F]'
          }
          focus:outline-none cursor-pointer
          disabled:bg-[#F5F3F1] disabled:cursor-not-allowed
          ${className}
        `}
        style={{ color: '#03031F' }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-[11px] font-medium" style={{ color: '#C62020' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// ── TextArea ────────────────────────────────────────────────────────────────
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const areaId = id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={areaId}
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={`
          w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white resize-none
          border transition-all duration-150
          ${error
            ? 'border-[#C62020]'
            : 'border-[#C9C7CF] focus:border-[#03031F]'
          }
          focus:outline-none
          placeholder-[#A8A6B0]
          ${className}
        `}
        style={{ color: '#03031F' }}
        rows={3}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium" style={{ color: '#C62020' }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-[11px]" style={{ color: '#A8A6B0' }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
