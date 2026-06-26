import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatAdvancementProgress,
  formatCost,
  formatNumber,
  formatResourceName,
  getEraProgressPercent,
  getRelevantResources,
  getResourceIcon,
} from '../src/lib/utils/gameFormatting.js';

test('formatNumber abbreviates thousands and millions', () => {
  assert.equal(formatNumber(999.9), '999');
  assert.equal(formatNumber(1_234), '1.2K');
  assert.equal(formatNumber(1_250_000), '1.3M');
});

test('formatResourceName converts camel-case resource keys into labels', () => {
  assert.equal(formatResourceName('cookedMeat'), 'Cooked Meat');
  assert.equal(formatResourceName('stone'), 'Stone');
});

test('formatCost renders configured resource icons with fallbacks', () => {
  assert.equal(formatCost({ cookedMeat: 2, unknownThing: 3 }), '2 🍖, 3 unknownThing');
  assert.equal(getResourceIcon('missingResource', 'fallback-icon'), 'fallback-icon');
});

test('getRelevantResources accumulates resources through the current era', () => {
  assert.deepEqual([...getRelevantResources('neolithic')], [
    'sticks',
    'stones',
    'meat',
    'cookedMeat',
    'bones',
    'fur',
    'population',
    'grain',
    'clay',
    'pottery',
    'livestock',
    'textiles',
    'tools',
  ]);
  assert.deepEqual([...getRelevantResources('nonexistent')], []);
});

test('getEraProgressPercent averages clamped resource completion', () => {
  assert.equal(getEraProgressPercent({}, { food: 10 }), 100);
  assert.equal(getEraProgressPercent({ food: 10, wood: 20 }, { food: 5, wood: 30 }), 75);
});

test('formatAdvancementProgress reports current and required resources', () => {
  assert.equal(formatAdvancementProgress({}, { food: 1 }), 'Final era reached');
  assert.equal(
    formatAdvancementProgress({ food: 10, wood: 20 }, { food: 5.9, wood: 30 }),
    '5/10 food, 30/20 wood',
  );
});
