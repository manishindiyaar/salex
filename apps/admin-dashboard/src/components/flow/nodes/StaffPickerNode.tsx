import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Users } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const StaffPickerNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Staff Picker'}
      icon={<Users size={14} />}
      color="#7C3AED"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'Lists available staff'}
      </p>
    </BaseNode>
  );
};
