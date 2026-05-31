import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Calendar } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const BookingNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Booking'}
      icon={<Calendar size={14} />}
      color="#C62020"
      selected={selected}
      hasOutput={false}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'Finalizes booking (terminal)'}
      </p>
    </BaseNode>
  );
};
