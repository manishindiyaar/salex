import React from 'react';
import { NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const ConfirmationNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Confirmation'}
      icon={<CheckCircle size={14} />}
      color="#2563EB"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'Confirm/cancel buttons'}
      </p>
    </BaseNode>
  );
};
