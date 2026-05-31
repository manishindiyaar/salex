/**
 * Question node handler — renders a prompt and processes the customer's reply.
 *
 * A question node waits for customer input (free-text or choice selection),
 * stores the response in `responses[nodeId]`, validates against optional
 * rules, and returns an errorMessage on validation failure (Req 12.1, 12.2).
 *
 * Config shape:
 *   {
 *     text: string;                          // Prompt body text
 *     inputType?: 'text' | 'choice';         // Default: 'text'
 *     choices?: string[] | StructuredChoice[];
 *     header?: string;                       // Optional header for interactive messages
 *     footer?: string;                       // Optional footer
 *     buttonLabel?: string;                  // Button label for list-type messages
 *     validation?: {
 *       required?: boolean;                  // Must not be empty
 *       pattern?: string;                    // Regex pattern to match
 *       minLength?: number;
 *       maxLength?: number;
 *       errorMessage?: string;               // Custom error message on failure
 *     };
 *     nodeId?: string;                       // Override key for responses (defaults to node id from context)
 *   }
 *
 * Requirements: 2.3, 3.1, 3.2, 4.3, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import type { InteractiveMessage } from '../conversation.service';
import type { NodeHandler, NodeProcessArgs, NodeRenderArgs, NodeResult } from './types';

/**
 * Structured choice format for question nodes.
 * Supports rich choice data with id for matching and title for display.
 * Req 12.1
 */
export interface StructuredChoice {
  id: string;
  title: string;
  description?: string;
}

/**
 * Normalizes choices from config to StructuredChoice[] format.
 * Handles backward compatibility with plain string[] (Req 12.3).
 *
 * - If choices is string[]: maps each string to { id: string, title: string } (same value for both)
 * - If choices is StructuredChoice[]: uses as-is
 */
export function normalizeChoices(
  choices: unknown[] | undefined
): StructuredChoice[] | undefined {
  if (!choices || choices.length === 0) return undefined;

  // Check if it's a string array (backward compat)
  if (typeof choices[0] === 'string') {
    return (choices as string[]).map((s) => ({ id: s, title: s }));
  }

  // Already structured format
  return choices as StructuredChoice[];
}

/**
 * Validates that no duplicate `id` values exist in the choices array.
 * Logs a warning if duplicates are found but still allows rendering (Req 12.4).
 * Returns the set of duplicate ids (empty if none).
 */
export function findDuplicateChoiceIds(choices: StructuredChoice[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const choice of choices) {
    if (seen.has(choice.id)) {
      duplicates.push(choice.id);
    } else {
      seen.add(choice.id);
    }
  }
  return duplicates;
}

