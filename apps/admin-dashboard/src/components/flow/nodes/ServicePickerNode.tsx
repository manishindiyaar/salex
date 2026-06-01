import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Briefcase } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const ServicePickerNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Service Picker'}
      icon={<Briefcase size={14} />}
      color="#12A36D"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'Lists active services'}
      </p>
    </BaseNode>
  );
};
