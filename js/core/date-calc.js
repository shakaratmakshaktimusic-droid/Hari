/**
 * DateCalc - Pure functions for all date arithmetic and calculations
 * No external dependencies. All functions are pure and deterministic.
 */

import { isLeapYear, getDaysInMonth, validateDate } from './date-parser.js';

/**
 * Returns the day of the week (0=Sunday, 6=Saturday) using Zeller's congruence.
 * Works for dates from 0001-01-01 to 9999-12-31.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {number} dayOfWeek (0=Sunday, 6=Saturday)
 */
export function getDayOfWeek(year, month, day) {
  // Zeller's congruence: adjust month so March=3, April=4, ..., January=13, February=14
  let m = month;
  let y = year;
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;
  // Zeller returns h where 0=Saturday, 1=Sunday, 2=Monday, ..., 6=Friday
  // Convert to 0=Sunday, 1=Monday, ..., 6=Saturday
  const dow = ((h + 6) % 7);
  return dow;
}

/**
 * Returns the day-of-week name (e.g., "Monday")
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {string}
 */
export function getDayOfWeekName(year, month, day) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[getDayOfWeek(year, month, day)];
}

/**
 * Converts a date to a serial day number (days since epoch 0001-01-01 = day 1).
 * Used for efficient date arithmetic.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {number}
 */
export function dateToSerial(year, month, day) {
  // Count days from year 1, month 1, day 1 as serial = 1
  const y = year - 1;
  // Days from complete years
  let serial = y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
  // Days from complete months in current year
  for (let m = 1; m < month; m++) {
    serial += getDaysInMonth(year, m);
  }
  // Days in current month
  serial += day;
  return serial;
}

/**
 * Converts a serial day number back to a date.
 * @param {number} serial
 * @returns {{year: number, month: number, day: number}}
 */
export function serialToDate(serial) {
  // Estimate year (365.2425 days per year on average)
  let year = Math.floor((serial - 1) / 365.2425) + 1;

  // Adjust year: serial for start of estimated year
  while (dateToSerial(year + 1, 1, 1) <= serial) {
    year++;
  }
  while (dateToSerial(year, 1, 1) > serial) {
    year--;
  }

  // Find month
  let remaining = serial - dateToSerial(year, 1, 1) + 1;
  let month = 1;
  while (month < 12) {
    const dim = getDaysInMonth(year, month);
    if (remaining <= dim) break;
    remaining -= dim;
    month++;
  }

  return { year, month, day: remaining };
}

/**
 * Compares two dates. Returns -1, 0, or 1.
 * @param {{year: number, month: number, day: number}} a
 * @param {{year: number, month: number, day: number}} b
 * @returns {number}
 */
export function compareDates(a, b) {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return 0;
}

/**
 * Calculates duration between two dates.
 * Returns: { totalDays, totalHours, totalMinutes, totalSeconds, breakdown: {years, months, weeks, days}, reversed }
 * @param {{year: number, month: number, day: number}} startDate
 * @param {{year: number, month: number, day: number}} endDate
 * @param {boolean} includeEndDate - If true, adds one day to the count
 * @returns {{totalDays: number, totalHours: number, totalMinutes: number, totalSeconds: number, breakdown: {years: number, months: number, weeks: number, days: number}, reversed: boolean}}
 */
export function calculateDuration(startDate, endDate, includeEndDate = false) {
  let reversed = false;
  let start = startDate;
  let end = endDate;

  if (compareDates(start, end) > 0) {
    reversed = true;
    start = endDate;
    end = startDate;
  }

  // Total days
  let totalDays = dateToSerial(end.year, end.month, end.day) - dateToSerial(start.year, start.month, start.day);
  if (includeEndDate) {
    totalDays += 1;
  }

  const totalHours = totalDays * 24;
  const totalMinutes = totalDays * 24 * 60;
  const totalSeconds = totalDays * 24 * 60 * 60;

  // Breakdown: years, months, then remaining days
  const breakdown = computeBreakdown(start, end, includeEndDate);

  return {
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    breakdown,
    reversed
  };
}

/**
 * Computes the breakdown of duration into years, months, weeks, and days.
 * @param {{year: number, month: number, day: number}} start
 * @param {{year: number, month: number, day: number}} end
 * @param {boolean} includeEndDate
 * @returns {{years: number, months: number, weeks: number, days: number}}
 */
