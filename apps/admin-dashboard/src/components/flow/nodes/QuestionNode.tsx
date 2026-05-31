import React from 'react';
import { NodeProps } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';
import { BaseNode } from './BaseNode';

export const QuestionNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <BaseNode
      label={data.label as string || 'Question'}
      icon={<HelpCircle size={14} />}
      color="#9C7A4A"
      selected={selected}
    >
      <p className="text-[11px] text-[#6F6D7A] truncate">
        {(data.config as any)?.text || 'No question set'}
      </p>
    </BaseNode>
  );
};
