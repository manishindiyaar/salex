/**
 * Sanity check: confirms that the [pbt] describe-block prefix is filterable
 * via `vitest run -t '[pbt]'` and that fast-check + pbtConfig work end-to-end.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { pbtConfig, assertProperty, PBT_NUM_RUNS } from './pbt';

describe('[pbt] PBT sanity check', () => {
  // Feature: whatsapp-flow-engine, Property 0: PBT infrastructure sanity
  it('fast-check runs with the shared config', () => {
    assertProperty(
      fc.property(fc.integer(), (n) => {
        expect(typeof n).toBe('number');
        return true;
      }),
    );
  });

  it('PBT_NUM_RUNS defaults to 100', () => {
    expect(PBT_NUM_RUNS).toBe(100);
    expect(pbtConfig.numRuns).toBe(100);
  });
});
