import React from 'react';
import { Edge } from '@xyflow/react';
import { X } from 'lucide-react';
import { EdgeCondition } from '@/api/flows';

interface EdgeConditionEditorProps {
  edge: Edge;
  onUpdate: (edgeId: string, condition: EdgeCondition | undefined) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

const OPERATORS: { value: EdgeCondition['operator']; label: string }[] = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
];

export const EdgeConditionEditor: React.FC<EdgeConditionEditorProps> = ({
  edge,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const condition = (edge.data?.condition as EdgeCondition) || undefined;
  const hasCondition = !!condition;

  const handleToggleCondition = (enabled: boolean) => {
    if (enabled) {
      onUpdate(edge.id, { field: '', operator: 'eq', value: '' });
    } else {
      onUpdate(edge.id, undefined);
    }
  };

  const handleFieldChange = (field: string) => {
    if (condition) {
      onUpdate(edge.id, { ...condition, field });
    }
  };

  const handleOperatorChange = (operator: EdgeCondition['operator']) => {
    if (condition) {
      onUpdate(edge.id, { ...condition, operator });
    }
  };

  const handleValueChange = (value: string) => {
    if (condition) {
      onUpdate(edge.id, { ...condition, value });
    }
  };

  return (
    <div className="w-[280px] bg-white border-l border-[#F0EFEE] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EFEE]">
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: '#A8A6B0' }}
        >
          Edge Condition
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#F5F3F1] transition-colors"
        >
          <X size={14} style={{ color: '#6F6D7A' }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Edge info */}
        <div className="p-2.5 rounded-salex-md bg-[#F5F3F1]">
          <p className="text-[11px]" style={{ color: '#6F6D7A' }}>
            <span className="font-semibold">From:</span> {edge.source}
          </p>
          <p className="text-[11px] mt-1" style={{ color: '#6F6D7A' }}>
            <span className="font-semibold">To:</span> {edge.target}
          </p>
        </div>

        {/* Toggle condition */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasCondition"
            checked={hasCondition}
            onChange={(e) => handleToggleCondition(e.target.checked)}
            className="rounded border-[#C9C7CF]"
          />
          <label
            htmlFor="hasCondition"
            className="text-[12px] font-medium"
            style={{ color: '#6F6D7A' }}
          >
            Conditional edge
          </label>
        </div>

        {hasCondition && (
          <>
            {/* Field */}
            <div>
              <label
                className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
                style={{ color: '#6F6D7A' }}
              >
                Field
              </label>
              <input
                type="text"
                value={condition.field}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
                style={{ color: '#03031F' }}
                placeholder="e.g. reply, selection"
              />
            </div>

            {/* Operator */}
            <div>
              <label
                className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
                style={{ color: '#6F6D7A' }}
              >
                Operator
              </label>
              <select
                value={condition.operator}
                onChange={(e) =>
                  handleOperatorChange(e.target.value as EdgeCondition['operator'])
                }
                className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none cursor-pointer transition-all duration-150"
                style={{ color: '#03031F' }}
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label
                className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
                style={{ color: '#6F6D7A' }}
              >
                Value
              </label>
              <input
                type="text"
                value={condition.value as string}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
                style={{ color: '#03031F' }}
                placeholder="Expected value"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#F0EFEE]">
        <button
          onClick={() => onDelete(edge.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-salex-md text-[12px] font-semibold text-[#C62020] bg-[#C6202008] hover:bg-[#C6202015] transition-colors"
        >
          Delete Edge
        </button>
      </div>
    </div>
  );
};
