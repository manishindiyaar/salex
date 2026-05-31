import React from 'react';
import { Node } from '@xyflow/react';
import { X, Trash2 } from 'lucide-react';
import {
  MessageNodeConfig,
  QuestionNodeConfig,
  ServicePickerNodeConfig,
  StaffPickerNodeConfig,
  TimePickerNodeConfig,
  ConfirmationNodeConfig,
  BookingNodeConfig,
} from './config';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
  businessId?: string;
}

const NODE_TYPE_LABELS: Record<string, string> = {
  message: 'Message',
  question: 'Question',
  service_picker: 'Service Picker',
  staff_picker: 'Staff Picker',
  time_picker: 'Time Picker',
  confirmation: 'Confirmation',
  booking: 'Booking',
};

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onClose,
  businessId,
}) => {
  const config = (node.data.config as Record<string, unknown>) || {};

  const handleLabelChange = (value: string) => {
    onUpdate(node.id, {
      ...node.data,
      label: value,
    });
  };

  const handleConfigChange = (newConfig: Record<string, unknown>) => {
    onUpdate(node.id, {
      ...node.data,
      config: newConfig,
    });
  };

  const renderTypeConfig = () => {
    const nodeType = node.type as string;

    switch (nodeType) {
      case 'message':
        return (
          <MessageNodeConfig config={config} onConfigChange={handleConfigChange} businessId={businessId} />
        );
      case 'question':
        return (
          <QuestionNodeConfig config={config} onConfigChange={handleConfigChange} businessId={businessId} />
        );
      case 'service_picker':
        return (
          <ServicePickerNodeConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'staff_picker':
        return (
          <StaffPickerNodeConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'time_picker':
        return (
          <TimePickerNodeConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationNodeConfig
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'booking':
        return (
          <BookingNodeConfig config={config} onConfigChange={handleConfigChange} />
        );
      default:
        return (
          <p className="text-[12px]" style={{ color: '#A8A6B0' }}>
            No configuration available for this node type.
          </p>
        );
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
          Configure Node
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
        {/* Node Label */}
        <div>
          <label
            className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
            style={{ color: '#6F6D7A' }}
          >
            Label
          </label>
          <input
            type="text"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
            style={{ color: '#03031F' }}
            placeholder="Node label"
          />
        </div>

        {/* Node Type (read-only) */}
        <div>
          <label
            className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
            style={{ color: '#6F6D7A' }}
          >
            Type
          </label>
          <div
            className="font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-[#F5F3F1] border border-[#F0EFEE]"
            style={{ color: '#6F6D7A' }}
          >
            {NODE_TYPE_LABELS[node.type as string] || node.type}
          </div>
        </div>

        {/* Entry Node indicator */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isEntry"
            checked={!!(node.data.isEntry)}
            onChange={(e) =>
              onUpdate(node.id, { ...node.data, isEntry: e.target.checked })
            }
            className="rounded border-[#C9C7CF]"
          />
          <label
            htmlFor="isEntry"
            className="text-[12px] font-medium"
            style={{ color: '#6F6D7A' }}
          >
            Entry node (flow starts here)
          </label>
        </div>

        {/* Divider */}
        <div className="border-t border-[#F0EFEE]" />

        {/* Type-specific configuration */}
        {renderTypeConfig()}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#F0EFEE]">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-salex-md text-[12px] font-semibold text-[#C62020] bg-[#C6202008] hover:bg-[#C6202015] transition-colors"
        >
          <Trash2 size={12} />
          Delete Node
        </button>
      </div>
    </div>
  );
};
