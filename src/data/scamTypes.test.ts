import { describe, expect, it } from 'vitest';
import archetypeData from './archetypes.json';
import { SCAM_TYPES } from './scamTypes';

const ids = archetypeData.archetypes.map(({ id }: { id: string }) => id);

describe('scam type explainers', () => {
  it('has one explainer for every archetype and no extras', () => {
    expect(Object.keys(SCAM_TYPES).sort()).toEqual([...ids].sort());
  });

  it('is complete in all three languages and follows the copy rules', () => {
    for (const type of Object.values(SCAM_TYPES)) {
      for (const field of [type.tell, type.doThis]) {
        for (const lang of ['en', 'fil', 'taglish'] as const) {
          expect(field[lang].trim().length).toBeGreaterThan(10);
          expect(field[lang]).not.toContain('—'); // RULES 16: no em dashes in UI copy
        }
      }
    }
  });
});
