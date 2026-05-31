import React, { useRef, useCallback } from 'react';
import { VariablePicker } from '../VariablePicker';

interface MessageNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
  businessId?: string;
}

export const MessageNodeConfig: React.FC<MessageNodeConfigProps> = ({
  config,
  onConfigChange,
  businessId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (value: string) => {
    onConfigChange({ ...config, text: value });
  };

  // Insert variable at cursor position in the textarea
  const handleInsertVariable = useCallback((variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback: append to end
      const currentText = (config.text as string) || '';
      onConfigChange({ ...config, text: currentText + variable });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = (config.text as string) || '';

    // Insert at cursor position
    const newText = currentText.slice(0, start) + variable + currentText.slice(end);
    onConfigChange({ ...config, text: newText });

    // Restore cursor position after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [config, onConfigChange]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className="block font-sans font-semibold text-[12px] uppercase tracking-wide"
            style={{ color: '#6F6D7A' }}
          >
            Message Text
          </label>
          {businessId && (
            <VariablePicker
              businessId={businessId}
              onInsert={handleInsertVariable}
            />
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={(config.text as string) || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full font-sans text-[14px] rounded-salex-md px-3 py-2.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none resize-none transition-all duration-150"
          style={{ color: '#03031F' }}
          rows={5}
          placeholder="Enter message text..."
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Click <strong>Variables</strong> above to insert dynamic content like business name, service details, etc.
        </p>
      </div>
    </div>
  );
};
