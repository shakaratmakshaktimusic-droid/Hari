/**
 * Unit tests for js/core/date-calc.js
 * Uses Node.js built-in test runner (no external dependencies).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getDayOfWeek,
  getDayOfWeekName,
  dateToSerial,
  serialToDate,
  compareDates,
  calculateDuration,
  addToDate,
  subtractFromDate,
  countWeekdays,
  findNthWeekday,
  countBusinessDays,
  addBusinessDays,
  getISOWeekNumber,
  getISOWeekDates,
  getDayOfYear,
  getDaysInYear,
  getDaysRemainingInYear
} from '../js/core/date-calc.js';

describe('getDayOfWeek', () => {
  it('should return correct day for known dates', () => {
    // 2024-01-01 is Monday (1)
    assert.equal(getDayOfWeek(2024, 1, 1), 1);
    // 2024-03-15 is Friday (5)
    assert.equal(getDayOfWeek(2024, 3, 15), 5);
    // 2000-01-01 is Saturday (6)
    assert.equal(getDayOfWeek(2000, 1, 1), 6);
    // 1970-01-01 is Thursday (4)
    assert.equal(getDayOfWeek(1970, 1, 1), 4);
    // 2023-12-25 is Monday (1)
    assert.equal(getDayOfWeek(2023, 12, 25), 1);
  });

  it('should handle edge dates (year 1 and year 9999)', () => {
    // 0001-01-01 is Monday (1)
    assert.equal(getDayOfWeek(1, 1, 1), 1);
    // Verify it returns a value in 0-6 for 9999-12-31
    const dow = getDayOfWeek(9999, 12, 31);
    assert(dow >= 0 && dow <= 6, `Expected 0-6, got ${dow}`);
  });
});

describe('getDayOfWeekName', () => {
  it('should return correct names', () => {
    assert.equal(getDayOfWeekName(2024, 1, 1), 'Monday');
    assert.equal(getDayOfWeekName(2024, 1, 7), 'Sunday');
    assert.equal(getDayOfWeekName(2024, 1, 6), 'Saturday');
  });
});

describe('dateToSerial and serialToDate', () => {
  it('should round-trip correctly', () => {
    const dates = [
      { year: 1, month: 1, day: 1 },
      { year: 2000, month: 2, day: 29 },
      { year: 2024, month: 6, day: 15 },
      { year: 9999, month: 12, day: 31 },
      { year: 1900, month: 3, day: 1 },
    ];
    for (const date of dates) {
      const serial = dateToSerial(date.year, date.month, date.day);
      const result = serialToDate(serial);
      assert.deepEqual(result, date, `Failed for ${JSON.stringify(date)}, serial=${serial}`);
    }
  });

  it('serial for 0001-01-01 should be 1', () => {
    assert.equal(dateToSerial(1, 1, 1), 1);
  });

  it('serial for consecutive days should differ by 1', () => {
    const s1 = dateToSerial(2024, 1, 15);
    const s2 = dateToSerial(2024, 1, 16);
    assert.equal(s2 - s1, 1);
  });
});

describe('compareDates', () => {
  it('should return 0 for equal dates', () => {
    assert.equal(compareDates({ year: 2024, month: 1, day: 1 }, { year: 2024, month: 1, day: 1 }), 0);
  });

  it('should return -1 when a < b', () => {
    assert.equal(compareDates({ year: 2023, month: 12, day: 31 }, { year: 2024, month: 1, day: 1 }), -1);
  });

  it('should return 1 when a > b', () => {
    assert.equal(compareDates({ year: 2024, month: 6, day: 15 }, { year: 2024, month: 6, day: 14 }), 1);
  });
});

describe('calculateDuration', () => {
  it('should calculate basic duration', () => {
    const result = calculateDuration(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 31 }
    );
    assert.equal(result.totalDays, 30);
    assert.equal(result.reversed, false);
  });

  it('should handle include end date', () => {
    const result = calculateDuration(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 31 },
      true
    );
    assert.equal(result.totalDays, 31);
  });

  it('should handle reversed dates', () => {
    const result = calculateDuration(
      { year: 2024, month: 6, day: 15 },
      { year: 2024, month: 1, day: 1 }
    );
    assert.equal(result.reversed, true);
    assert(result.totalDays > 0);
  });

  it('should return correct breakdown', () => {
    const result = calculateDuration(
      { year: 2023, month: 1, day: 1 },
      { year: 2024, month: 3, day: 15 }
    );
    assert.equal(result.breakdown.years, 1);
    assert.equal(result.breakdown.months, 2);
    // Remaining days: Jan 1 to Mar 15 minus 1 year 2 months = 14 days
    assert(result.breakdown.days >= 0);
    assert(result.breakdown.weeks >= 0);
  });

  it('should calculate hours/minutes/seconds from total days', () => {
    const result = calculateDuration(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 2 }
    );
    assert.equal(result.totalDays, 1);
    assert.equal(result.totalHours, 24);
    assert.equal(result.totalMinutes, 1440);
    assert.equal(result.totalSeconds, 86400);
  });

  it('should return 0 for same dates', () => {
    const result = calculateDuration(
      { year: 2024, month: 6, day: 15 },
      { year: 2024, month: 6, day: 15 }
    );
    assert.equal(result.totalDays, 0);
  });
});

describe('addToDate', () => {
  it('should add days correctly', () => {
    const result = addToDate({ year: 2024, month: 1, day: 30 }, { days: 5 });
    assert.deepEqual(result, { year: 2024, month: 2, day: 4 });
  });

  it('should add months with overflow capping', () => {
    // Jan 31 + 1 month = Feb 29 (2024 is leap year)
    const result = addToDate({ year: 2024, month: 1, day: 31 }, { months: 1 });
    assert.deepEqual(result, { year: 2024, month: 2, day: 29 });
  });

  it('should add months with overflow capping (non-leap)', () => {
    // Jan 31 + 1 month in non-leap year = Feb 28
    const result = addToDate({ year: 2023, month: 1, day: 31 }, { months: 1 });
    assert.deepEqual(result, { year: 2023, month: 2, day: 28 });
  });

  it('should add years correctly', () => {
    const result = addToDate({ year: 2024, month: 2, day: 29 }, { years: 1 });
    // 2025 is not a leap year, so Feb 29 caps to Feb 28
    assert.deepEqual(result, { year: 2025, month: 2, day: 28 });
  });

  it('should add weeks correctly', () => {
    const result = addToDate({ year: 2024, month: 1, day: 1 }, { weeks: 2 });
    assert.deepEqual(result, { year: 2024, month: 1, day: 15 });
  });

  it('should handle combined offsets', () => {
    // Add 1 year, 2 months, 1 week, 3 days to 2024-01-01
    const result = addToDate({ year: 2024, month: 1, day: 1 }, { years: 1, months: 2, weeks: 1, days: 3 });
    // 2024-01-01 + 1 year = 2025-01-01
    // + 2 months = 2025-03-01
    // + 1 week + 3 days = + 10 days = 2025-03-11
    assert.deepEqual(result, { year: 2025, month: 3, day: 11 });
  });
});

describe('subtractFromDate', () => {
  it('should subtract days correctly', () => {
    const result = subtractFromDate({ year: 2024, month: 2, day: 4 }, { days: 5 });
    assert.deepEqual(result, { year: 2024, month: 1, day: 30 });
  });

  it('should subtract months correctly', () => {
    const result = subtractFromDate({ year: 2024, month: 3, day: 31 }, { months: 1 });
    // March 31 - 1 month = Feb 29 (2024 is leap year) because month subtraction caps
    assert.deepEqual(result, { year: 2024, month: 2, day: 29 });
  });
});

describe('countWeekdays', () => {
  it('should count Mondays in January 2024', () => {
    // January 2024: Mon 1, 8, 15, 22, 29 = 5 Mondays
    const result = countWeekdays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 31 },
      [1] // Monday
    );
    assert.equal(result.get(1), 5);
  });

  it('should count multiple weekdays', () => {
    const result = countWeekdays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 7 },
      [1, 5] // Monday and Friday
    );
    // Jan 1 = Mon, Jan 5 = Fri, Jan 7 = Sun
    assert.equal(result.get(1), 1); // Monday: Jan 1
    assert.equal(result.get(5), 1); // Friday: Jan 5
  });

  it('should handle reversed dates', () => {
    const result = countWeekdays(
      { year: 2024, month: 1, day: 31 },
      { year: 2024, month: 1, day: 1 },
      [1]
    );
    assert.equal(result.get(1), 5);
  });
});

describe('findNthWeekday', () => {
  it('should find first Monday of January 2024', () => {
    const result = findNthWeekday(2024, 1, 1, 1); // Monday=1, n=1
    assert.deepEqual(result, { year: 2024, month: 1, day: 1 });
  });

  it('should find third Thursday of November 2024 (Thanksgiving)', () => {
    const result = findNthWeekday(2024, 11, 4, 4); // Thursday=4, n=4
    assert.deepEqual(result, { year: 2024, month: 11, day: 28 });
  });

  it('should return null for 5th occurrence that does not exist', () => {
    // 5th Monday of February 2024? Feb has Mon 5, 12, 19, 26 = 4 Mondays
    const result = findNthWeekday(2024, 2, 1, 5);
    assert.equal(result, null);
  });

  it('should return null for invalid n', () => {
    assert.equal(findNthWeekday(2024, 1, 1, 0), null);
    assert.equal(findNthWeekday(2024, 1, 1, 6), null);
  });
});

describe('countBusinessDays', () => {
  it('should count business days excluding weekends', () => {
    // Mon Jan 1 to Fri Jan 5: count = 4 (Tue, Wed, Thu, Fri)
    const result = countBusinessDays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 5 }
    );
    assert.equal(result, 4);
  });

  it('should exclude holidays', () => {
    const holidays = new Set(['2024-01-02']);
    const result = countBusinessDays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 5 },
      holidays
    );
    assert.equal(result, 3); // Tue is a holiday
  });

  it('should return 0 for same day', () => {
    const result = countBusinessDays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 1 }
    );
    assert.equal(result, 0);
  });

  it('should skip full weekends', () => {
    // Mon Jan 1 to Mon Jan 8: count = 5 (Tue-Fri + Mon)
    const result = countBusinessDays(
      { year: 2024, month: 1, day: 1 },
      { year: 2024, month: 1, day: 8 }
    );
    assert.equal(result, 5);
  });
});

describe('addBusinessDays', () => {
  it('should add business days forward', () => {
    // Starting Mon Jan 1, add 5 business days = Mon Jan 8
    const result = addBusinessDays({ year: 2024, month: 1, day: 1 }, 5);
    assert.deepEqual(result, { year: 2024, month: 1, day: 8 });
  });

  it('should skip holidays', () => {
    const holidays = new Set(['2024-01-02']);
    // Starting Mon Jan 1, add 5 business days skipping Tue = Tue Jan 9
    const result = addBusinessDays({ year: 2024, month: 1, day: 1 }, 5, holidays);
    assert.deepEqual(result, { year: 2024, month: 1, day: 9 });
  });

  it('should handle 0 business days', () => {
    const result = addBusinessDays({ year: 2024, month: 1, day: 1 }, 0);
    assert.deepEqual(result, { year: 2024, month: 1, day: 1 });
  });

  it('should handle negative business days', () => {
    // Starting Mon Jan 8, subtract 5 business days = Mon Jan 1
    const result = addBusinessDays({ year: 2024, month: 1, day: 8 }, -5);
    assert.deepEqual(result, { year: 2024, month: 1, day: 1 });
  });
});

describe('getISOWeekNumber', () => {
  it('should return week 1 for Jan 4 of any year', () => {
    // Jan 4 is always in week 1 by definition
    assert.equal(getISOWeekNumber(2024, 1, 4).isoWeek, 1);
    assert.equal(getISOWeekNumber(2023, 1, 4).isoWeek, 1);
  });

  it('should handle year boundary (Dec 31 might be week 1 of next year)', () => {
    // 2020-12-31 is Thursday, which is ISO week 53 of 2020
    const result = getISOWeekNumber(2020, 12, 31);
    assert.equal(result.isoWeek, 53);
    assert.equal(result.isoYear, 2020);
  });

  it('should handle Jan 1 being in previous ISO year', () => {
    // 2021-01-01 is Friday. ISO week 53 of 2020.
    const result = getISOWeekNumber(2021, 1, 1);
    assert.equal(result.isoWeek, 53);
    assert.equal(result.isoYear, 2020);
  });

  it('should return correct week for known date', () => {
    // 2024-06-15 is Saturday, ISO week 24 of 2024
    const result = getISOWeekNumber(2024, 6, 15);
    assert.equal(result.isoWeek, 24);
    assert.equal(result.isoYear, 2024);
  });
});

describe('getISOWeekDates', () => {
  it('should return Monday-Sunday span', () => {
    const result = getISOWeekDates(2024, 1);
    // ISO Week 1 of 2024: Mon Jan 1 - Sun Jan 7
    assert.deepEqual(result.start, { year: 2024, month: 1, day: 1 });
    assert.deepEqual(result.end, { year: 2024, month: 1, day: 7 });
  });

  it('should span exactly 7 days', () => {
    const result = getISOWeekDates(2024, 10);
    const startSerial = dateToSerial(result.start.year, result.start.month, result.start.day);
    const endSerial = dateToSerial(result.end.year, result.end.month, result.end.day);
    assert.equal(endSerial - startSerial, 6); // Mon to Sun = 6 day difference
  });

  it('start should be Monday', () => {
    const result = getISOWeekDates(2024, 5);
    assert.equal(getDayOfWeek(result.start.year, result.start.month, result.start.day), 1);
  });

  it('end should be Sunday', () => {
    const result = getISOWeekDates(2024, 5);
    assert.equal(getDayOfWeek(result.end.year, result.end.month, result.end.day), 0);
  });
});

describe('getDayOfYear', () => {
  it('should return 1 for Jan 1', () => {
    assert.equal(getDayOfYear(2024, 1, 1), 1);
  });

  it('should return 366 for Dec 31 of leap year', () => {
    assert.equal(getDayOfYear(2024, 12, 31), 366);
  });

  it('should return 365 for Dec 31 of non-leap year', () => {
    assert.equal(getDayOfYear(2023, 12, 31), 365);
  });

  it('should handle leap day', () => {
    assert.equal(getDayOfYear(2024, 2, 29), 60);
  });
});

describe('getDaysInYear', () => {
  it('should return 366 for leap years', () => {
    assert.equal(getDaysInYear(2024), 366);
    assert.equal(getDaysInYear(2000), 366);
  });

  it('should return 365 for non-leap years', () => {
    assert.equal(getDaysInYear(2023), 365);
    assert.equal(getDaysInYear(1900), 365);
  });
});

describe('getDaysRemainingInYear', () => {
  it('should return 0 for Dec 31', () => {
    assert.equal(getDaysRemainingInYear(2024, 12, 31), 0);
  });

  it('should return daysInYear - 1 for Jan 1', () => {
    assert.equal(getDaysRemainingInYear(2024, 1, 1), 365); // 366 - 1
    assert.equal(getDaysRemainingInYear(2023, 1, 1), 364); // 365 - 1
  });

  it('dayOfYear + daysRemaining = daysInYear', () => {
    const year = 2024;
    const month = 6;
    const day = 15;
    const doy = getDayOfYear(year, month, day);
    const remaining = getDaysRemainingInYear(year, month, day);
    assert.equal(doy + remaining, getDaysInYear(year));
  });
});
