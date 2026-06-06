/**
 * Unit tests for js/calculators/arithmetic.js
 * Tests the core arithmetic logic - operation chaining, business day toggle,
 * month-end overflow handling.
 * 
 * Since ArithmeticCalculator is a DOM-dependent UI module, we test the underlying
 * core functions it relies on (addToDate, subtractFromDate, addBusinessDays)
 * in the context of chained arithmetic operations.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { addToDate, subtractFromDate, addBusinessDays, getDayOfWeekName } from '../js/core/date-calc.js';

describe('Date Arithmetic - Add/Subtract operations', () => {
  it('should add days to a date (Req 6.1)', () => {
    const start = { year: 2024, month: 1, day: 15 };
    const result = addToDate(start, { days: 10 });
    assert.deepEqual(result, { year: 2024, month: 1, day: 25 });
  });

  it('should subtract days from a date (Req 6.2)', () => {
    const start = { year: 2024, month: 3, day: 1 };
    const result = subtractFromDate(start, { days: 1 });
    assert.deepEqual(result, { year: 2024, month: 2, day: 29 }); // 2024 is leap year
  });

  it('should add weeks to a date (Req 6.2)', () => {
    const start = { year: 2024, month: 6, day: 1 };
    const result = addToDate(start, { weeks: 2 });
    assert.deepEqual(result, { year: 2024, month: 6, day: 15 });
  });

  it('should add months to a date (Req 6.2)', () => {
    const start = { year: 2024, month: 3, day: 15 };
    const result = addToDate(start, { months: 3 });
    assert.deepEqual(result, { year: 2024, month: 6, day: 15 });
  });

  it('should add years to a date (Req 6.2)', () => {
    const start = { year: 2020, month: 7, day: 4 };
    const result = addToDate(start, { years: 4 });
    assert.deepEqual(result, { year: 2024, month: 7, day: 4 });
  });

  it('should handle combined add of months and days (Req 6.2)', () => {
    const start = { year: 2024, month: 1, day: 10 };
    const result = addToDate(start, { months: 2, days: 5 });
    assert.deepEqual(result, { year: 2024, month: 3, day: 15 });
  });
});

describe('Date Arithmetic - Month-end overflow (Req 6.3)', () => {
  it('should cap Jan 31 + 1 month to Feb 29 in leap year', () => {
    const start = { year: 2024, month: 1, day: 31 };
    const result = addToDate(start, { months: 1 });
    assert.deepEqual(result, { year: 2024, month: 2, day: 29 });
  });

  it('should cap Jan 31 + 1 month to Feb 28 in non-leap year', () => {
    const start = { year: 2023, month: 1, day: 31 };
    const result = addToDate(start, { months: 1 });
    assert.deepEqual(result, { year: 2023, month: 2, day: 28 });
  });

  it('should cap Mar 31 + 1 month to Apr 30', () => {
    const start = { year: 2024, month: 3, day: 31 };
    const result = addToDate(start, { months: 1 });
    assert.deepEqual(result, { year: 2024, month: 4, day: 30 });
  });

  it('should cap Aug 31 - 1 month to Jul 31 (no overflow)', () => {
    const start = { year: 2024, month: 8, day: 31 };
    const result = subtractFromDate(start, { months: 1 });
    assert.deepEqual(result, { year: 2024, month: 7, day: 31 });
  });
});

describe('Date Arithmetic - Chaining operations (Req 6.4)', () => {
  it('should chain add 2 months then subtract 5 days', () => {
    let date = { year: 2024, month: 1, day: 15 };
    // Operation 1: +2 months
    date = addToDate(date, { months: 2 });
    assert.deepEqual(date, { year: 2024, month: 3, day: 15 });
    // Operation 2: -5 days
    date = subtractFromDate(date, { days: 5 });
    assert.deepEqual(date, { year: 2024, month: 3, day: 10 });
  });

  it('should chain add 1 year, add 6 months, subtract 3 weeks', () => {
    let date = { year: 2023, month: 6, day: 15 };
    // +1 year
    date = addToDate(date, { years: 1 });
    assert.deepEqual(date, { year: 2024, month: 6, day: 15 });
    // +6 months
    date = addToDate(date, { months: 6 });
    assert.deepEqual(date, { year: 2024, month: 12, day: 15 });
    // -3 weeks
    date = subtractFromDate(date, { weeks: 3 });
    assert.deepEqual(date, { year: 2024, month: 11, day: 24 });
  });

  it('should chain operations with month-end overflow in sequence', () => {
    let date = { year: 2024, month: 1, day: 31 };
    // +1 month → Feb 29 (2024 leap year)
    date = addToDate(date, { months: 1 });
    assert.deepEqual(date, { year: 2024, month: 2, day: 29 });
    // +1 month → Mar 29
    date = addToDate(date, { months: 1 });
    assert.deepEqual(date, { year: 2024, month: 3, day: 29 });
  });
});

describe('Date Arithmetic - Result includes day of week (Req 6.5)', () => {
  it('should compute correct day of week for result dates', () => {
    const start = { year: 2024, month: 1, day: 1 }; // Monday
    const result = addToDate(start, { days: 4 }); // Jan 5, 2024 = Friday
    const dayName = getDayOfWeekName(result.year, result.month, result.day);
    assert.equal(dayName, 'Friday');
  });

  it('should show day of week for start date', () => {
    const dayName = getDayOfWeekName(2024, 1, 1);
    assert.equal(dayName, 'Monday');
  });
});

describe('Date Arithmetic - Business days toggle (Req 6.6)', () => {
  it('should add business days skipping weekends', () => {
    // 2024-01-01 is Monday. Add 5 business days → Jan 8 (next Monday)
    const start = { year: 2024, month: 1, day: 1 };
    const result = addBusinessDays(start, 5);
    assert.deepEqual(result, { year: 2024, month: 1, day: 8 });
  });

  it('should subtract business days skipping weekends', () => {
    // 2024-01-08 is Monday. Subtract 5 business days → Jan 1 (previous Monday)
    const start = { year: 2024, month: 1, day: 8 };
    const result = addBusinessDays(start, -5);
    assert.deepEqual(result, { year: 2024, month: 1, day: 1 });
  });

  it('should add business days across a weekend', () => {
    // 2024-01-05 is Friday. Add 1 business day → Jan 8 (Monday)
    const start = { year: 2024, month: 1, day: 5 };
    const result = addBusinessDays(start, 1);
    assert.deepEqual(result, { year: 2024, month: 1, day: 8 });
  });

  it('should add 10 business days (2 full weeks)', () => {
    // 2024-01-01 is Monday. Add 10 business days → Jan 15 (Monday after 2 weekends)
    const start = { year: 2024, month: 1, day: 1 };
    const result = addBusinessDays(start, 10);
    assert.deepEqual(result, { year: 2024, month: 1, day: 15 });
  });
});
