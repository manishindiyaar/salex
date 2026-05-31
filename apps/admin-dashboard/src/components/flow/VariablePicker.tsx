import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Code2, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { adminFlowsApi, TemplateVariableGroup } from '@/api/adminFlows';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface VariablePickerProps {
  businessId: string;
  onInsert: (variable: string) => void;
}

// ─── Category display config ─────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  business: { label: 'Business', color: '#0077B5' },
  booking: { label: 'Booking', color: '#12A36D' },
  service: { label: 'Service', color: '#9C7A4A' },
  staff: { label: 'Staff', color: '#7B61FF' },
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * VariablePicker — a compact dropdown/popover for inserting template variables.
 *
 * Fetches variables from GET /api/v1/admin/businesses/:businessId/flow-context,
 * groups them by category, and calls onInsert('{{variable.key}}') when clicked.
 *
 * Requirements: 6.3, 4.2
 */
export const VariablePicker: React.FC<VariablePickerProps> = ({
  businessId,
  onInsert,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<TemplateVariableGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch variables on first open
  const fetchVariables = useCallback(async () => {
    if (groups.length > 0) return; // Already fetched
    setIsLoading(true);
    setError(null);
    try {
      const context = await adminFlowsApi.getContext(businessId);
      setGroups(context.templateVariables || []);
      // Expand all categories by default
      const allCategories = new Set(
        (context.templateVariables || []).map((g) => g.category)
      );
      setExpandedCategories(allCategories);
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || 'Failed to load variables';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, groups.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      fetchVariables();
    }
  };

  const handleInsert = (key: string) => {
    onInsert(key);
    setIsOpen(false);
    setSearch('');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter variables by search
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      variables: group.variables.filter(
        (v) =>
          v.key.toLowerCase().includes(search.toLowerCase()) ||
          v.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.variables.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-salex-sm text-[11px] font-medium transition-colors hover:bg-[#F5F3F1] border border-[#E8E6E3]"
        style={{ color: '#6F6D7A' }}
        title="Insert template variable"
      >
        <Code2 size={12} />
        <span>Variables</span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[260px] bg-white rounded-salex-md border border-[#E8E6E3] shadow-lg overflow-hidden">
          {/* Search Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F0EFEE]">
            <Search size={12} style={{ color: '#A8A6B0' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search variables…"
              className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-[#A8A6B0]"
              style={{ color: '#03031F' }}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-0.5 rounded hover:bg-[#F5F3F1]"
              >
                <X size={10} style={{ color: '#A8A6B0' }} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[280px] overflow-y-auto">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <span className="text-[11px]" style={{ color: '#A8A6B0' }}>
                  Loading variables…
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-3 py-4 text-center">
                <span className="text-[11px]" style={{ color: '#C62020' }}>
                  {error}
                </span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filteredGroups.length === 0 && (
              <div className="px-3 py-4 text-center">
                <span className="text-[11px]" style={{ color: '#A8A6B0' }}>
                  {search ? 'No matching variables' : 'No variables available'}
                </span>
              </div>
            )}

            {/* Variable Groups */}
            {!isLoading &&
              !error &&
              filteredGroups.map((group) => {
                const meta = CATEGORY_META[group.category] || {
                  label: group.category,
                  color: '#6F6D7A',
                };
                const isExpanded = expandedCategories.has(group.category);

                return (
                  <div key={group.category}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(group.category)}
                      className="flex items-center gap-1.5 w-full px-3 py-1.5 hover:bg-[#F5F3F1] transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={11} style={{ color: '#A8A6B0' }} />
                      ) : (
                        <ChevronRight size={11} style={{ color: '#A8A6B0' }} />
                      )}
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span
                        className="ml-auto text-[9px]"
                        style={{ color: '#A8A6B0' }}
                      >
                        {group.variables.length}
                      </span>
                    </button>

                    {/* Variables */}
                    {isExpanded && (
                      <div className="pb-1">
                        {group.variables.map((variable) => (
                          <button
                            key={variable.key}
                            onClick={() => handleInsert(variable.key)}
                            className="flex flex-col w-full px-3 py-1.5 pl-7 hover:bg-[#F5F3F1] transition-colors text-left"
                            title={`${variable.description}\nExample: ${variable.example}`}
                          >
                            <span
                              className="font-mono text-[11px]"
                              style={{ color: '#03031F' }}
                            >
                              {variable.key}
                            </span>
                            <span
                              className="text-[10px] leading-tight mt-0.5"
                              style={{ color: '#A8A6B0' }}
                            >
                              {variable.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
