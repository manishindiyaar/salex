import React from 'react';

interface TimePickerNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const TimePickerNodeConfig: React.FC<TimePickerNodeConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const daysAhead = (config.daysAhead as number) ?? 7;
  const startHour = (config.startHour as number) ?? 9;
  const endHour = (config.endHour as number) ?? 17;
  const durationMinutes =
    (config.durationMinutes as number) ?? (config.slotDuration as number) ?? 30;
  const maxSlots = (config.maxSlots as number) ?? 5;

  const handleNumberChange = (
    field: string,
    value: string,
    min: number,
    max: number
  ) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    onConfigChange({ ...config, [field]: clamp(num, min, max) });
  };

  return (
    <div className="space-y-4">
      {/* Days Ahead */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Days Ahead
        </label>
        <input
          type="number"
          value={daysAhead}
          onChange={(e) => handleNumberChange('daysAhead', e.target.value, 1, 14)}
          min={1}
          max={14}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          How many days into the future to show slots (1–14)
        </p>
      </div>

      {/* Start Hour */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Start Hour
        </label>
        <input
          type="number"
          value={startHour}
          onChange={(e) => handleNumberChange('startHour', e.target.value, 0, 23)}
          min={0}
          max={23}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Earliest hour for available slots (0–23)
        </p>
      </div>

      {/* End Hour */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          End Hour
        </label>
        <input
          type="number"
          value={endHour}
          onChange={(e) => handleNumberChange('endHour', e.target.value, 0, 23)}
          min={0}
          max={23}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Latest hour for available slots (0–23, must be greater than start hour)
        </p>
      </div>

      {/* Slot Duration */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Slot Duration (minutes)
        </label>
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) =>
            handleNumberChange('durationMinutes', e.target.value, 15, 480)
          }
          min={15}
          max={480}
          step={5}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Duration of each time slot in minutes (15–480)
        </p>
      </div>

      {/* Max Slots */}
      <div>
        <label
          className="block font-sans font-semibold text-[12px] mb-1.5 uppercase tracking-wide"
          style={{ color: '#6F6D7A' }}
        >
          Max Slots to Display
        </label>
        <input
          type="number"
          value={maxSlots}
          onChange={(e) => handleNumberChange('maxSlots', e.target.value, 1, 10)}
          min={1}
          max={10}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
          style={{ color: '#03031F' }}
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Maximum number of time slots shown to the customer (1–10)
        </p>
      </div>
    </div>
  );
};