export const questionHandler: NodeHandler = {
  type: 'question',
  autoAdvance: false,

  async render(args: NodeRenderArgs): Promise<InteractiveMessage> {
    const { config } = args;
    const text = (config.text as string) || (config.body as string) || '';
    const inputType = (config.inputType as string) || 'text';

    // Normalize choices: support both string[] and StructuredChoice[] (Req 12.3)
    const rawChoices = config.choices as unknown[] | undefined;
    const choices = normalizeChoices(rawChoices);

    // Free-text question — simple text message as prompt
    if (inputType === 'text' || !choices || choices.length === 0) {
      return {
        type: 'text',
        body: { text },
      };
    }

    // Validate no duplicate ids — log warning but still render (Req 12.4)
    const duplicates = findDuplicateChoiceIds(choices);
    if (duplicates.length > 0) {
      console.warn(
        `[question-handler] Duplicate choice ids detected: ${duplicates.join(', ')}. ` +
          'Choices should have unique ids for reliable reply matching.'
      );
    }

    // Choice question — render as buttons (≤3 choices) or list (>3 choices) (Req 12.5)
    const header = config.header as string | undefined;
    const footer = config.footer as string | undefined;

    if (choices.length <= 3) {
      // Button-style interactive message (Req 12.5)
      return {
        type: 'button',
        ...(header ? { header: { type: 'text' as const, text: header } } : {}),
        body: { text },
        ...(footer ? { footer: { text: footer } } : {}),
        action: {
          buttons: choices.map((c) => ({
            type: 'reply' as const,
            reply: { id: c.id, title: c.title },
          })),
        },
      };
    }

    // List-style interactive message (>3 choices) (Req 12.5)
    const buttonLabel = (config.buttonLabel as string) || 'Select';
    return {
      type: 'list',
      ...(header ? { header: { type: 'text' as const, text: header } } : {}),
      body: { text },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        button: buttonLabel,
        sections: [
          {
            rows: choices.map((c) => ({
              id: c.id,
              title: c.title,
              ...(c.description ? { description: c.description } : {}),
            })),
          },
        ],
      },
    };
  },

  async process(args: NodeProcessArgs): Promise<NodeResult> {
    const { incomingMessage, interactiveReply, config, context } = args;
    const inputType = (config.inputType as string) || 'text';

    // Normalize choices: support both string[] and StructuredChoice[] (Req 12.3)
    const rawChoices = config.choices as unknown[] | undefined;
    const choices = normalizeChoices(rawChoices);

    const validation = config.validation as
      | {
          required?: boolean;
          pattern?: string;
          minLength?: number;
          maxLength?: number;
          errorMessage?: string;
        }
      | undefined;

    // Determine the response value
    let responseValue: string;

    if (inputType === 'choice' && choices && choices.length > 0) {
      // For choice questions, accept interactive reply or match text to a choice
      if (interactiveReply) {
        // Match interactiveReply.id against choice id values (Req 12.2)
        const validChoice = choices.find((c) => c.id === interactiveReply.id);
        if (!validChoice) {
          return {
            complete: false,
            errorMessage:
              (validation?.errorMessage as string) ||
              'Please select a valid option from the list.',
          };
        }
        responseValue = validChoice.id;
      } else {
        // Try matching text input against choice ids first (Req 12.2)
        const matchedById = choices.find(
          (c) => c.id.toLowerCase() === incomingMessage.trim().toLowerCase()
        );
        if (matchedById) {
          responseValue = matchedById.id;
        } else {
          // Fall back to matching against titles for backward compat (Req 12.3)
          const matchedByTitle = choices.find(
            (c) => c.title.toLowerCase() === incomingMessage.trim().toLowerCase()
          );
          if (!matchedByTitle) {
            return {
              complete: false,
              errorMessage:
                (validation?.errorMessage as string) ||
                'Please select a valid option from the list.',
            };
          }
          responseValue = matchedByTitle.id;
        }
      }
    } else {
      // Free-text input
      responseValue = incomingMessage.trim();
    }

    // Validate the response
    const validationError = validateResponse(responseValue, validation);
    if (validationError) {
      return {
        complete: false,
        errorMessage: validationError,
      };
    }

    // Determine the response key — use nodeId override or fall back to
    // the node's id which the engine will have placed in context.__currentNodeId
    const nodeId = (config.nodeId as string) || (context.__currentNodeId as string) || 'unknown';

    // Store the response in responses[nodeId]
    const existingResponses = (context.responses as Record<string, unknown>) || {};

    return {
      complete: true,
      contextUpdates: {
        responses: {
          ...existingResponses,
          [nodeId]: responseValue,
        },
      },
    };
  },
};

/**
 * Validates a response value against the configured validation rules.
 * Returns an error message string on failure, or null if valid.
 */
function validateResponse(
  value: string,
  validation:
    | {
        required?: boolean;
        pattern?: string;
        minLength?: number;
        maxLength?: number;
        errorMessage?: string;
      }
    | undefined
): string | null {
  if (!validation) return null;

  const customError = validation.errorMessage;

  // Required check
  if (validation.required && (!value || value.length === 0)) {
    return customError || 'This field is required. Please provide a response.';
  }

  // Min length check
  if (validation.minLength !== undefined && value.length < validation.minLength) {
    return (
      customError ||
      `Response must be at least ${validation.minLength} characters.`
    );
  }

  // Max length check
  if (validation.maxLength !== undefined && value.length > validation.maxLength) {
    return (
      customError ||
      `Response must be no more than ${validation.maxLength} characters.`
    );
  }

  // Pattern check
  if (validation.pattern) {
    try {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return customError || 'Response does not match the expected format.';
      }
    } catch {
      // Invalid regex in config — skip pattern validation rather than crash
    }
  }

  return null;
}
