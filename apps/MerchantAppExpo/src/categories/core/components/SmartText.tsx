/**
 * SmartText Component
 * 
 * A dynamic text component that automatically adapts terminology based on the current
 * business category context. Supports pluralization, context-specific variations,
 * text transformations, and fallback handling.
 */

import React, { useMemo } from 'react';
import { Text, TextProps } from 'react-native';
import { SmartTextProps } from '../types';
import { useTerminology, useHasCategoryContext } from '../context';

/**
 * SmartText Component
 * 
 * Renders text that automatically adapts based on category context.
 * Falls back gracefully when category context is not available.
 */
export const SmartText: React.FC<SmartTextProps & TextProps> = ({
  termKey,
  context,
  fallback,
  transform = 'none',
  plural = false,
  style,
  children,
  ...textProps
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { getTerm, getPluralTerm, hasTerminology } = useTerminology();

  // Memoize the resolved text to prevent unnecessary re-computations
  const resolvedText = useMemo(() => {
    // If no category context is available, use fallback or termKey
    if (!hasCategoryContext || !hasTerminology) {
      const baseText = fallback || termKey;
      return applyTextTransform(baseText, transform, plural);
    }

    try {
      // Get the appropriate term based on plural flag
      const term = plural ? getPluralTerm(termKey, context) : getTerm(termKey, context);
      
      // Apply text transformation
      return applyTextTransform(term, transform, plural);
    } catch (error) {
      console.warn(`⚠️ SmartText failed to resolve term '${termKey}':`, error);
      
      // Fallback to provided fallback or termKey
      const baseText = fallback || termKey;
      return applyTextTransform(baseText, transform, plural);
    }
  }, [
    termKey,
    context,
    fallback,
    transform,
    plural,
    hasCategoryContext,
    hasTerminology,
    getTerm,
    getPluralTerm,
  ]);

  return (
    <Text style={style} {...textProps}>
      {resolvedText}
      {children}
    </Text>
  );
};

/**
 * SmartTextSpan Component
 * 
 * A variant that returns just the text string without wrapping in a Text component.
 * Useful for composing text within other components.
 */
export const SmartTextSpan: React.FC<Omit<SmartTextProps, 'style' | 'children'>> = ({
  termKey,
  context,
  fallback,
  transform = 'none',
  plural = false,
}) => {
  const hasCategoryContext = useHasCategoryContext();
  const { getTerm, getPluralTerm, hasTerminology } = useTerminology();

  return useMemo(() => {
    // If no category context is available, use fallback or termKey
    if (!hasCategoryContext || !hasTerminology) {
      const baseText = fallback || termKey;
      return applyTextTransform(baseText, transform, plural);
    }

    try {
      // Get the appropriate term based on plural flag
      const term = plural ? getPluralTerm(termKey, context) : getTerm(termKey, context);
      
      // Apply text transformation
      return applyTextTransform(term, transform, plural);
    } catch (error) {
      console.warn(`⚠️ SmartTextSpan failed to resolve term '${termKey}':`, error);
      
      // Fallback to provided fallback or termKey
      const baseText = fallback || termKey;
      return applyTextTransform(baseText, transform, plural);
    }
  }, [
    termKey,
    context,
    fallback,
    transform,
    plural,
    hasCategoryContext,
    hasTerminology,
    getTerm,
    getPluralTerm,
  ]);
};

/**
 * SmartLabel Component
 * 
 * A specialized SmartText for form labels and UI labels.
 * Automatically capitalizes the first letter and handles common label patterns.
 */
export const SmartLabel: React.FC<SmartTextProps & TextProps> = ({
  termKey,
  context,
  fallback,
  transform = 'capitalize',
  plural = false,
  style,
  children,
  ...textProps
}) => {
  return (
    <SmartText
      termKey={termKey}
      context={context}
      fallback={fallback}
      transform={transform}
      plural={plural}
      style={style}
      {...textProps}
    >
      {children}
    </SmartText>
  );
};

/**
 * SmartPlural Component
 * 
 * A specialized SmartText that automatically handles pluralization based on count.
 */
export const SmartPlural: React.FC<
  Omit<SmartTextProps, 'plural'> & 
  TextProps & 
  { count: number; showCount?: boolean }
> = ({
  termKey,
  context,
  fallback,
  transform = 'none',
  count,
  showCount = false,
  style,
  children,
  ...textProps
}) => {
  const plural = count !== 1;
  const displayText = showCount ? `${count} ` : '';

  return (
    <SmartText
      termKey={termKey}
      context={context}
      fallback={fallback}
      transform={transform}
      plural={plural}
      style={style}
      {...textProps}
    >
      {displayText}
      {children}
    </SmartText>
  );
};

/**
 * SmartAction Component
 * 
 * A specialized SmartText for action buttons and links.
 * Handles action-specific terminology like "Book", "Schedule", "Reserve".
 */
export const SmartAction: React.FC<
  Omit<SmartTextProps, 'termKey'> & 
  TextProps & 
  { 
    action: 'book' | 'schedule' | 'reserve' | 'create' | 'update' | 'delete' | 'cancel' | 'complete';
    entity?: string;
  }
> = ({
  action,
  entity,
  context,
  fallback,
  transform = 'capitalize',
  style,
  children,
  ...textProps
}) => {
  // Construct the term key based on action and entity
  const termKey = entity ? `${action}_${entity}` : action;
  const actionFallback = fallback || `${action}${entity ? ` ${entity}` : ''}`;

  return (
    <SmartText
      termKey={termKey}
      context={context}
      fallback={actionFallback}
      transform={transform}
      style={style}
      {...textProps}
    >
      {children}
    </SmartText>
  );
};

/**
 * Apply text transformation
 */
function applyTextTransform(
  text: string,
  transform: 'uppercase' | 'lowercase' | 'capitalize' | 'none',
  isPlural: boolean = false
): string {
  let transformedText = text;

  // Handle simple pluralization if needed and not already plural
  if (isPlural && !text.endsWith('s') && !text.endsWith('es')) {
    // Simple pluralization rules - in a real app, use a proper pluralization library
    if (text.endsWith('y')) {
      transformedText = text.slice(0, -1) + 'ies';
    } else if (text.endsWith('s') || text.endsWith('sh') || text.endsWith('ch') || text.endsWith('x') || text.endsWith('z')) {
      transformedText = text + 'es';
    } else {
      transformedText = text + 's';
    }
  }

  // Apply text transformation
  switch (transform) {
    case 'uppercase':
      return transformedText.toUpperCase();
    case 'lowercase':
      return transformedText.toLowerCase();
    case 'capitalize':
      return transformedText.charAt(0).toUpperCase() + transformedText.slice(1).toLowerCase();
    case 'none':
    default:
      return transformedText;
  }
}

/**
 * Hook for using SmartText functionality in custom components
 */
export const useSmartText = () => {
  const hasCategoryContext = useHasCategoryContext();
  const { getTerm, getPluralTerm, hasTerminology } = useTerminology();

  return useMemo(() => ({
    /**
     * Resolve a term with smart text logic
     */
    resolveTerm: (
      termKey: string,
      options: {
        context?: string;
        fallback?: string;
        transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
        plural?: boolean;
      } = {}
    ): string => {
      const {
        context,
        fallback = termKey,
        transform = 'none',
        plural = false,
      } = options;

      // If no category context is available, use fallback
      if (!hasCategoryContext || !hasTerminology) {
        return applyTextTransform(fallback, transform, plural);
      }

      try {
        // Get the appropriate term based on plural flag
        const term = plural ? getPluralTerm(termKey, context) : getTerm(termKey, context);
        
        // Apply text transformation
        return applyTextTransform(term, transform, plural);
      } catch (error) {
        console.warn(`⚠️ Failed to resolve term '${termKey}':`, error);
        return applyTextTransform(fallback, transform, plural);
      }
    },

    /**
     * Check if category context is available
     */
    hasContext: hasCategoryContext && hasTerminology,

    /**
     * Get raw terminology functions
     */
    getTerm,
    getPluralTerm,
  }), [hasCategoryContext, hasTerminology, getTerm, getPluralTerm]);
};

// Export default as SmartText
export default SmartText;