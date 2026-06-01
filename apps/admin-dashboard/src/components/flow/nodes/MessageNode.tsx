import React from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const MessageNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Message'}
      icon={<MessageSquare size={14} />}
      color="#0088CC"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'No message set'}
      </p>
    </BaseNode>
  );
};
