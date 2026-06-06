/**
 * Unit tests for js/core/holiday-db.js
 * Uses Node.js built-in test runner.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getHolidays,
  expandRecurringHolidays,
  getSupportedCountries,
  getHolidaySet
} from '../js/core/holiday-db.js';

describe('getSupportedCountries', () => {
  it('should return at least 12 countries', () => {
    const countries = getSupportedCountries();
    assert(countries.length >= 12, `Expected at least 12, got ${countries.length}`);
  });

  it('each country should have code and name', () => {
    const countries = getSupportedCountries();
    for (const c of countries) {
      assert(c.code, 'Missing code');
      assert(c.name, 'Missing name');
      assert.equal(c.code.length, 2, 'Country code should be 2 chars');
    }
  });

  it('should include required countries', () => {
    const countries = getSupportedCountries();
    const codes = countries.map(c => c.code);
    const required = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR', 'MX', 'CN', 'KR'];
    for (const code of required) {
      assert(codes.includes(code), `Missing country: ${code}`);
    }
  });
});

describe('getHolidays', () => {
  it('should return US holidays for 2024', () => {
    const holidays = getHolidays('US', 2024);
    assert(holidays.length > 0);
    // Check for New Year
    assert(holidays.some(h => h.date === '2024-01-01' && h.name === "New Year's Day"));
    // Check for Independence Day
    assert(holidays.some(h => h.date === '2024-07-04'));
    // Check for Christmas
    assert(holidays.some(h => h.date === '2024-12-25'));
  });

  it('should return holidays sorted by date', () => {
    const holidays = getHolidays('US', 2024);
    for (let i = 1; i < holidays.length; i++) {
      assert(holidays[i].date >= holidays[i - 1].date, 
        `Not sorted: ${holidays[i - 1].date} > ${holidays[i].date}`);
    }
  });

  it('should correctly calculate Thanksgiving 2024 (4th Thursday of November)', () => {
    const holidays = getHolidays('US', 2024);
    const thanksgiving = holidays.find(h => h.name === 'Thanksgiving Day');
    assert(thanksgiving);
    assert.equal(thanksgiving.date, '2024-11-28');
  });

  it('should correctly calculate Memorial Day 2024 (last Monday of May)', () => {
    const holidays = getHolidays('US', 2024);
    const memorial = holidays.find(h => h.name === 'Memorial Day');
    assert(memorial);
    assert.equal(memorial.date, '2024-05-27');
  });

  it('should correctly calculate MLK Day 2024 (3rd Monday of January)', () => {
    const holidays = getHolidays('US', 2024);
    const mlk = holidays.find(h => h.name === 'Martin Luther King Jr. Day');
    assert(mlk);
    assert.equal(mlk.date, '2024-01-15');
  });

  it('should return UK holidays including Easter-based ones', () => {
    const holidays = getHolidays('GB', 2024);
    assert(holidays.length > 0);
    // Easter 2024 is March 31, so Good Friday is March 29
    const goodFriday = holidays.find(h => h.name === 'Good Friday');
    assert(goodFriday);
    assert.equal(goodFriday.date, '2024-03-29');
    // Easter Monday is April 1
    const easterMon = holidays.find(h => h.name === 'Easter Monday');
    assert(easterMon);
    assert.equal(easterMon.date, '2024-04-01');
  });

  it('should return German holidays', () => {
    const holidays = getHolidays('DE', 2024);
    assert(holidays.length >= 9);
    assert(holidays.some(h => h.name === 'Neujahrstag'));
    assert(holidays.some(h => h.name === 'Tag der Deutschen Einheit'));
  });

  it('should return Japanese holidays', () => {
    const holidays = getHolidays('JP', 2024);
    assert(holidays.length >= 10);
    assert(holidays.some(h => h.name === "New Year's Day"));
    assert(holidays.some(h => h.name === 'Constitution Memorial Day'));
  });

  it('should return empty array for unsupported country', () => {
    const holidays = getHolidays('ZZ', 2024);
    assert.deepEqual(holidays, []);
  });

  it('should return holidays with valid date format', () => {
    const holidays = getHolidays('US', 2024);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const h of holidays) {
      assert(dateRegex.test(h.date), `Invalid date format: ${h.date}`);
    }
  });

  it('all holidays should have isRecurring=true', () => {
    const holidays = getHolidays('FR', 2024);
    for (const h of holidays) {
      assert.equal(h.isRecurring, true);
    }
  });

  it('should handle different years correctly', () => {
    // Thanksgiving 2023 should be November 23 (4th Thursday)
    const holidays2023 = getHolidays('US', 2023);
    const thanksgiving = holidays2023.find(h => h.name === 'Thanksgiving Day');
    assert(thanksgiving);
    assert.equal(thanksgiving.date, '2023-11-23');
  });

  it('should calculate Canadian Victoria Day correctly', () => {
    // Victoria Day 2024: Monday before May 25 = May 20
    const holidays = getHolidays('CA', 2024);
    const victoria = holidays.find(h => h.name === 'Victoria Day');
    assert(victoria);
    assert.equal(victoria.date, '2024-05-20');
  });
});

describe('expandRecurringHolidays', () => {
  it('should expand valid recurring holiday definitions', () => {
    const definitions = [
      { month: 12, day: 25, name: 'Christmas' },
      { month: 1, day: 1, name: 'New Year' }
    ];
    const result = expandRecurringHolidays(definitions, 2024);
    assert.equal(result.length, 2);
    assert(result.includes('2024-12-25'));
    assert(result.includes('2024-01-01'));
  });

  it('should skip invalid definitions', () => {
    const definitions = [
      { month: 2, day: 30, name: 'Invalid' }, // Feb 30 doesn't exist
      { month: 12, day: 25, name: 'Christmas' }
    ];
    const result = expandRecurringHolidays(definitions, 2024);
    assert.equal(result.length, 1);
    assert(result.includes('2024-12-25'));
  });

  it('should handle Feb 29 in leap year', () => {
    const definitions = [{ month: 2, day: 29, name: 'Leap Day' }];
    const result = expandRecurringHolidays(definitions, 2024);
    assert.equal(result.length, 1);
    assert(result.includes('2024-02-29'));
  });

  it('should skip Feb 29 in non-leap year', () => {
    const definitions = [{ month: 2, day: 29, name: 'Leap Day' }];
    const result = expandRecurringHolidays(definitions, 2023);
    assert.equal(result.length, 0);
  });

  it('should return empty array for null/undefined', () => {
    assert.deepEqual(expandRecurringHolidays(null, 2024), []);
    assert.deepEqual(expandRecurringHolidays(undefined, 2024), []);
  });

  it('should handle empty array', () => {
    assert.deepEqual(expandRecurringHolidays([], 2024), []);
  });
});

describe('getHolidaySet', () => {
  it('should return a Set of date strings', () => {
    const set = getHolidaySet('US', 2024);
    assert(set instanceof Set);
    assert(set.size > 0);
  });

  it('should contain known holidays', () => {
    const set = getHolidaySet('US', 2024);
    assert(set.has('2024-01-01')); // New Year
    assert(set.has('2024-07-04')); // Independence Day
    assert(set.has('2024-12-25')); // Christmas
  });

  it('should return empty set for unsupported country', () => {
    const set = getHolidaySet('ZZ', 2024);
    assert.equal(set.size, 0);
  });

  it('should work with countBusinessDays integration', () => {
    // The set is designed to be passed to countBusinessDays
    const set = getHolidaySet('US', 2024);
    // Verify it contains only valid date strings
    for (const dateStr of set) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(dateStr), `Invalid format: ${dateStr}`);
    }
  });
});

describe('Holiday calculations across multiple countries', () => {
  it('should return holidays for all supported countries', () => {
    const countries = getSupportedCountries();
    for (const { code } of countries) {
      const holidays = getHolidays(code, 2024);
      assert(holidays.length > 0, `No holidays found for ${code}`);
    }
  });

  it('Brazil should have Carnival (Easter-based)', () => {
    const holidays = getHolidays('BR', 2024);
    const carnival = holidays.find(h => h.name === 'Carnaval');
    assert(carnival, 'Carnival not found');
    // Easter 2024 is March 31, Carnival is 47 days before = Feb 13
    assert.equal(carnival.date, '2024-02-13');
  });

  it('Mexico should have Revolution Day (3rd Monday of November)', () => {
    const holidays = getHolidays('MX', 2024);
    const revolution = holidays.find(h => h.name === 'Dia de la Revolucion');
    assert(revolution);
    assert.equal(revolution.date, '2024-11-18');
  });
});