function computeBreakdown(start, end, includeEndDate) {
  // If includeEndDate, we treat the period as [start, end] inclusive
  // effectively add 1 day to end for breakdown purposes
  let effectiveEnd = end;
  if (includeEndDate) {
    const s = dateToSerial(end.year, end.month, end.day) + 1;
    effectiveEnd = serialToDate(s);
  }

  let years = effectiveEnd.year - start.year;
  let months = effectiveEnd.month - start.month;
  let days = effectiveEnd.day - start.day;

  if (days < 0) {
    months -= 1;
    // Get days in the month before effective end
    const prevMonth = effectiveEnd.month === 1 ? 12 : effectiveEnd.month - 1;
    const prevMonthYear = effectiveEnd.month === 1 ? effectiveEnd.year - 1 : effectiveEnd.year;
    days += getDaysInMonth(prevMonthYear, prevMonth);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(days / 7);
  days = days % 7;

  return { years, months, weeks, days };
}

/**
 * Adds time offset to a date. Handles month-end overflow by capping.
 * offset: { years?, months?, weeks?, days? }
 * @param {{year: number, month: number, day: number}} date
 * @param {{years?: number, months?: number, weeks?: number, days?: number}} offset
 * @returns {{year: number, month: number, day: number}}
 */
export function addToDate(date, offset) {
  let { year, month, day } = date;
  const years = offset.years || 0;
  const months = offset.months || 0;
  const weeks = offset.weeks || 0;
  const days = offset.days || 0;

  // Add years
  year += years;

  // Add months
  month += months;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  // Cap day to last day of resulting month
  const maxDay = getDaysInMonth(year, month);
  if (day > maxDay) {
    day = maxDay;
  }

  // Add weeks and days using serial arithmetic
  const totalDaysToAdd = weeks * 7 + days;
  if (totalDaysToAdd !== 0) {
    const serial = dateToSerial(year, month, day) + totalDaysToAdd;
    const result = serialToDate(serial);
    return result;
  }

  return { year, month, day };
}

/**
 * Subtracts time offset from a date.
 * @param {{year: number, month: number, day: number}} date
 * @param {{years?: number, months?: number, weeks?: number, days?: number}} offset
 * @returns {{year: number, month: number, day: number}}
 */
export function subtractFromDate(date, offset) {
  return addToDate(date, {
    years: -(offset.years || 0),
    months: -(offset.months || 0),
    weeks: -(offset.weeks || 0),
    days: -(offset.days || 0)
  });
}

/**
 * Counts occurrences of specified weekdays in a date range (inclusive).
 * weekdays: array of day numbers (0-6, where 0=Sunday)
 * Returns: Map<weekday, count>
 * @param {{year: number, month: number, day: number}} start
 * @param {{year: number, month: number, day: number}} end
 * @param {number[]} weekdays
 * @returns {Map<number, number>}
 */
export function countWeekdays(start, end, weekdays) {
  const result = new Map();
  weekdays.forEach(wd => result.set(wd, 0));

  let s = start;
  let e = end;
  if (compareDates(s, e) > 0) {
    s = end;
    e = start;
  }

  const startSerial = dateToSerial(s.year, s.month, s.day);
  const endSerial = dateToSerial(e.year, e.month, e.day);
  const totalDays = endSerial - startSerial + 1; // inclusive

  if (totalDays <= 0) return result;

  const startDow = getDayOfWeek(s.year, s.month, s.day);

  // For each weekday, count occurrences in the range
  for (const wd of weekdays) {
    // How many days from start to the first occurrence of this weekday
    const daysToFirst = (wd - startDow + 7) % 7;
    if (daysToFirst >= totalDays) {
      result.set(wd, 0);
    } else {
      // Number of full weeks from first occurrence to end of range
      const remaining = totalDays - daysToFirst;
      const count = Math.floor((remaining - 1) / 7) + 1;
      result.set(wd, count);
    }
  }

  return result;
}

/**
 * Finds the Nth occurrence of a weekday in a month.
 * Returns {year, month, day} or null if doesn't exist.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} weekday - 0-6 (0=Sunday)
 * @param {number} n - 1-5 (which occurrence)
 * @returns {{year: number, month: number, day: number} | null}
 */
export function findNthWeekday(year, month, weekday, n) {
  if (n < 1 || n > 5) return null;

  // Find first occurrence of this weekday in the month
  const firstDow = getDayOfWeek(year, month, 1);
  let firstOccurrence = 1 + ((weekday - firstDow + 7) % 7);

  // Nth occurrence
  const day = firstOccurrence + (n - 1) * 7;

  // Check if day is valid in this month
  const daysInMonth = getDaysInMonth(year, month);
  if (day > daysInMonth) {
    return null;
  }

  return { year, month, day };
}

/**
 * Counts business days between two dates (excludes weekends and holidays).
 * The count is exclusive of start date but inclusive of end date by convention,
 * matching the typical business day counting (days between, not including start).
 * Actually, we count days strictly between start and end (exclusive both endpoints
 * is another convention). We'll use: count weekdays from day after start to end inclusive.
 * 
 * For simplicity and standard usage: count all weekdays in (start, end] that aren't holidays.
 * If start == end, result is 0.
 * If start > end, we swap and return the same count.
 * 
 * holidays: Set of "YYYY-MM-DD" strings
 * @param {{year: number, month: number, day: number}} start
 * @param {{year: number, month: number, day: number}} end
 * @param {Set<string>} holidays
 * @returns {number}
 */
export function countBusinessDays(start, end, holidays = new Set()) {
  let s = start;
  let e = end;
  if (compareDates(s, e) > 0) {
    s = end;
    e = start;
  }

  const startSerial = dateToSerial(s.year, s.month, s.day);
  const endSerial = dateToSerial(e.year, e.month, e.day);

  let count = 0;
  for (let serial = startSerial + 1; serial <= endSerial; serial++) {
    const d = serialToDate(serial);
    const dow = getDayOfWeek(d.year, d.month, d.day);
    // Skip Saturday (6) and Sunday (0)
    if (dow === 0 || dow === 6) continue;
    // Skip holidays
    const dateStr = formatDateString(d.year, d.month, d.day);
    if (holidays.has(dateStr)) continue;
    count++;
  }

  return count;
}

/**
 * Finds the date that is N business days from start.
 * @param {{year: number, month: number, day: number}} start
 * @param {number} businessDays - Can be positive (forward) or negative (backward)
 * @param {Set<string>} holidays
 * @returns {{year: number, month: number, day: number}}
 */
export function addBusinessDays(start, businessDays, holidays = new Set()) {
  if (businessDays === 0) return { ...start };

  const direction = businessDays > 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);
  let serial = dateToSerial(start.year, start.month, start.day);

  while (remaining > 0) {
    serial += direction;
    const d = serialToDate(serial);
    const dow = getDayOfWeek(d.year, d.month, d.day);
    // Skip Saturday (6) and Sunday (0)
    if (dow === 0 || dow === 6) continue;
    // Skip holidays
    const dateStr = formatDateString(d.year, d.month, d.day);
    if (holidays.has(dateStr)) continue;
    remaining--;
  }

  return serialToDate(serial);
}

