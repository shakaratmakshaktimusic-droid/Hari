/**
 * Unit tests for js/calculators/duration.js
 * Tests the Duration Calculator's core logic integration.
 * Uses Node.js built-in test runner (no external dependencies).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseDate, formatDate } from '../js/core/date-parser.js';
import { calculateDuration, getDayOfWeekName } from '../js/core/date-calc.js';
import { validateDateInput } from '../js/core/validators.js';

describe('Duration Calculator - Input Validation', () => {
  it('should reject empty start date', () => {
    const result = validateDateInput('', 'Start date');
    assert.equal(result.valid, false);
    assert.match(result.error, /required/i);
  });

  it('should reject empty end date', () => {
    const result = validateDateInput('', 'End date');
    assert.equal(result.valid, false);
    assert.match(result.error, /required/i);
  });

  it('should reject invalid date formats', () => {
    const result = validateDateInput('not-a-date', 'Start date');
    assert.equal(result.valid, false);
  });

  it('should accept valid MM/DD/YYYY format', () => {
    const result = validateDateInput('03/15/2024', 'Start date');
    assert.equal(result.valid, true);
    assert.deepEqual(result.date, { year: 2024, month: 3, day: 15 });
  });

  it('should accept valid YYYY-MM-DD format', () => {
    const result = validateDateInput('2024-03-15', 'Start date');
    assert.equal(result.valid, true);
    assert.deepEqual(result.date, { year: 2024, month: 3, day: 15 });
  });

  it('should reject invalid date like Feb 30', () => {
    const result = validateDateInput('02/30/2024', 'Start date');
    assert.equal(result.valid, false);
  });
});

describe('Duration Calculator - Duration Calculation', () => {
  it('should calculate zero days for same date', () => {
    const start = { year: 2024, month: 3, day: 15 };
    const end = { year: 2024, month: 3, day: 15 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.totalDays, 0);
    assert.equal(result.reversed, false);
  });

  it('should calculate one day difference', () => {
    const start = { year: 2024, month: 3, day: 15 };
    const end = { year: 2024, month: 3, day: 16 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.totalDays, 1);
    assert.equal(result.totalHours, 24);
    assert.equal(result.totalMinutes, 1440);
    assert.equal(result.totalSeconds, 86400);
  });

  it('should include end date when toggle is on (+1 day)', () => {
    const start = { year: 2024, month: 3, day: 15 };
    const end = { year: 2024, month: 3, day: 16 };
    const resultExclude = calculateDuration(start, end, false);
    const resultInclude = calculateDuration(start, end, true);
    assert.equal(resultInclude.totalDays, resultExclude.totalDays + 1);
  });

  it('should handle reversed dates gracefully', () => {
    const start = { year: 2024, month: 12, day: 25 };
    const end = { year: 2024, month: 1, day: 1 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.reversed, true);
    assert.ok(result.totalDays > 0);
  });

  it('should calculate correct breakdown for one year', () => {
    const start = { year: 2023, month: 1, day: 1 };
    const end = { year: 2024, month: 1, day: 1 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.totalDays, 365);
    assert.equal(result.breakdown.years, 1);
    assert.equal(result.breakdown.months, 0);
    assert.equal(result.breakdown.weeks, 0);
    assert.equal(result.breakdown.days, 0);
  });

  it('should calculate complex duration (2 years, 3 months, 1 week, 5 days)', () => {
    // From 2020-01-01 to 2022-04-13
    // 2 years: 2020-01-01 → 2022-01-01
    // 3 months: 2022-01-01 → 2022-04-01
    // 12 days: 2022-04-01 → 2022-04-13 = 1 week 5 days
    const start = { year: 2020, month: 1, day: 1 };
    const end = { year: 2022, month: 4, day: 13 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.breakdown.years, 2);
    assert.equal(result.breakdown.months, 3);
    assert.equal(result.breakdown.weeks, 1);
    assert.equal(result.breakdown.days, 5);
  });

  it('should handle leap year transitions', () => {
    const start = { year: 2024, month: 2, day: 28 };
    const end = { year: 2024, month: 3, day: 1 };
    const result = calculateDuration(start, end, false);
    // 2024 is a leap year: Feb 28 to Mar 1 = 2 days (Feb 29 + Mar 1)
    assert.equal(result.totalDays, 2);
  });

  it('should provide time equivalents', () => {
    const start = { year: 2024, month: 1, day: 1 };
    const end = { year: 2024, month: 1, day: 8 };
    const result = calculateDuration(start, end, false);
    assert.equal(result.totalDays, 7);
    assert.equal(result.totalHours, 7 * 24);
    assert.equal(result.totalMinutes, 7 * 24 * 60);
    assert.equal(result.totalSeconds, 7 * 24 * 60 * 60);
  });
});

describe('Duration Calculator - Day of Week Display', () => {
  it('should return correct day-of-week names for start and end dates', () => {
    // 2024-01-01 is Monday
    assert.equal(getDayOfWeekName(2024, 1, 1), 'Monday');
    // 2024-03-15 is Friday
    assert.equal(getDayOfWeekName(2024, 3, 15), 'Friday');
    // 2024-12-25 is Wednesday
    assert.equal(getDayOfWeekName(2024, 12, 25), 'Wednesday');
  });
});

describe('Duration Calculator - Date Formatting', () => {
  it('should format dates correctly for display', () => {
    const date = { year: 2024, month: 3, day: 15 };
    assert.equal(formatDate(date, 'MM/DD/YYYY'), '03/15/2024');
    assert.equal(formatDate(date, 'YYYY-MM-DD'), '2024-03-15');
    assert.equal(formatDate(date, 'DD/MM/YYYY'), '15/03/2024');
  });
});
