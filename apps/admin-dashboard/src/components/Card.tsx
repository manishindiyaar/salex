import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable,
}) => {
  const isClickable = !!onClick || hoverable;
  return (
    <div
      className={`bg-white rounded-salex-lg border border-[#E5E4E3] ${
        isClickable
          ? 'cursor-pointer card-hover hover:border-[#03031F]/20'
          : ''
      } ${className}`}
      style={{
        boxShadow: '0 1px 3px rgba(3,3,31,0.05)',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ── CardHeader ───────────────────────────────────────────────────────────────
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex items-start justify-between px-5 py-4 border-b border-[#E5E4E3] ${className}`}
    >
      <div>
        <h3
          className="font-sans font-semibold text-[15px] leading-tight"
          style={{ color: '#03031F' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: '#A8A6B0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// ── CardBody ─────────────────────────────────────────────────────────────────
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`${noPadding ? '' : 'px-5 py-4'} ${className}`}>
      {children}
    </div>
  );
};

// ── CardFooter ────────────────────────────────────────────────────────────────
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`px-5 py-3 border-t border-[#E5E4E3] flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
};

// ── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive?: boolean };
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  accentColor = '#12A36D',
}) => {
  return (
    <div
      className="bg-white rounded-salex-lg border border-[#E5E4E3] p-5 card-hover"
      style={{ boxShadow: '0 1px 3px rgba(3,3,31,0.05)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-bold"
            style={{ color: '#A8A6B0' }}
          >
            {label}
          </p>
          <p
            className="mt-2 font-sans font-bold text-[28px] leading-none tracking-tight"
            style={{ color: '#03031F' }}
          >
            {value}
          </p>
          {subtext && (
            <p className="mt-1.5 text-[12px]" style={{ color: '#A8A6B0' }}>
              {subtext}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color: trend.positive !== false ? '#12A36D' : '#C62020' }}
              >
                {trend.positive !== false ? '+' : ''}{trend.value}%
              </span>
              <span className="text-[11px]" style={{ color: '#A8A6B0' }}>
                vs last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-10 h-10 rounded-salex-md flex items-center justify-center flex-shrink-0 ml-3"
            style={{ background: `${accentColor}14`, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="mt-4 h-0.5 rounded-full"
        style={{ background: `${accentColor}30` }}
      />
    </div>
  );
};
