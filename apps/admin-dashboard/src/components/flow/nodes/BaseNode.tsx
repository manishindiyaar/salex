import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface BaseNodeProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  selected?: boolean;
  children?: React.ReactNode;
  hasInput?: boolean;
  hasOutput?: boolean;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  label,
  icon,
  color,
  selected,
  children,
  hasInput = true,
  hasOutput = true,
}) => {
  return (
    <div
      className="rounded-salex-md border bg-white shadow-sm min-w-[180px] transition-all duration-150"
      style={{
        borderColor: selected ? color : '#C9C7CF',
        boxShadow: selected ? `0 0 0 2px ${color}33` : undefined,
      }}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !border-2 !border-white !bg-[#6F6D7A]"
        />
      )}

      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: '#F0EFEE' }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
        <span
          className="text-[12px] font-semibold truncate"
          style={{ color: '#03031F' }}
        >
          {label}
        </span>
      </div>

      {children && (
        <div className="px-3 py-2">
          {children}
        </div>
      )}

      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !border-2 !border-white !bg-[#6F6D7A]"
        />
      )}
    </div>
  );
};
