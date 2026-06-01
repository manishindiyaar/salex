/**
 * Unit tests for the message and question node handlers.
 *
 * Requirements: 2.3, 3.1, 3.2, 4.3, 12.1, 12.2
 */

import { describe, it, expect } from 'vitest';
import { messageHandler } from '../message';
import { questionHandler } from '../question';
import type { NodeRenderArgs, NodeProcessArgs } from '../types';

describe('messageHandler', () => {
  const baseRenderArgs: NodeRenderArgs = {
    config: {},
    context: {},
    businessId: 'biz_123',
  };

  it('has type "message" and autoAdvance true', () => {
    expect(messageHandler.type).toBe('message');
    expect(messageHandler.autoAdvance).toBe(true);
  });

  it('does not have a process method (Req 4.3)', () => {
    expect(messageHandler.process).toBeUndefined();
  });

  it('renders static text from config.text', async () => {
    const result = await messageHandler.render({
      ...baseRenderArgs,
      config: { text: 'Hello, welcome!' },
    });

    expect(result).toEqual({
      type: 'text',
      body: { text: 'Hello, welcome!' },
    });
  });

  it('renders static text from config.body as alias', async () => {
    const result = await messageHandler.render({
      ...baseRenderArgs,
      config: { body: 'Goodbye!' },
    });

    expect(result).toEqual({
      type: 'text',
      body: { text: 'Goodbye!' },
    });
  });

  it('prefers config.text over config.body', async () => {
    const result = await messageHandler.render({
      ...baseRenderArgs,
      config: { text: 'Primary', body: 'Fallback' },
    });

    expect(result).toEqual({
      type: 'text',
      body: { text: 'Primary' },
    });
  });

  it('renders empty string when no text or body configured', async () => {
    const result = await messageHandler.render(baseRenderArgs);

    expect(result).toEqual({
      type: 'text',
      body: { text: '' },
    });
  });
});

