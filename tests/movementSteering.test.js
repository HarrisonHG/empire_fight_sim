import { describe, expect, it } from 'vitest';
import { computeSeparationVector, computeLateralAvoidance }
  from '../src/entities/movement/steering.js';

describe('movement steering helpers', () => {
  describe('computeSeparationVector', () => {
    it('returns zero when neighbours are outside personal space', () => {
      const result = computeSeparationVector(
        { x: 0, y: 0, radius: 10 },
        [{ x: 100, y: 0, radius: 10 }],
        5
      );
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('pushes away from a neighbour inside personal space', () => {
      const result = computeSeparationVector(
        { x: 0, y: 0, radius: 10 },
        [{ x: 15, y: 0, radius: 10 }],
        8
      );
      expect(result.x).toBeLessThan(0);
      expect(Math.abs(result.y)).toBeLessThan(1e-6);
    });
  });

  describe('computeLateralAvoidance', () => {
    it('steers to the side that moves closer to the target', () => {
      const result = computeLateralAvoidance(
        { x: 0, y: 0, radius: 10 },
        [{ x: 20, y: 0, radius: 10 }],
        { x: 40, y: 0 },
        { x: 40, y: 30 },
        { personalSpace: 5, stepDistance: 10 }
      );
      expect(result.y).toBeGreaterThan(0);
    });

    it('ignores blockers behind the unit', () => {
      const result = computeLateralAvoidance(
        { x: 0, y: 0, radius: 10 },
        [{ x: -10, y: 0, radius: 10 }],
        { x: 40, y: 0 },
        { x: 40, y: 0 },
        { personalSpace: 5, stepDistance: 10 }
      );
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('defaults to the clearer side when both are similar distance to target', () => {
      const result = computeLateralAvoidance(
        { x: 0, y: 0, radius: 10 },
        [{ x: 20, y: 10, radius: 10 }],
        { x: 40, y: 0 },
        { x: 40, y: 0 },
        { personalSpace: 5, stepDistance: 10 }
      );
      expect(result.y).toBeLessThanOrEqual(0);
    });
  });
});