/**
 * Returns ISO 8601 week number and year for a date.
 * Note: ISO year may differ from calendar year at year boundaries.
 * ISO weeks start on Monday. Week 1 contains the first Thursday of the year.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {{isoWeek: number, isoYear: number}}
 */
export function getISOWeekNumber(year, month, day) {
  // ISO day of week: Monday=1, Sunday=7
  const dow = getDayOfWeek(year, month, day);
  const isoDow = dow === 0 ? 7 : dow;

  // Find the Thursday of this week (ISO week is defined by its Thursday)
  const serial = dateToSerial(year, month, day);
  const thursdaySerial = serial + (4 - isoDow); // Thursday is ISO day 4
  const thursday = serialToDate(thursdaySerial);

  // ISO year is the year of that Thursday
  const isoYear = thursday.year;

  // Week 1 contains Jan 4 of the ISO year (or equivalently, the first Thursday)
  const jan4Serial = dateToSerial(isoYear, 1, 4);
  const jan4Dow = getDayOfWeek(isoYear, 1, 4);
  const jan4IsoDow = jan4Dow === 0 ? 7 : jan4Dow;
  // Monday of week 1
  const week1MondaySerial = jan4Serial - (jan4IsoDow - 1);

  // ISO week number
  const isoWeek = Math.floor((thursdaySerial - week1MondaySerial) / 7) + 1;

  return { isoWeek, isoYear };
}

/**
 * Returns start (Monday) and end (Sunday) dates for a given ISO week.
 * @param {number} isoYear
 * @param {number} isoWeek
 * @returns {{start: {year: number, month: number, day: number}, end: {year: number, month: number, day: number}}}
 */
export function getISOWeekDates(isoYear, isoWeek) {
  // Find Jan 4 of the ISO year (always in week 1)
  const jan4Serial = dateToSerial(isoYear, 1, 4);
  const jan4Dow = getDayOfWeek(isoYear, 1, 4);
  const jan4IsoDow = jan4Dow === 0 ? 7 : jan4Dow;
  // Monday of week 1
  const week1MondaySerial = jan4Serial - (jan4IsoDow - 1);

  // Monday of the requested week
  const mondaySerial = week1MondaySerial + (isoWeek - 1) * 7;
  const sundaySerial = mondaySerial + 6;

  return {
    start: serialToDate(mondaySerial),
    end: serialToDate(sundaySerial)
  };
}

/**
 * Returns the day number within the year (1-366).
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {number}
 */
export function getDayOfYear(year, month, day) {
  let dayOfYear = 0;
  for (let m = 1; m < month; m++) {
    dayOfYear += getDaysInMonth(year, m);
  }
  dayOfYear += day;
  return dayOfYear;
}

/**
 * Returns total days in a year (365 or 366).
 * @param {number} year
 * @returns {number}
 */
export function getDaysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Returns days remaining in the year after the given date.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {number}
 */
export function getDaysRemainingInYear(year, month, day) {
  return getDaysInYear(year) - getDayOfYear(year, month, day);
}

/**
 * Formats a date as "YYYY-MM-DD" string (used for holiday lookups).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
function formatDateString(year, month, day) {
  const yStr = String(year).padStart(4, '0');
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}
