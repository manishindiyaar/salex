/**
 * Unit tests for resolveNextNode and operator evaluation.
 *
 * Validates: Requirements 2.5, 2.6, 4.1, 4.2, 4.5
 */

import { describe, it, expect } from 'vitest';
import type { FlowEdge } from '@salex/shared-types';
import { resolveNextNode, evaluateCondition, getByDotPath } from '../resolve-next-node';

describe('resolveNextNode', () => {
  describe('edge selection', () => {
    it('returns the first matching conditional edge in definition order', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'A', to: 'B', condition: { field: 'x', operator: 'eq', value: '1' } },
        { id: 'e2', from: 'A', to: 'C', condition: { field: 'x', operator: 'eq', value: '1' } },
        { id: 'e3', from: 'A', to: 'D' }, // fallback
      ];
      // Both e1 and e2 match, but e1 is first in definition order
      expect(resolveNextNode(edges, 'A', { x: '1' })).toBe('B');
    });

    it('returns the fallback edge when no conditional matches', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'A', to: 'B', condition: { field: 'x', operator: 'eq', value: 'yes' } },
        { id: 'e2', from: 'A', to: 'C' }, // fallback
      ];
      expect(resolveNextNode(edges, 'A', { x: 'no' })).toBe('C');
    });

    it('returns null (dead-end) when no conditional matches and no fallback exists', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'A', to: 'B', condition: { field: 'x', operator: 'eq', value: 'yes' } },
      ];
      expect(resolveNextNode(edges, 'A', { x: 'no' })).toBeNull();
    });

    it('returns null when no edges exist for the given node', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'B', to: 'C' },
      ];
      expect(resolveNextNode(edges, 'A', {})).toBeNull();
    });

    it('returns the fallback edge when there are no conditional edges', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'A', to: 'B' }, // fallback only
      ];
      expect(resolveNextNode(edges, 'A', {})).toBe('B');
    });

    it('skips edges from other nodes', () => {
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'X', to: 'Y', condition: { field: 'x', operator: 'eq', value: '1' } },
        { id: 'e2', from: 'A', to: 'B', condition: { field: 'x', operator: 'eq', value: '1' } },
      ];
      expect(resolveNextNode(edges, 'A', { x: '1' })).toBe('B');
    });

    it('prefers conditional match over fallback regardless of order', () => {
      // Fallback appears before the conditional in definition order
      const edges: FlowEdge[] = [
        { id: 'e1', from: 'A', to: 'FALLBACK' }, // fallback first
        { id: 'e2', from: 'A', to: 'MATCH', condition: { field: 'x', operator: 'eq', value: '1' } },
      ];
      expect(resolveNextNode(edges, 'A', { x: '1' })).toBe('MATCH');
    });
  });

  describe('operator: eq', () => {
    it('matches when string-coerced values are equal', () => {
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: '42' }, { x: 42 })).toBe(true);
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: 42 }, { x: '42' })).toBe(true);
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: 'hello' }, { x: 'hello' })).toBe(true);
    });

    it('does not match when string-coerced values differ', () => {
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: '1' }, { x: '2' })).toBe(false);
    });

    it('handles boolean coercion', () => {
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: 'true' }, { x: true })).toBe(true);
      expect(evaluateCondition({ field: 'x', operator: 'eq', value: true }, { x: 'true' })).toBe(true);
    });

    it('handles undefined field (coerces to "undefined")', () => {
      expect(evaluateCondition({ field: 'missing', operator: 'eq', value: 'undefined' }, {})).toBe(true);
      expect(evaluateCondition({ field: 'missing', operator: 'eq', value: 'hello' }, {})).toBe(false);
    });
  });

  describe('operator: neq', () => {
    it('matches when string-coerced values differ', () => {
      expect(evaluateCondition({ field: 'x', operator: 'neq', value: '1' }, { x: '2' })).toBe(true);
    });

    it('does not match when string-coerced values are equal', () => {
      expect(evaluateCondition({ field: 'x', operator: 'neq', value: '1' }, { x: 1 })).toBe(false);
    });
  });

  describe('operator: contains', () => {
    it('matches substring in a string field', () => {
      expect(evaluateCondition({ field: 'x', operator: 'contains', value: 'ell' }, { x: 'hello' })).toBe(true);
    });

    it('does not match when substring is absent', () => {
      expect(evaluateCondition({ field: 'x', operator: 'contains', value: 'xyz' }, { x: 'hello' })).toBe(false);
    });

    it('matches array membership (string coercion)', () => {
      expect(evaluateCondition({ field: 'tags', operator: 'contains', value: '2' }, { tags: [1, 2, 3] })).toBe(true);
      expect(evaluateCondition({ field: 'tags', operator: 'contains', value: 'a' }, { tags: ['a', 'b'] })).toBe(true);
    });

    it('does not match array when element is absent', () => {
      expect(evaluateCondition({ field: 'tags', operator: 'contains', value: 'z' }, { tags: ['a', 'b'] })).toBe(false);
    });

    it('returns false for non-string non-array field', () => {
      expect(evaluateCondition({ field: 'x', operator: 'contains', value: '1' }, { x: 123 })).toBe(false);
      expect(evaluateCondition({ field: 'x', operator: 'contains', value: '1' }, { x: null })).toBe(false);
      expect(evaluateCondition({ field: 'x', operator: 'contains', value: '1' }, {})).toBe(false);
    });
  });

  describe('operator: gt', () => {
    it('matches when field is numerically greater', () => {
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: 5 }, { x: 10 })).toBe(true);
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: '5' }, { x: '10' })).toBe(true);
    });

    it('does not match when field is equal or less', () => {
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: 5 }, { x: 5 })).toBe(false);
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: 5 }, { x: 3 })).toBe(false);
    });

    it('returns false for non-numeric field value', () => {
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: 5 }, { x: 'abc' })).toBe(false);
    });

    it('returns false for non-numeric condition value', () => {
      expect(evaluateCondition({ field: 'x', operator: 'gt', value: 'abc' }, { x: 10 })).toBe(false);
    });

    it('returns false for undefined field', () => {
      expect(evaluateCondition({ field: 'missing', operator: 'gt', value: 5 }, {})).toBe(false);
    });
  });

  describe('operator: lt', () => {
    it('matches when field is numerically less', () => {
      expect(evaluateCondition({ field: 'x', operator: 'lt', value: 10 }, { x: 5 })).toBe(true);
      expect(evaluateCondition({ field: 'x', operator: 'lt', value: '10' }, { x: '5' })).toBe(true);
    });

    it('does not match when field is equal or greater', () => {
      expect(evaluateCondition({ field: 'x', operator: 'lt', value: 5 }, { x: 5 })).toBe(false);
      expect(evaluateCondition({ field: 'x', operator: 'lt', value: 5 }, { x: 10 })).toBe(false);
    });

    it('returns false for non-numeric field value', () => {
      expect(evaluateCondition({ field: 'x', operator: 'lt', value: 5 }, { x: 'abc' })).toBe(false);
    });

    it('returns false for undefined field', () => {
      expect(evaluateCondition({ field: 'missing', operator: 'lt', value: 5 }, {})).toBe(false);
    });
  });

  describe('getByDotPath', () => {
    it('resolves a simple key', () => {
      expect(getByDotPath({ x: 42 }, 'x')).toBe(42);
    });

    it('resolves a nested dot-path', () => {
      expect(getByDotPath({ responses: { confirm: 'yes' } }, 'responses.confirm')).toBe('yes');
    });

    it('resolves deeply nested paths', () => {
      expect(getByDotPath({ a: { b: { c: 'deep' } } }, 'a.b.c')).toBe('deep');
    });

    it('returns undefined for missing intermediate', () => {
      expect(getByDotPath({ a: { b: 1 } }, 'a.x.y')).toBeUndefined();
    });

    it('returns undefined for null intermediate', () => {
      expect(getByDotPath({ a: null }, 'a.b')).toBeUndefined();
    });

    it('returns undefined for primitive intermediate', () => {
      expect(getByDotPath({ a: 'string' }, 'a.b')).toBeUndefined();
    });
  });
});
