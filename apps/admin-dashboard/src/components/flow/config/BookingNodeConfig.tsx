import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BookingNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
}

export const BookingNodeConfig: React.FC<BookingNodeConfigProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: _config,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConfigChange: _onConfigChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 p-4 rounded-salex-md bg-[#F5F3F1] border border-[#F0EFEE]">
        <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
        <div className="text-center">
          <p
            className="font-sans font-semibold text-[13px] mb-1"
            style={{ color: '#03031F' }}
          >
            Terminal Node
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: '#6F6D7A' }}>
            This node finalizes the booking using the context accumulated by prior
            nodes (selected service, time, and optional staff). No additional
            configuration is needed.
          </p>
        </div>
      </div>

      <div className="p-2.5 rounded-salex-md border border-[#F0EFEE]">
        <p
          className="font-sans font-semibold text-[11px] mb-1 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Context Used
        </p>
        <ul className="space-y-1">
          {[
            'selectedService (from service_picker)',
            'selectedTime (from time_picker)',
            'selectedStaff (from staff_picker, optional)',
            'bookingIntentId (from confirmation)',
          ].map((item) => (
            <li
              key={item}
              className="text-[11px] font-mono"
              style={{ color: '#A8A6B0' }}
            >
              • {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
