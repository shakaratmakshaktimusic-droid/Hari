/**
 * Unit tests for js/calculators/business-days.js
 * Tests the core calculation logic via the underlying functions.
 * Uses Node.js built-in test runner.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { countBusinessDays, addBusinessDays } from '../js/core/date-calc.js';
import { getHolidaySet, getSupportedCountries, getHolidays, expandRecurringHolidays } from '../js/core/holiday-db.js';

describe('Business Day Calculator - countBetween logic', () => {
  it('should count weekdays only when no holidays provided', () => {
    // Mon Jan 1, 2024 to Fri Jan 5, 2024 → 4 business days (Tue–Fri)
    const start = { year: 2024, month: 1, day: 1 };
    const end = { year: 2024, month: 1, day: 5 };
    const result = countBusinessDays(start, end, new Set());
    assert.equal(result, 4);
  });

  it('should exclude weekends from count', () => {
    // Mon Jan 1, 2024 to Mon Jan 8, 2024 → 5 biz days (Tue-Fri, Mon)
    const start = { year: 2024, month: 1, day: 1 };
    const end = { year: 2024, month: 1, day: 8 };
    const result = countBusinessDays(start, end, new Set());
    assert.equal(result, 5);
  });

  it('should exclude holidays that fall on weekdays', () => {
    // Mon Jan 1, 2024 to Fri Jan 5, 2024, with Jan 3 (Wed) as holiday
    const start = { year: 2024, month: 1, day: 1 };
    const end = { year: 2024, month: 1, day: 5 };
    const holidays = new Set(['2024-01-03']);
    const result = countBusinessDays(start, end, holidays);
    assert.equal(result, 3);
  });

  it('should not double-count holidays on weekends', () => {
    // Fri Jan 5, 2024 to Mon Jan 8, 2024 with Jan 6 (Sat) as holiday
    const start = { year: 2024, month: 1, day: 5 };
    const end = { year: 2024, month: 1, day: 8 };
    const holidays = new Set(['2024-01-06']);
    const result = countBusinessDays(start, end, holidays);
    // Only Mon Jan 8 is a business day
    assert.equal(result, 1);
  });

  it('should return 0 for same date', () => {
    const date = { year: 2024, month: 3, day: 15 };
    const result = countBusinessDays(date, date, new Set());
    assert.equal(result, 0);
  });

  it('should handle reversed dates', () => {
    const start = { year: 2024, month: 1, day: 5 };
    const end = { year: 2024, month: 1, day: 1 };
    const result = countBusinessDays(start, end, new Set());
    assert.equal(result, 4);
  });

  it('should work with country holiday set from holiday-db', () => {
    const start = { year: 2024, month: 12, day: 23 };
    const end = { year: 2024, month: 12, day: 27 };
    const holidays = getHolidaySet('US', 2024);
    const result = countBusinessDays(start, end, holidays);
    // Dec 24 (Tue), Dec 25 (Wed, Christmas), Dec 26 (Thu), Dec 27 (Fri)
    // Without holidays: 4, with Christmas: 3
    assert.equal(result, 3);
  });
});

describe('Business Day Calculator - addDays logic', () => {
  it('should add business days skipping weekends', () => {
    // Start on Fri Jan 5, 2024, add 1 business day → Mon Jan 8, 2024
    const start = { year: 2024, month: 1, day: 5 };
    const result = addBusinessDays(start, 1, new Set());
    assert.deepEqual(result, { year: 2024, month: 1, day: 8 });
  });

  it('should add multiple business days', () => {
    // Start on Mon Jan 1, 2024, add 5 business days → Mon Jan 8, 2024
    const start = { year: 2024, month: 1, day: 1 };
    const result = addBusinessDays(start, 5, new Set());
    assert.deepEqual(result, { year: 2024, month: 1, day: 8 });
  });

  it('should skip holidays when adding business days', () => {
    // Start Mon Jan 1, 2024, add 5 biz days, with Wed Jan 3 as holiday
    // Normal: Mon→Tue→Wed→Thu→Fri → Jan 8
    // With holiday on Jan 3: Mon→Tue→(skip Wed)→Thu→Fri→Mon → Jan 9
    const start = { year: 2024, month: 1, day: 1 };
    const holidays = new Set(['2024-01-03']);
    const result = addBusinessDays(start, 5, holidays);
    assert.deepEqual(result, { year: 2024, month: 1, day: 9 });
  });

  it('should handle 0 business days', () => {
    const start = { year: 2024, month: 3, day: 15 };
    const result = addBusinessDays(start, 0, new Set());
    assert.deepEqual(result, { year: 2024, month: 3, day: 15 });
  });

  it('should handle negative business days (go backward)', () => {
    // Start Mon Jan 8, 2024, subtract 1 business day → Fri Jan 5
    const start = { year: 2024, month: 1, day: 8 };
    const result = addBusinessDays(start, -1, new Set());
    assert.deepEqual(result, { year: 2024, month: 1, day: 5 });
  });
});

describe('Business Day Calculator - holiday integration', () => {
  it('should list 12 supported countries', () => {
    const countries = getSupportedCountries();
    assert.ok(countries.length >= 12);
    const codes = countries.map(c => c.code);
    assert.ok(codes.includes('US'));
    assert.ok(codes.includes('GB'));
    assert.ok(codes.includes('DE'));
    assert.ok(codes.includes('JP'));
    assert.ok(codes.includes('IN'));
  });

  it('should return holidays for each country', () => {
    const countries = getSupportedCountries();
    for (const country of countries) {
      const holidays = getHolidays(country.code, 2024);
      assert.ok(holidays.length > 0, `${country.name} should have holidays`);
      for (const h of holidays) {
        assert.ok(h.date, `Holiday must have a date`);
        assert.ok(h.name, `Holiday must have a name`);
        assert.match(h.date, /^\d{4}-\d{2}-\d{2}$/, `Date format should be YYYY-MM-DD`);
      }
    }
  });

  it('should expand custom recurring holidays', () => {
    const customs = [
      { month: 12, day: 25, name: 'Christmas' },
      { month: 1, day: 1, name: "New Year's Day" }
    ];
    const dates = expandRecurringHolidays(customs, 2024);
    assert.ok(dates.includes('2024-12-25'));
    assert.ok(dates.includes('2024-01-01'));
  });

  it('should handle invalid custom holiday gracefully', () => {
    const customs = [
      { month: 2, day: 30, name: 'Invalid' },  // Feb 30 doesn't exist
      { month: 12, day: 25, name: 'Christmas' }
    ];
    const dates = expandRecurringHolidays(customs, 2024);
    // Feb 30 should be skipped, Christmas should remain
    assert.ok(!dates.includes('2024-02-30'));
    assert.ok(dates.includes('2024-12-25'));
  });
});
