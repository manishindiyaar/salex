import React from 'react';

interface ConfirmationNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
}

export const ConfirmationNodeConfig: React.FC<ConfirmationNodeConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleFieldChange = (field: string, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Header Text
        </label>
        <input
          type="text"
          value={(config.header as string) || ''}
          onChange={(e) => handleFieldChange('header', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="✅ Confirm Booking"
        />
      </div>

      {/* Confirm Label */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Confirm Button Label
        </label>
        <input
          type="text"
          value={(config.confirmLabel as string) || ''}
          onChange={(e) => handleFieldChange('confirmLabel', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="✅ Confirm"
        />
      </div>

      {/* Cancel Label */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Cancel Button Label
        </label>
        <input
          type="text"
          value={(config.cancelLabel as string) || ''}
          onChange={(e) => handleFieldChange('cancelLabel', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
          placeholder="❌ Cancel"
        />
      </div>

      {/* Summary Text (the `text` field used by the confirmation handler) */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Summary Text
        </label>
        <textarea
          value={(config.text as string) || ''}
          onChange={(e) => handleFieldChange('text', e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none resize-none transition-all duration-150"
          style={{ color: '#03031F' }}
          rows={5}
          placeholder="📍 {{business.name}}&#10;🧴 {{selectedService.name}}&#10;⏰ {{selectedTime}}&#10;💰 ₹{{selectedService.price}}&#10;&#10;Confirm your booking?"
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Shown to the customer before confirmation. Use {'{{variable}}'} for dynamic content.
          Leave empty to auto-generate from booking context.
        </p>
      </div>
    </div>
  );
};
