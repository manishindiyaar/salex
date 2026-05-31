/**
 * Property-Based Testing (PBT) conventions and shared configuration.
 *
 * == Conventions ==
 *
 * 1. Describe-block prefix:
 *    All property-based test suites MUST use the `[pbt]` prefix in their
 *    top-level `describe` block so that vitest filters exclusively to
 *    property suites.
 *
 *    Run command (escape brackets for regex):
 *      vitest run -t '\[pbt\]'
 *
 *    Example:
 *      describe('[pbt] Availability capacity invariant', () => { ... })
 *
 * 2. Per-test feature/property tag (comment):
 *    Each `it`/`test` block MUST include a leading comment identifying the
 *    feature and property number:
 *
 *      // Feature: whatsapp-flow-engine, Property 2: Capacity invariant
 *      it('slot is bookable iff overlap < effective capacity', () => { ... })
 *
 * 3. Run count:
 *    Use the shared `PBT_NUM_RUNS` constant (or `pbtConfig`) so all suites
 *    share a consistent default that can be tuned in CI vs local dev.
 *
 * 4. File naming:
 *    PBT test files use the `.pbt.test.ts` suffix to distinguish them from
 *    standard unit/integration tests.
 */

import fc from 'fast-check';

/**
 * Default number of runs for property-based tests.
 * Balances thoroughness with speed for local development.
 * CI environments may override via the `PBT_NUM_RUNS` env var.
 */
export const PBT_NUM_RUNS = Number(process.env.PBT_NUM_RUNS) || 100;

/**
 * Shared fast-check configuration applied to all property tests.
 * Spread into `fc.assert(property, pbtConfig)` or pass to `fc.check`.
 */
export const pbtConfig: fc.Parameters<unknown> = {
  numRuns: PBT_NUM_RUNS,
};

/**
 * Convenience wrapper: runs `fc.assert` with the shared config merged
 * with any per-test overrides.
 */
export function assertProperty<T>(
  property: fc.IAsyncProperty<T> | fc.IProperty<T>,
  overrides?: Partial<fc.Parameters<T>>,
): ReturnType<typeof fc.assert> {
  return fc.assert(property, { ...pbtConfig, ...overrides } as fc.Parameters<T>);
}
