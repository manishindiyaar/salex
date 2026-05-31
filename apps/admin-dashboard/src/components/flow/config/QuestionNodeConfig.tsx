import React, { useRef, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { VariablePicker } from '../VariablePicker';

interface StructuredChoice {
  id: string;
  title: string;
  description?: string;
}

interface QuestionNodeConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (newConfig: Record<string, unknown>) => void;
  businessId?: string;
}

const MAX_CHOICES = 10;

function normalizeChoices(raw: unknown): StructuredChoice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: item || `choice_${idx + 1}`, title: item, description: '' };
    }
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        id: (obj.id as string) || `choice_${idx + 1}`,
        title: (obj.title as string) || '',
        description: (obj.description as string) || '',
      };
    }
    return { id: `choice_${idx + 1}`, title: '', description: '' };
  });
}

function findDuplicateIds(choices: StructuredChoice[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const choice of choices) {
    if (choice.id && seen.has(choice.id)) {
      duplicates.add(choice.id);
    }
    seen.add(choice.id);
  }
  return duplicates;
}

export const QuestionNodeConfig: React.FC<QuestionNodeConfigProps> = ({
  config,
  onConfigChange,
  businessId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const choices = normalizeChoices(config.choices);
  const duplicateIds = findDuplicateIds(choices);

  const handleTextChange = (value: string) => {
    onConfigChange({ ...config, text: value });
  };

  // Insert variable at cursor position in the textarea
  const handleInsertVariable = useCallback((variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const currentText = (config.text as string) || '';
      onConfigChange({ ...config, text: currentText + variable });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = (config.text as string) || '';

    const newText = currentText.slice(0, start) + variable + currentText.slice(end);
    onConfigChange({ ...config, text: newText });

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [config, onConfigChange]);

  const handleChoiceChange = (
    index: number,
    field: keyof StructuredChoice,
    value: string
  ) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };
    onConfigChange({ ...config, choices: updated });
  };

  const handleAddChoice = () => {
    if (choices.length >= MAX_CHOICES) return;
    const newChoice: StructuredChoice = {
      id: `choice_${choices.length + 1}`,
      title: '',
      description: '',
    };
    onConfigChange({ ...config, choices: [...choices, newChoice] });
  };

  const handleRemoveChoice = (index: number) => {
    const updated = choices.filter((_, i) => i !== index);
    onConfigChange({ ...config, choices: updated });
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className="block font-sans font-semibold text-[12px] uppercase tracking-wide"
            style={{ color: '#6F6D7A' }}
          >
            Question Text
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
          rows={3}
          placeholder="Enter question text..."
        />
        <p className="mt-1 text-[10px]" style={{ color: '#A8A6B0' }}>
          Use {'{{variable}}'} for dynamic content. Variable picker coming soon.
        </p>
      </div>

      {/* Structured Choices */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            className="block font-sans font-semibold text-[12px] uppercase tracking-wide"
            style={{ color: '#6F6D7A' }}
          >
            Choices ({choices.length}/{MAX_CHOICES})
          </label>
          {choices.length < MAX_CHOICES && (
            <button
              onClick={handleAddChoice}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded hover:bg-[#F5F3F1] transition-colors"
              style={{ color: '#03031F' }}
            >
              <Plus size={12} />
              Add
            </button>
          )}
        </div>

        {duplicateIds.size > 0 && (
          <p className="text-[11px] text-[#C62020] mb-2">
            Duplicate IDs detected: {Array.from(duplicateIds).join(', ')}
          </p>
        )}

        <div className="space-y-3">
          {choices.map((choice, index) => (
            <div
              key={index}
              className="p-2.5 rounded-salex-md border border-[#F0EFEE] bg-[#FAFAF9]"
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className="text-[10px] font-mono uppercase"
                  style={{ color: '#A8A6B0' }}
                >
                  Choice {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveChoice(index)}
                  className="p-0.5 rounded hover:bg-[#C6202015] transition-colors"
                >
                  <Trash2 size={11} className="text-[#C62020]" />
                </button>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={choice.id}
                  onChange={(e) =>
                    handleChoiceChange(index, 'id', e.target.value)
                  }
                  className={`w-full font-sans text-[12px] rounded px-2 py-1.5 bg-white border focus:outline-none transition-all duration-150 ${
                    duplicateIds.has(choice.id)
                      ? 'border-[#C62020] focus:border-[#C62020]'
                      : 'border-[#C9C7CF] focus:border-[#03031F]'
                  }`}
                  style={{ color: '#03031F' }}
                  placeholder="ID (unique identifier)"
                  maxLength={256}
                />
                <input
                  type="text"
                  value={choice.title}
                  onChange={(e) =>
                    handleChoiceChange(index, 'title', e.target.value)
                  }
                  className="w-full font-sans text-[12px] rounded px-2 py-1.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
                  style={{ color: '#03031F' }}
                  placeholder="Title (display label, max 24 chars)"
                  maxLength={24}
                />
                <input
                  type="text"
                  value={choice.description || ''}
                  onChange={(e) =>
                    handleChoiceChange(index, 'description', e.target.value)
                  }
                  className="w-full font-sans text-[12px] rounded px-2 py-1.5 bg-white border border-[#C9C7CF] focus:border-[#03031F] focus:outline-none transition-all duration-150"
                  style={{ color: '#03031F' }}
                  placeholder="Description (optional, max 72 chars)"
                  maxLength={72}
                />
              </div>
            </div>
          ))}
        </div>

        {choices.length === 0 && (
          <button
            onClick={handleAddChoice}
            className="w-full py-3 border border-dashed border-[#C9C7CF] rounded-salex-md text-[12px] font-medium hover:bg-[#F5F3F1] transition-colors"
            style={{ color: '#6F6D7A' }}
          >
            + Add first choice
          </button>
        )}
      </div>
    </div>
  );
};
