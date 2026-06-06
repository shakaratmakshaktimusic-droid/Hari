/**
 * DateParser - Multi-format date parsing engine
 * Handles parsing, formatting, and validation of dates.
 */

/**
 * Checks if a year is a leap year.
 * Leap year: divisible by 4, except centuries unless divisible by 400.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the number of days in a given month (1-12) of a given year.
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysPerMonth[month - 1];
}

/**
 * Validates a date for existence (handles leap years, month lengths).
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @returns {{valid: boolean, error?: string}}
 */
export function validateDate(year, month, day) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return { valid: false, error: `Year must be between 1 and 9999, got ${year}` };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, error: `Month must be between 1 and 12, got ${month}` };
  }
  const maxDay = getDaysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    return { valid: false, error: `Day must be between 1 and ${maxDay} for ${year}-${String(month).padStart(2, '0')}, got ${day}` };
  }
  return { valid: true };
}

/**
 * Parses a date string in supported formats and returns a DateResult.
 * Supported formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
 *
 * @param {string} input - The date string to parse
 * @param {string} preferredFormat - Hint for ambiguous dates ("MDY" or "DMY")
 * @returns {{success: boolean, date?: {year: number, month: number, day: number}, error?: string}}
 */
export function parseDate(input, preferredFormat = 'MDY') {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Input must be a non-empty string' };
  }

  const trimmed = input.trim();

  // Try YYYY-MM-DD format first (unambiguous)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const validation = validateDate(year, month, day);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    return { success: true, date: { year, month, day } };
  }

  // Try slash-separated format (MM/DD/YYYY or DD/MM/YYYY)
  const slashMatch = trimmed.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
  if (slashMatch) {
    const part1 = parseInt(slashMatch[1], 10);
    const part2 = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);

    let month, day;
    if (preferredFormat === 'DMY') {
      day = part1;
      month = part2;
    } else {
      // Default MDY
      month = part1;
      day = part2;
    }

    const validation = validateDate(year, month, day);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    return { success: true, date: { year, month, day } };
  }

  return { success: false, error: `Unrecognized date format: "${trimmed}"` };
}

/**
 * Formats a normalized date object to a display string.
 * @param {{year: number, month: number, day: number}} date
 * @param {string} format - Output format pattern (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const y = String(date.year).padStart(4, '0');
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${y}-${m}-${d}`;
    case 'MM/DD/YYYY':
      return `${m}/${d}/${y}`;
    case 'DD/MM/YYYY':
      return `${d}/${m}/${y}`;
    default:
      return `${y}-${m}-${d}`;
  }
}