describe('questionHandler', () => {
  const baseRenderArgs: NodeRenderArgs = {
    config: {},
    context: {},
    businessId: 'biz_123',
  };

  const baseProcessArgs: NodeProcessArgs = {
    incomingMessage: '',
    config: {},
    context: { __currentNodeId: 'q1' },
    businessId: 'biz_123',
  };

  it('has type "question" and autoAdvance false', () => {
    expect(questionHandler.type).toBe('question');
    expect(questionHandler.autoAdvance).toBe(false);
  });

  it('has a process method', () => {
    expect(questionHandler.process).toBeDefined();
  });

  describe('render', () => {
    it('renders a text prompt for free-text input', async () => {
      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: { text: 'What is your name?' },
      });

      expect(result).toEqual({
        type: 'text',
        body: { text: 'What is your name?' },
      });
    });

    it('renders buttons for ≤3 choices', async () => {
      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: {
          text: 'Pick one:',
          inputType: 'choice',
          choices: [
            { id: 'a', title: 'Option A' },
            { id: 'b', title: 'Option B' },
          ],
        },
      });

      expect(result.type).toBe('button');
      expect(result.body.text).toBe('Pick one:');
      expect(result.action?.buttons).toHaveLength(2);
      expect(result.action?.buttons?.[0]).toEqual({
        type: 'reply',
        reply: { id: 'a', title: 'Option A' },
      });
    });

    it('renders a list for >3 choices', async () => {
      const choices = [
        { id: '1', title: 'One' },
        { id: '2', title: 'Two' },
        { id: '3', title: 'Three' },
        { id: '4', title: 'Four' },
      ];

      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: {
          text: 'Select:',
          inputType: 'choice',
          choices,
          buttonLabel: 'Choose',
        },
      });

      expect(result.type).toBe('list');
      expect(result.body.text).toBe('Select:');
      expect(result.action?.button).toBe('Choose');
      expect(result.action?.sections?.[0].rows).toHaveLength(4);
    });

    it('includes header and footer when configured', async () => {
      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: {
          text: 'Body text',
          inputType: 'choice',
          choices: [{ id: 'x', title: 'X' }],
          header: 'Header',
          footer: 'Footer',
        },
      });

      expect(result.header).toEqual({ type: 'text', text: 'Header' });
      expect(result.footer).toEqual({ text: 'Footer' });
    });

    it('defaults buttonLabel to "Select" for list messages', async () => {
      const choices = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        title: `Item ${i}`,
      }));

      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: { text: 'Pick:', inputType: 'choice', choices },
      });

      expect(result.action?.button).toBe('Select');
    });

    it('falls back to text type when inputType is text even with choices', async () => {
      const result = await questionHandler.render({
        ...baseRenderArgs,
        config: {
          text: 'Type something:',
          inputType: 'text',
          choices: [{ id: 'a', title: 'A' }],
        },
      });

      expect(result.type).toBe('text');
    });
  });

  describe('process', () => {
    it('stores free-text response in responses[nodeId]', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'John Doe',
        config: { text: 'Name?' },
      });

      expect(result.complete).toBe(true);
      expect(result.contextUpdates).toEqual({
        responses: { q1: 'John Doe' },
      });
    });

    it('trims whitespace from free-text input', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: '  hello  ',
        config: { text: 'Say hi' },
      });

      expect(result.contextUpdates).toEqual({
        responses: { q1: 'hello' },
      });
    });

    it('uses config.nodeId as the response key when provided', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'yes',
        config: { text: 'Confirm?', nodeId: 'custom_key' },
      });

      expect(result.contextUpdates).toEqual({
        responses: { custom_key: 'yes' },
      });
    });

    it('processes interactive reply for choice questions', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: '',
        interactiveReply: { type: 'button', id: 'opt_b', title: 'Option B' },
        config: {
          text: 'Pick:',
          inputType: 'choice',
          choices: [
            { id: 'opt_a', title: 'Option A' },
            { id: 'opt_b', title: 'Option B' },
          ],
        },
      });

      expect(result.complete).toBe(true);
      expect(result.contextUpdates).toEqual({
        responses: { q1: 'opt_b' },
      });
    });

    it('matches free-text to choice title (case-insensitive)', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'option a',
        config: {
          text: 'Pick:',
          inputType: 'choice',
          choices: [
            { id: 'opt_a', title: 'Option A' },
            { id: 'opt_b', title: 'Option B' },
          ],
        },
      });

      expect(result.complete).toBe(true);
      expect(result.contextUpdates).toEqual({
        responses: { q1: 'opt_a' },
      });
    });

    it('returns errorMessage for invalid choice selection (Req 12.1)', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'invalid option',
        config: {
          text: 'Pick:',
          inputType: 'choice',
          choices: [
            { id: 'opt_a', title: 'Option A' },
            { id: 'opt_b', title: 'Option B' },
          ],
        },
      });

      expect(result.complete).toBe(false);
      expect(result.errorMessage).toBe(
        'Please select a valid option from the list.',
      );
    });

    it('returns errorMessage for invalid interactive reply id', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        interactiveReply: { type: 'button', id: 'unknown', title: 'Unknown' },
        config: {
          text: 'Pick:',
          inputType: 'choice',
          choices: [{ id: 'opt_a', title: 'Option A' }],
        },
      });

      expect(result.complete).toBe(false);
      expect(result.errorMessage).toBe(
        'Please select a valid option from the list.',
      );
    });

    it('uses custom errorMessage from validation config', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'wrong',
        config: {
          text: 'Pick:',
          inputType: 'choice',
          choices: [{ id: 'a', title: 'A' }],
          validation: { errorMessage: 'Custom error!' },
        },
      });

      expect(result.complete).toBe(false);
      expect(result.errorMessage).toBe('Custom error!');
    });

    describe('validation', () => {
      it('fails required validation on empty input', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: '   ',
          config: {
            text: 'Required field:',
            validation: { required: true },
          },
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe(
          'This field is required. Please provide a response.',
        );
      });

      it('fails minLength validation', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'ab',
          config: {
            text: 'Enter code:',
            validation: { minLength: 4 },
          },
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe(
          'Response must be at least 4 characters.',
        );
      });

      it('fails maxLength validation', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'this is way too long',
          config: {
            text: 'Short answer:',
            validation: { maxLength: 5 },
          },
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe(
          'Response must be no more than 5 characters.',
        );
      });

      it('fails pattern validation', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'abc',
          config: {
            text: 'Enter number:',
            validation: { pattern: '^\\d+$' },
          },
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe(
          'Response does not match the expected format.',
        );
      });

      it('passes pattern validation', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: '12345',
          config: {
            text: 'Enter number:',
            validation: { pattern: '^\\d+$' },
          },
        });

        expect(result.complete).toBe(true);
      });

      it('skips invalid regex patterns gracefully', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: 'anything',
          config: {
            text: 'Enter:',
            validation: { pattern: '[invalid(' },
          },
        });

        // Invalid regex is skipped, so validation passes
        expect(result.complete).toBe(true);
      });

      it('uses custom errorMessage for validation failures', async () => {
        const result = await questionHandler.process!({
          ...baseProcessArgs,
          incomingMessage: '',
          config: {
            text: 'Required:',
            validation: { required: true, errorMessage: 'Please fill this in!' },
          },
        });

        expect(result.complete).toBe(false);
        expect(result.errorMessage).toBe('Please fill this in!');
      });
    });

    it('preserves existing responses in context', async () => {
      const result = await questionHandler.process!({
        ...baseProcessArgs,
        incomingMessage: 'new answer',
        config: { text: 'Next question:' },
        context: {
          __currentNodeId: 'q2',
          responses: { q1: 'previous answer' },
        },
      });

      expect(result.contextUpdates).toEqual({
        responses: { q1: 'previous answer', q2: 'new answer' },
      });
    });
  });
});
