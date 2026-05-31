import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const TimePickerNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Time Picker'}
      icon={<Clock size={14} />}
      color="#E67E22"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'Lists bookable slots'}
      </p>
    </BaseNode>
  );
};
