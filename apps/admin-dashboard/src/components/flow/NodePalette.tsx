import React from 'react';
import {
  MessageSquare,
  HelpCircle,
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  Calendar,
} from 'lucide-react';

interface NodeTypeInfo {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const NODE_TYPES: NodeTypeInfo[] = [
  {
    type: 'message',
    label: 'Message',
    description: 'Static text; auto-advances',
    icon: <MessageSquare size={14} />,
    color: '#0088CC',
  },
  {
    type: 'question',
    label: 'Question',
    description: 'Free-text or choice; waits for reply',
    icon: <HelpCircle size={14} />,
    color: '#9C7A4A',
  },
  {
    type: 'service_picker',
    label: 'Service Picker',
    description: 'Lists active services; waits for choice',
    icon: <Briefcase size={14} />,
    color: '#12A36D',
  },
  {
    type: 'staff_picker',
    label: 'Staff Picker',
    description: 'Lists available staff; waits for choice',
    icon: <Users size={14} />,
    color: '#7C3AED',
  },
  {
    type: 'time_picker',
    label: 'Time Picker',
    description: 'Lists bookable slots; waits for choice',
    icon: <Clock size={14} />,
    color: '#E67E22',
  },
  {
    type: 'confirmation',
    label: 'Confirmation',
    description: 'Confirm/cancel buttons; waits for reply',
    icon: <CheckCircle size={14} />,
    color: '#2563EB',
  },
  {
    type: 'booking',
    label: 'Booking',
    description: 'Finalizes booking; terminal node',
    icon: <Calendar size={14} />,
    color: '#C62020',
  },
];

interface NodePaletteProps {
  className?: string;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ className = '' }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`w-[220px] bg-white border-r border-[#F0EFEE] flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-[#F0EFEE]">
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: '#A8A6B0' }}
        >
          Node Types
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {NODE_TYPES.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="flex items-start gap-2.5 p-2.5 rounded-salex-md border border-[#F0EFEE] cursor-grab active:cursor-grabbing hover:border-[#C9C7CF] hover:bg-[#FAFAF9] transition-all duration-150"
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${node.color}15`, color: node.color }}
            >
              {node.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: '#03031F' }}>
                {node.label}
              </p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#A8A6B0' }}>
                {node.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-[#F0EFEE]">
        <p className="text-[10px]" style={{ color: '#A8A6B0' }}>
          Drag nodes onto the canvas
        </p>
      </div>
    </div>
  );
};
