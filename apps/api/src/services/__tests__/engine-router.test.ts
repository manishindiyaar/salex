import { describe, it, expect } from 'vitest';
import { selectEngine, isLegacyMidFlight, LEGACY_MID_FLIGHT_STATES, type SelectEngineInput } from '../engine-router.service';

describe('EngineRouter - selectEngine', () => {
  describe('undefined businessId → always legacy (Req 7.3)', () => {
    it('returns legacy when businessId is undefined regardless of other flags', () => {
      expect(selectEngine({ businessId: undefined, globalCutover: false, businessFlagged: false, hasActiveCustomFlow: false })).toBe('legacy');
      expect(selectEngine({ businessId: undefined, globalCutover: true, businessFlagged: false, hasActiveCustomFlow: false })).toBe('legacy');
      expect(selectEngine({ businessId: undefined, globalCutover: true, businessFlagged: true, hasActiveCustomFlow: true })).toBe('legacy');
      expect(selectEngine({ businessId: undefined, globalCutover: false, businessFlagged: true, hasActiveCustomFlow: true })).toBe('legacy');
    });
  });

  describe('globalCutover → flow for everyone with a business (Req 11.3)', () => {
    it('returns flow when globalCutover is true and businessId is defined', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: true, businessFlagged: false, hasActiveCustomFlow: false })).toBe('flow');
    });

    it('returns flow when globalCutover is true even if not flagged and no custom flow', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: true, businessFlagged: false, hasActiveCustomFlow: false })).toBe('flow');
    });

    it('returns flow when globalCutover is true and business is also flagged', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: true, businessFlagged: true, hasActiveCustomFlow: true })).toBe('flow');
    });
  });

  describe('per-business segmentation (Req 11.1)', () => {
    it('returns flow when business is flagged (flowEngineEnabled)', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: false, businessFlagged: true, hasActiveCustomFlow: false })).toBe('flow');
    });

    it('returns flow when business has an active custom flow', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: false, businessFlagged: false, hasActiveCustomFlow: true })).toBe('flow');
    });

    it('returns flow when both flagged and has active custom flow', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: false, businessFlagged: true, hasActiveCustomFlow: true })).toBe('flow');
    });
  });

  describe('default → legacy (Req 11.2)', () => {
    it('returns legacy when no flags are set and business is defined', () => {
      expect(selectEngine({ businessId: 'biz1', globalCutover: false, businessFlagged: false, hasActiveCustomFlow: false })).toBe('legacy');
    });
  });

  describe('full boolean cross-product', () => {
    // Exhaustive test of all 16 combinations (2^4: businessId present/absent × 3 flags)
    const cases: Array<{ input: SelectEngineInput; expected: 'flow' | 'legacy' }> = [
      // No businessId → always legacy
      { input: { businessId: undefined, globalCutover: false, businessFlagged: false, hasActiveCustomFlow: false }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: false, businessFlagged: false, hasActiveCustomFlow: true }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: false, businessFlagged: true, hasActiveCustomFlow: false }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: false, businessFlagged: true, hasActiveCustomFlow: true }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: true, businessFlagged: false, hasActiveCustomFlow: false }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: true, businessFlagged: false, hasActiveCustomFlow: true }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: true, businessFlagged: true, hasActiveCustomFlow: false }, expected: 'legacy' },
      { input: { businessId: undefined, globalCutover: true, businessFlagged: true, hasActiveCustomFlow: true }, expected: 'legacy' },
      // With businessId
      { input: { businessId: 'biz1', globalCutover: false, businessFlagged: false, hasActiveCustomFlow: false }, expected: 'legacy' },
      { input: { businessId: 'biz1', globalCutover: false, businessFlagged: false, hasActiveCustomFlow: true }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: false, businessFlagged: true, hasActiveCustomFlow: false }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: false, businessFlagged: true, hasActiveCustomFlow: true }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: true, businessFlagged: false, hasActiveCustomFlow: false }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: true, businessFlagged: false, hasActiveCustomFlow: true }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: true, businessFlagged: true, hasActiveCustomFlow: false }, expected: 'flow' },
      { input: { businessId: 'biz1', globalCutover: true, businessFlagged: true, hasActiveCustomFlow: true }, expected: 'flow' },
    ];

    it.each(cases)(
      'selectEngine($input) → $expected',
      ({ input, expected }) => {
        expect(selectEngine(input)).toBe(expected);
      },
    );
  });
});


describe('EngineRouter - isLegacyMidFlight (Req 5.4, 14.1, 15.6)', () => {
  it('returns false for null conversation (no existing conversation)', () => {
    expect(isLegacyMidFlight(null)).toBe(false);
  });

  it('returns false for GREETING state (fresh start, not mid-flight)', () => {
    expect(isLegacyMidFlight({ state: 'GREETING', flowId: null })).toBe(false);
  });

  it('returns false for COMPLETED state (finished, not mid-flight)', () => {
    expect(isLegacyMidFlight({ state: 'COMPLETED', flowId: null })).toBe(false);
  });

  it('returns false for SHOP_CLOSED state (terminal, not mid-flight)', () => {
    expect(isLegacyMidFlight({ state: 'SHOP_CLOSED', flowId: null })).toBe(false);
  });

  it('returns true for AWAITING_ROUTING_CODE with no flowId', () => {
    expect(isLegacyMidFlight({ state: 'AWAITING_ROUTING_CODE', flowId: null })).toBe(true);
  });

  it('returns true for SERVICE_SELECTION with no flowId', () => {
    expect(isLegacyMidFlight({ state: 'SERVICE_SELECTION', flowId: null })).toBe(true);
  });

  it('returns true for TIME_SELECTION with no flowId', () => {
    expect(isLegacyMidFlight({ state: 'TIME_SELECTION', flowId: null })).toBe(true);
  });

  it('returns true for CONFIRMATION with no flowId', () => {
    expect(isLegacyMidFlight({ state: 'CONFIRMATION', flowId: null })).toBe(true);
  });

  it('returns false for mid-flight state WITH a flowId (already on flow engine)', () => {
    expect(isLegacyMidFlight({ state: 'SERVICE_SELECTION', flowId: 'flow-123' })).toBe(false);
    expect(isLegacyMidFlight({ state: 'CONFIRMATION', flowId: 'flow-456' })).toBe(false);
  });

  it('returns false for an arbitrary flow-engine node ID (not a legacy enum)', () => {
    expect(isLegacyMidFlight({ state: 'node_greeting_abc', flowId: null })).toBe(false);
    expect(isLegacyMidFlight({ state: 'custom-node-1', flowId: 'flow-789' })).toBe(false);
  });

  describe('all LEGACY_MID_FLIGHT_STATES are detected', () => {
    const midFlightStates = ['AWAITING_ROUTING_CODE', 'SERVICE_SELECTION', 'TIME_SELECTION', 'CONFIRMATION'];

    it.each(midFlightStates)('%s is in LEGACY_MID_FLIGHT_STATES and detected as mid-flight', (state) => {
      expect(LEGACY_MID_FLIGHT_STATES.has(state)).toBe(true);
      expect(isLegacyMidFlight({ state, flowId: null })).toBe(true);
    });
  });
});
