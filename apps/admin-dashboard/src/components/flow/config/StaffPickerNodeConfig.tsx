import React from 'react';
import { Info } from 'lucide-react';

interface StaffPickerNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
}

export const StaffPickerNodeConfig: React.FC<StaffPickerNodeConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleFieldChange = (field: string, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Read-only info about dynamic staff */}
      <div className="flex items-start gap-2 p-2.5 rounded-salex-md bg-[#F5F3F1] border border-[#F0EFEE]">
        <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#6F6D7A' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: '#6F6D7A' }}>
          Staff members are loaded dynamically from the business database at runtime.
        </p>
      </div>

      {/* Prompt Text */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Prompt Text
        </label>
        <textarea
          value={(config.promptText as string) || ''}
          onChange={(e) => handleFieldChange('promptText', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none resize-none transition-all duration-150"
          style={{ color: '#03031F' }}
          rows={2}
          placeholder="Would you like to choose a specific staff member?"
        />
      </div>

      {/* Header Text */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Header Text
        </label>
        <input
          type="text"
          value={(config.headerText as string) || ''}
          onChange={(e) => handleFieldChange('headerText', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="Select Staff"
        />
      </div>

      {/* Footer Text */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Footer Text
        </label>
        <input
          type="text"
          value={(config.footerText as string) || ''}
          onChange={(e) => handleFieldChange('footerText', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="Choose any available staff member"
        />
      </div>

      {/* Button Label */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          List Button Label
        </label>
        <input
          type="text"
          value={(config.buttonLabel as string) || ''}
          onChange={(e) => handleFieldChange('buttonLabel', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="View Staff"
        />
      </div>

      {/* Empty Message */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          No Staff Message
        </label>
        <input
          type="text"
          value={(config.emptyMessage as string) || ''}
          onChange={(e) => handleFieldChange('emptyMessage', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="No staff members are currently available"
        />
      </div>
    </div>
  );
};
