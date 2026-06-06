/**
 * Unit tests for js/calculators/weekday.js
 * Tests the WeekdayCalculator module's calculation logic using core functions.
 * Uses Node.js built-in test runner.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { countWeekdays, findNthWeekday, getDayOfWeek } from '../js/core/date-calc.js';

describe('WeekdayCalculator - Count Mode Logic', () => {
  describe('countWeekdays', () => {
    it('should count Mondays in January 2024', () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 31 };
      const result = countWeekdays(start, end, [1]); // Monday = 1
      // Jan 2024: Mondays are 1, 8, 15, 22, 29 = 5
      assert.equal(result.get(1), 5);
    });

    it('should count multiple weekdays simultaneously', () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 31 };
      const result = countWeekdays(start, end, [1, 5]); // Monday and Friday
      // Jan 2024: Mondays = 5, Fridays (5, 12, 19, 26) = 4
      assert.equal(result.get(1), 5);
      assert.equal(result.get(5), 4);
    });

    it('should handle single-day range where day matches weekday', () => {
      // 2024-01-01 is Monday
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 1 };
      const result = countWeekdays(start, end, [1]); // Monday
      assert.equal(result.get(1), 1);
    });

    it('should handle single-day range where day does not match', () => {
      // 2024-01-01 is Monday, counting Tuesdays
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 1 };
      const result = countWeekdays(start, end, [2]); // Tuesday
      assert.equal(result.get(2), 0);
    });

    it('should handle reversed date range', () => {
      const start = { year: 2024, month: 1, day: 31 };
      const end = { year: 2024, month: 1, day: 1 };
      const result = countWeekdays(start, end, [1]); // Monday
      assert.equal(result.get(1), 5);
    });

    it('should count all 7 weekdays for a full week', () => {
      // A full week Mon-Sun: 2024-01-01 (Mon) to 2024-01-07 (Sun)
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 7 };
      const weekdays = [0, 1, 2, 3, 4, 5, 6];
      const result = countWeekdays(start, end, weekdays);
      // Each weekday appears exactly once
      for (const wd of weekdays) {
        assert.equal(result.get(wd), 1);
      }
    });

    it('should count Saturdays and Sundays (weekends) in February 2024', () => {
      const start = { year: 2024, month: 2, day: 1 };
      const end = { year: 2024, month: 2, day: 29 }; // 2024 is leap year
      const result = countWeekdays(start, end, [0, 6]); // Sunday, Saturday
      // Feb 2024: Saturdays (3,10,17,24) = 4, Sundays (4,11,18,25) = 4
      assert.equal(result.get(6), 4); // Saturday
      assert.equal(result.get(0), 4); // Sunday
    });
  });
});

describe('WeekdayCalculator - Nth Weekday Mode Logic', () => {
  describe('findNthWeekday', () => {
    it('should find the 1st Monday of January 2024', () => {
      const result = findNthWeekday(2024, 1, 1, 1); // year, month, weekday(Mon=1), n=1
      // Jan 1, 2024 is Monday
      assert.deepEqual(result, { year: 2024, month: 1, day: 1 });
    });

    it('should find the 2nd Friday of March 2024', () => {
      const result = findNthWeekday(2024, 3, 5, 2); // year, month, weekday(Fri=5), n=2
      // March 2024: 1st Fri = 1st, 2nd Fri = 8th
      assert.deepEqual(result, { year: 2024, month: 3, day: 8 });
    });

    it('should find the 3rd Wednesday of June 2024', () => {
      const result = findNthWeekday(2024, 6, 3, 3); // year, month, weekday(Wed=3), n=3
      // June 2024: 1st Wed = 5th, 2nd Wed = 12th, 3rd Wed = 19th
      assert.deepEqual(result, { year: 2024, month: 6, day: 19 });
    });

    it('should find the 4th Thursday of November 2024 (Thanksgiving)', () => {
      const result = findNthWeekday(2024, 11, 4, 4); // year, month, weekday(Thu=4), n=4
      // Nov 2024: 1st Thu = 7th, 2nd = 14th, 3rd = 21st, 4th = 28th
      assert.deepEqual(result, { year: 2024, month: 11, day: 28 });
    });

    it('should return null for 5th Monday of February 2024 (does not exist)', () => {
      const result = findNthWeekday(2024, 2, 1, 5); // year, month, weekday(Mon=1), n=5
      // Feb 2024 has only 4 Mondays (5, 12, 19, 26)
      assert.equal(result, null);
    });

    it('should find the 5th Wednesday of January 2025', () => {
      const result = findNthWeekday(2025, 1, 3, 5); // year, month, weekday(Wed=3), n=5
      // Jan 2025: 1st Wed = 1st, 2nd = 8th, 3rd = 15th, 4th = 22nd, 5th = 29th
      assert.deepEqual(result, { year: 2025, month: 1, day: 29 });
    });

    it('should return null for invalid n values', () => {
      assert.equal(findNthWeekday(2024, 1, 1, 0), null);
      assert.equal(findNthWeekday(2024, 1, 1, 6), null);
    });

    it('should verify result falls on the correct weekday', () => {
      const result = findNthWeekday(2024, 7, 0, 2); // 2nd Sunday of July 2024
      assert.notEqual(result, null);
      const dow = getDayOfWeek(result.year, result.month, result.day);
      assert.equal(dow, 0); // Sunday
    });
  });
});
