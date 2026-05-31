import React from 'react';
import { Info } from 'lucide-react';

interface ServicePickerNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
}

export const ServicePickerNodeConfig: React.FC<ServicePickerNodeConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleFieldChange = (field: string, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Read-only info about dynamic services */}
      <div className="flex items-start gap-2 p-2.5 rounded-salex-md bg-[#F5F3F1] border border-[#F0EFEE]">
        <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#6F6D7A' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: '#6F6D7A' }}>
          Services are loaded dynamically from the business database at runtime.
          Configure how the service list is presented to customers.
        </p>
      </div>

      {/* Header Template */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Header Text
        </label>
        <input
          type="text"
          value={(config.header as string) || (config.headerTemplate as string) || ''}
          onChange={(e) => handleFieldChange('header', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="📋 {{business.name}}"
        />
      </div>

      {/* Body Template */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Body Text
        </label>
        <textarea
          value={(config.body as string) || (config.bodyTemplate as string) || ''}
          onChange={(e) => handleFieldChange('body', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none resize-none transition-all duration-150"
          style={{ color: '#03031F' }}
          rows={2}
          placeholder="Select a service to book:"
        />
      </div>

      {/* Button Template */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          List Button Label
        </label>
        <input
          type="text"
          value={(config.buttonLabel as string) || (config.buttonTemplate as string) || ''}
          onChange={(e) => handleFieldChange('buttonLabel', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="View Services"
        />
      </div>

      {/* Empty Text */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          No Services Message
        </label>
        <textarea
          value={(config.noServicesMessage as string) || (config.emptyText as string) || ''}
          onChange={(e) => handleFieldChange('noServicesMessage', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none resize-none transition-all duration-150"
          style={{ color: '#03031F' }}
          rows={2}
          placeholder="😔 No services available at the moment."
        />
      </div>
    </div>
  );
};
