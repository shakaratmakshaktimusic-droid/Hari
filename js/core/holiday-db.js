/**
 * HolidayDB - Holiday calendars for multiple countries
 * Provides fixed and calculated holiday dates for 12 countries.
 * Supports both fixed-date holidays and moveable holidays (Easter, Thanksgiving, etc.)
 */

/**
 * Holiday definitions for 12+ countries.
 * Each country has an array of holiday definitions.
 * Fixed holidays have { month, day, name }.
 * Calculated holidays have { calculate: functionName, name }.
 */
const HOLIDAY_CALENDARS = {
  US: [
    { month: 1, day: 1, name: "New Year's Day" },
    { calculate: 'mlkDay', name: 'Martin Luther King Jr. Day' },        // 3rd Monday of January
    { calculate: 'presidentsDay', name: "Presidents' Day" },             // 3rd Monday of February
    { calculate: 'memorialDay', name: 'Memorial Day' },                  // Last Monday of May
    { month: 6, day: 19, name: 'Juneteenth' },
    { month: 7, day: 4, name: 'Independence Day' },
    { calculate: 'laborDay', name: 'Labor Day' },                        // 1st Monday of September
    { calculate: 'columbusDay', name: 'Columbus Day' },                  // 2nd Monday of October
    { month: 11, day: 11, name: 'Veterans Day' },
    { calculate: 'thanksgiving', name: 'Thanksgiving Day' },             // 4th Thursday of November
    { month: 12, day: 25, name: 'Christmas Day' },
  ],
  GB: [
    { month: 1, day: 1, name: "New Year's Day" },
    { calculate: 'goodFriday', name: 'Good Friday' },
    { calculate: 'easterMonday', name: 'Easter Monday' },
    { calculate: 'earlyMayBank', name: 'Early May Bank Holiday' },       // 1st Monday of May
    { calculate: 'springBank', name: 'Spring Bank Holiday' },            // Last Monday of May
    { calculate: 'summerBank', name: 'Summer Bank Holiday' },            // Last Monday of August
    { month: 12, day: 25, name: 'Christmas Day' },
    { month: 12, day: 26, name: 'Boxing Day' },
  ],
  CA: [
    { month: 1, day: 1, name: "New Year's Day" },
    { calculate: 'familyDay', name: 'Family Day' },                      // 3rd Monday of February
    { calculate: 'goodFriday', name: 'Good Friday' },
    { calculate: 'victoriaDay', name: 'Victoria Day' },                  // Monday before May 25
    { month: 7, day: 1, name: 'Canada Day' },
    { calculate: 'civicHoliday', name: 'Civic Holiday' },                // 1st Monday of August
    { calculate: 'laborDay', name: 'Labour Day' },                       // 1st Monday of September
    { calculate: 'thanksgivingCA', name: 'Thanksgiving' },               // 2nd Monday of October
    { month: 11, day: 11, name: 'Remembrance Day' },
    { month: 12, day: 25, name: 'Christmas Day' },
    { month: 12, day: 26, name: 'Boxing Day' },
  ],
  AU: [
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 1, day: 26, name: 'Australia Day' },
    { calculate: 'goodFriday', name: 'Good Friday' },
    { calculate: 'easterSaturday', name: 'Easter Saturday' },
    { calculate: 'easterMonday', name: 'Easter Monday' },
    { month: 4, day: 25, name: 'ANZAC Day' },
    { calculate: 'queensBirthday', name: "Queen's Birthday" },           // 2nd Monday of June
    { month: 12, day: 25, name: 'Christmas Day' },
    { month: 12, day: 26, name: 'Boxing Day' },
  ],
  DE: [
    { month: 1, day: 1, name: 'Neujahrstag' },
    { calculate: 'goodFriday', name: 'Karfreitag' },
    { calculate: 'easterMonday', name: 'Ostermontag' },
    { month: 5, day: 1, name: 'Tag der Arbeit' },
    { calculate: 'ascensionDay', name: 'Christi Himmelfahrt' },
    { calculate: 'whitMonday', name: 'Pfingstmontag' },
    { month: 10, day: 3, name: 'Tag der Deutschen Einheit' },
    { month: 12, day: 25, name: '1. Weihnachtstag' },
    { month: 12, day: 26, name: '2. Weihnachtstag' },
  ],
  FR: [
    { month: 1, day: 1, name: "Jour de l'An" },
    { calculate: 'easterMonday', name: 'Lundi de Paques' },
    { month: 5, day: 1, name: 'Fete du Travail' },
    { month: 5, day: 8, name: 'Victoire 1945' },
    { calculate: 'ascensionDay', name: 'Ascension' },
    { calculate: 'whitMonday', name: 'Lundi de Pentecote' },
    { month: 7, day: 14, name: 'Fete Nationale' },
    { month: 8, day: 15, name: 'Assomption' },
    { month: 11, day: 1, name: 'Toussaint' },
    { month: 11, day: 11, name: 'Armistice' },
    { month: 12, day: 25, name: 'Noel' },
  ],
  JP: [
    { month: 1, day: 1, name: 'New Year\'s Day' },
    { calculate: 'comingOfAgeDay', name: 'Coming of Age Day' },          // 2nd Monday of January
    { month: 2, day: 11, name: 'National Foundation Day' },
    { month: 2, day: 23, name: "Emperor's Birthday" },
    { calculate: 'vernalEquinox', name: 'Vernal Equinox Day' },
    { month: 4, day: 29, name: 'Showa Day' },
    { month: 5, day: 3, name: 'Constitution Memorial Day' },
    { month: 5, day: 4, name: 'Greenery Day' },
    { month: 5, day: 5, name: "Children's Day" },
    { calculate: 'marineDay', name: 'Marine Day' },                      // 3rd Monday of July
    { month: 8, day: 11, name: 'Mountain Day' },
    { calculate: 'respectForAgedDay', name: 'Respect for the Aged Day' },// 3rd Monday of September
    { calculate: 'autumnalEquinox', name: 'Autumnal Equinox Day' },
    { calculate: 'sportsDay', name: 'Sports Day' },                      // 2nd Monday of October
    { month: 11, day: 3, name: 'Culture Day' },
    { month: 11, day: 23, name: 'Labor Thanksgiving Day' },
  ],
  IN: [
    { month: 1, day: 26, name: 'Republic Day' },
    { month: 8, day: 15, name: 'Independence Day' },
    { month: 10, day: 2, name: 'Gandhi Jayanti' },
    { month: 1, day: 1, name: "New Year's Day" },
    { month: 5, day: 1, name: 'May Day' },
    { month: 12, day: 25, name: 'Christmas Day' },
    { calculate: 'goodFriday', name: 'Good Friday' },
    { calculate: 'diwali', name: 'Diwali' },
    { calculate: 'holi', name: 'Holi' },
  ],
  BR: [
    { month: 1, day: 1, name: 'Confraternizacao Universal' },
    { calculate: 'carnivalTuesday', name: 'Carnaval' },
    { calculate: 'goodFriday', name: 'Sexta-feira Santa' },
    { month: 4, day: 21, name: 'Tiradentes' },
    { month: 5, day: 1, name: 'Dia do Trabalho' },
    { calculate: 'corpusChristi', name: 'Corpus Christi' },
    { month: 9, day: 7, name: 'Independencia do Brasil' },
    { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
    { month: 11, day: 2, name: 'Finados' },
    { month: 11, day: 15, name: 'Proclamacao da Republica' },
    { month: 12, day: 25, name: 'Natal' },
  ],
  MX: [
    { month: 1, day: 1, name: 'Ano Nuevo' },
    { calculate: 'constitutionDayMX', name: 'Dia de la Constitucion' },  // 1st Monday of February
    { calculate: 'benitojuarezDay', name: 'Natalicio de Benito Juarez' },// 3rd Monday of March
    { month: 5, day: 1, name: 'Dia del Trabajo' },
    { month: 9, day: 16, name: 'Dia de la Independencia' },
    { calculate: 'revolutionDay', name: 'Dia de la Revolucion' },        // 3rd Monday of November
    { month: 12, day: 25, name: 'Navidad' },
  ],
  CN: [
    { month: 1, day: 1, name: "New Year's Day" },
    { calculate: 'chineseNewYear', name: 'Chinese New Year' },
    { month: 4, day: 5, name: 'Qingming Festival' },
    { month: 5, day: 1, name: 'Labour Day' },
    { calculate: 'dragonBoatFestival', name: 'Dragon Boat Festival' },
    { calculate: 'midAutumnFestival', name: 'Mid-Autumn Festival' },
    { month: 10, day: 1, name: 'National Day' },
  ],
  KR: [
    { month: 1, day: 1, name: "New Year's Day" },
    { calculate: 'koreanNewYear', name: 'Seollal (Lunar New Year)' },
    { month: 3, day: 1, name: 'Independence Movement Day' },
    { month: 5, day: 5, name: "Children's Day" },
    { calculate: 'buddhasBirthday', name: "Buddha's Birthday" },
    { month: 6, day: 6, name: 'Memorial Day' },
    { month: 8, day: 15, name: 'Liberation Day' },
    { calculate: 'chuseok', name: 'Chuseok' },
    { month: 10, day: 3, name: 'National Foundation Day' },
    { month: 10, day: 9, name: 'Hangul Day' },
    { month: 12, day: 25, name: 'Christmas Day' },
  ],
};

/**
 * Country metadata for display.
 */
const COUNTRY_NAMES = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  CN: 'China',
  KR: 'South Korea',
};

// ============================================================
// Holiday Calculation Functions
// ============================================================

/**
 * Calculates Easter Sunday using the Anonymous Gregorian algorithm.
 * Returns { month, day } for Easter in the given year.
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function computeEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Gets the day of week for a given date (0=Sunday, 6=Saturday).
 * Standalone function to avoid circular dependency with date-calc.js.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day
 * @returns {number}
 */
function getDow(year, month, day) {
  let m = month;
  let y = year;
  if (m < 3) { m += 12; y -= 1; }
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) - 2 * j) % 7;
  return ((h + 6) % 7);
}

/**
 * Finds the Nth weekday of a month.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} weekday - 0=Sunday, 1=Monday, ... 6=Saturday
 * @param {number} n - Which occurrence (1-5)
 * @returns {number} day of month
 */
function nthWeekday(year, month, weekday, n) {
  const firstDow = getDow(year, month, 1);
  let firstOccurrence = 1 + ((weekday - firstDow + 7) % 7);
  return firstOccurrence + (n - 1) * 7;
}

/**
 * Finds the last occurrence of a weekday in a month.
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} weekday - 0=Sunday, 1=Monday, ... 6=Saturday
 * @returns {number} day of month
 */
function lastWeekday(year, month, weekday) {
  const daysInMonth = getDaysInMonthLocal(year, month);
  const lastDow = getDow(year, month, daysInMonth);
  let diff = lastDow - weekday;
  if (diff < 0) diff += 7;
  return daysInMonth - diff;
}

/**
 * Returns days in a month (standalone to avoid circular deps).
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {number}
 */
function getDaysInMonthLocal(year, month) {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0))) {
    return 29;
  }
  return days[month - 1];
}

/**
 * Adds days to a date (standalone).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} daysToAdd
 * @returns {{month: number, day: number}}
 */
function addDays(year, month, day, daysToAdd) {
  let d = day + daysToAdd;
  let m = month;
  let y = year;
  while (d > getDaysInMonthLocal(y, m)) {
    d -= getDaysInMonthLocal(y, m);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  while (d < 1) {
    m--;
    if (m < 1) { m = 12; y--; }
    d += getDaysInMonthLocal(y, m);
  }
  return { month: m, day: d };
}

/**
 * Dispatches calculated holiday computations.
 * @param {string} calcName - Function name identifier
 * @param {number} year
 * @returns {{month: number, day: number} | null}
 */
function calculateHolidayDate(calcName, year) {
  const easter = computeEaster(year);
  // Easter serial for relative calculations
  const easterSerial = getSimpleSerial(year, easter.month, easter.day);

  switch (calcName) {
    // US Holidays
    case 'mlkDay':
      return { month: 1, day: nthWeekday(year, 1, 1, 3) };  // 3rd Monday of January
    case 'presidentsDay':
      return { month: 2, day: nthWeekday(year, 2, 1, 3) };  // 3rd Monday of February
    case 'memorialDay':
      return { month: 5, day: lastWeekday(year, 5, 1) };    // Last Monday of May
    case 'laborDay':
      return { month: 9, day: nthWeekday(year, 9, 1, 1) };  // 1st Monday of September
    case 'columbusDay':
      return { month: 10, day: nthWeekday(year, 10, 1, 2) };// 2nd Monday of October
    case 'thanksgiving':
      return { month: 11, day: nthWeekday(year, 11, 4, 4) };// 4th Thursday of November

    // Easter-based holidays
    case 'goodFriday':
      return serialToMonthDay(year, easterSerial - 2);
    case 'easterMonday':
      return serialToMonthDay(year, easterSerial + 1);
    case 'easterSaturday':
      return serialToMonthDay(year, easterSerial - 1);
    case 'ascensionDay':
      return serialToMonthDay(year, easterSerial + 39);
    case 'whitMonday':
      return serialToMonthDay(year, easterSerial + 50);
    case 'corpusChristi':
      return serialToMonthDay(year, easterSerial + 60);
    case 'carnivalTuesday':
      return serialToMonthDay(year, easterSerial - 47);

    // UK Bank Holidays
    case 'earlyMayBank':
      return { month: 5, day: nthWeekday(year, 5, 1, 1) };  // 1st Monday of May
    case 'springBank':
      return { month: 5, day: lastWeekday(year, 5, 1) };    // Last Monday of May
    case 'summerBank':
      return { month: 8, day: lastWeekday(year, 8, 1) };    // Last Monday of August

    // Canada
    case 'familyDay':
      return { month: 2, day: nthWeekday(year, 2, 1, 3) };  // 3rd Monday of February
    case 'victoriaDay': {
      // Monday on or before May 24
      const may24Dow = getDow(year, 5, 24);
      const offset = may24Dow === 1 ? 0 : ((may24Dow - 1 + 7) % 7);
      return { month: 5, day: 24 - offset };
    }
    case 'civicHoliday':
      return { month: 8, day: nthWeekday(year, 8, 1, 1) };  // 1st Monday of August
    case 'thanksgivingCA':
      return { month: 10, day: nthWeekday(year, 10, 1, 2) };// 2nd Monday of October

    // Australia
    case 'queensBirthday':
      return { month: 6, day: nthWeekday(year, 6, 1, 2) };  // 2nd Monday of June

    // Japan
    case 'comingOfAgeDay':
      return { month: 1, day: nthWeekday(year, 1, 1, 2) };  // 2nd Monday of January
    case 'vernalEquinox':
      // Approximate: around March 20-21
      return { month: 3, day: Math.round(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)) };
    case 'marineDay':
      return { month: 7, day: nthWeekday(year, 7, 1, 3) };  // 3rd Monday of July
    case 'respectForAgedDay':
      return { month: 9, day: nthWeekday(year, 9, 1, 3) };  // 3rd Monday of September
    case 'autumnalEquinox':
      // Approximate: around September 22-23
      return { month: 9, day: Math.round(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)) };
    case 'sportsDay':
      return { month: 10, day: nthWeekday(year, 10, 1, 2) };// 2nd Monday of October

    // Mexico
    case 'constitutionDayMX':
      return { month: 2, day: nthWeekday(year, 2, 1, 1) };  // 1st Monday of February
    case 'benitojuarezDay':
      return { month: 3, day: nthWeekday(year, 3, 1, 3) };  // 3rd Monday of March
    case 'revolutionDay':
      return { month: 11, day: nthWeekday(year, 11, 1, 3) };// 3rd Monday of November

    // India (approximate dates for lunar holidays)
    case 'diwali':
      // Approximate: October/November (varies by year, use rough estimate)
      return getDiwaliDate(year);
    case 'holi':
      // Approximate: March (varies by year, use rough estimate)
      return getHoliDate(year);

    // China (approximate dates for lunar calendar holidays)
    case 'chineseNewYear':
      return getChineseNewYearDate(year);
    case 'dragonBoatFestival':
      return getDragonBoatDate(year);
    case 'midAutumnFestival':
      return getMidAutumnDate(year);

    // South Korea
    case 'koreanNewYear':
      return getChineseNewYearDate(year); // Same as Chinese New Year
    case 'buddhasBirthday':
      return getBuddhasBirthdayDate(year);
    case 'chuseok':
      return getMidAutumnDate(year); // Chuseok falls on same day as Mid-Autumn

    default:
      return null;
  }
}

/**
 * Simple day-of-year serial (1-based from Jan 1).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {number}
 */
function getSimpleSerial(year, month, day) {
  let serial = 0;
  for (let m = 1; m < month; m++) {
    serial += getDaysInMonthLocal(year, m);
  }
  serial += day;
  return serial;
}

/**
 * Converts a serial day number back to month and day.
 * @param {number} year
 * @param {number} serial - Day of year (can exceed year boundaries)
 * @returns {{month: number, day: number}}
 */
function serialToMonthDay(year, serial) {
  let s = serial;
  let y = year;
  
  // Handle overflow into next year
  const daysInYear = ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 366 : 365;
  while (s > daysInYear) {
    s -= daysInYear;
  }
  while (s < 1) {
    const prevYear = y - 1;
    const prevDays = ((prevYear % 4 === 0 && prevYear % 100 !== 0) || (prevYear % 400 === 0)) ? 366 : 365;
    s += prevDays;
  }

  let month = 1;
  while (s > getDaysInMonthLocal(y, month)) {
    s -= getDaysInMonthLocal(y, month);
    month++;
    if (month > 12) break;
  }
  return { month, day: s };
}

// ============================================================
// Approximate Lunar Calendar Calculations
// These provide reasonable estimates for lunar-based holidays.
// For production accuracy, a full lunar calendar library would be needed.
// ============================================================

/**
 * Approximate Chinese New Year dates (precomputed for common years).
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getChineseNewYearDate(year) {
  // Pre-calculated dates for recent/upcoming years
  const dates = {
    2020: { month: 1, day: 25 },
    2021: { month: 2, day: 12 },
    2022: { month: 2, day: 1 },
    2023: { month: 1, day: 22 },
    2024: { month: 2, day: 10 },
    2025: { month: 1, day: 29 },
    2026: { month: 2, day: 17 },
    2027: { month: 2, day: 6 },
    2028: { month: 1, day: 26 },
    2029: { month: 2, day: 13 },
    2030: { month: 2, day: 3 },
    2031: { month: 1, day: 23 },
    2032: { month: 2, day: 11 },
    2033: { month: 1, day: 31 },
    2034: { month: 2, day: 19 },
    2035: { month: 2, day: 8 },
  };
  if (dates[year]) return dates[year];
  // Rough fallback: CNY falls between Jan 21 and Feb 20
  return { month: 2, day: 5 };
}

/**
 * Approximate Dragon Boat Festival (5th day of 5th lunar month).
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getDragonBoatDate(year) {
  const dates = {
    2020: { month: 6, day: 25 },
    2021: { month: 6, day: 14 },
    2022: { month: 6, day: 3 },
    2023: { month: 6, day: 22 },
    2024: { month: 6, day: 10 },
    2025: { month: 5, day: 31 },
    2026: { month: 6, day: 19 },
    2027: { month: 6, day: 9 },
    2028: { month: 5, day: 28 },
    2029: { month: 6, day: 16 },
    2030: { month: 6, day: 5 },
  };
  if (dates[year]) return dates[year];
  return { month: 6, day: 10 };
}

/**
 * Approximate Mid-Autumn Festival (15th day of 8th lunar month).
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getMidAutumnDate(year) {
  const dates = {
    2020: { month: 10, day: 1 },
    2021: { month: 9, day: 21 },
    2022: { month: 9, day: 10 },
    2023: { month: 9, day: 29 },
    2024: { month: 9, day: 17 },
    2025: { month: 10, day: 6 },
    2026: { month: 9, day: 25 },
    2027: { month: 9, day: 15 },
    2028: { month: 10, day: 3 },
    2029: { month: 9, day: 22 },
    2030: { month: 9, day: 12 },
  };
  if (dates[year]) return dates[year];
  return { month: 9, day: 20 };
}

/**
 * Approximate Diwali dates.
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getDiwaliDate(year) {
  const dates = {
    2020: { month: 11, day: 14 },
    2021: { month: 11, day: 4 },
    2022: { month: 10, day: 24 },
    2023: { month: 11, day: 12 },
    2024: { month: 11, day: 1 },
    2025: { month: 10, day: 20 },
    2026: { month: 11, day: 8 },
    2027: { month: 10, day: 29 },
    2028: { month: 10, day: 17 },
    2029: { month: 11, day: 5 },
    2030: { month: 10, day: 26 },
  };
  if (dates[year]) return dates[year];
  return { month: 11, day: 1 };
}

/**
 * Approximate Holi dates.
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getHoliDate(year) {
  const dates = {
    2020: { month: 3, day: 10 },
    2021: { month: 3, day: 29 },
    2022: { month: 3, day: 18 },
    2023: { month: 3, day: 8 },
    2024: { month: 3, day: 25 },
    2025: { month: 3, day: 14 },
    2026: { month: 3, day: 4 },
    2027: { month: 3, day: 22 },
    2028: { month: 3, day: 11 },
    2029: { month: 3, day: 1 },
    2030: { month: 3, day: 20 },
  };
  if (dates[year]) return dates[year];
  return { month: 3, day: 15 };
}

/**
 * Approximate Buddha's Birthday (4th month 8th day of lunar calendar).
 * @param {number} year
 * @returns {{month: number, day: number}}
 */
function getBuddhasBirthdayDate(year) {
  const dates = {
    2020: { month: 4, day: 30 },
    2021: { month: 5, day: 19 },
    2022: { month: 5, day: 8 },
    2023: { month: 5, day: 27 },
    2024: { month: 5, day: 15 },
    2025: { month: 5, day: 5 },
    2026: { month: 5, day: 24 },
    2027: { month: 5, day: 13 },
    2028: { month: 5, day: 2 },
    2029: { month: 5, day: 20 },
    2030: { month: 5, day: 9 },
  };
  if (dates[year]) return dates[year];
  return { month: 5, day: 15 };
}

// ============================================================
// Public API
// ============================================================

/**
 * Returns holiday dates for a given country and year.
 * @param {string} countryCode - ISO 3166-1 alpha-2 (e.g., 'US', 'GB', 'DE')
 * @param {number} year
 * @returns {Array<{date: string, name: string, isRecurring: boolean}>}
 */
export function getHolidays(countryCode, year) {
  const calendar = HOLIDAY_CALENDARS[countryCode];
  if (!calendar) return [];

  const holidays = [];

  for (const holiday of calendar) {
    if (holiday.calculate) {
      // Calculated/moveable holiday
      const result = calculateHolidayDate(holiday.calculate, year);
      if (result) {
        const dateStr = formatDateStr(year, result.month, result.day);
        holidays.push({
          date: dateStr,
          name: holiday.name,
          isRecurring: true
        });
      }
    } else {
      // Fixed-date holiday
      const dateStr = formatDateStr(year, holiday.month, holiday.day);
      holidays.push({
        date: dateStr,
        name: holiday.name,
        isRecurring: true
      });
    }
  }

  // Sort by date
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

/**
 * Evaluates custom recurring holiday definitions.
 * Each definition: { month: 1-12, day: 1-31, name: string }
 * @param {Array<{month: number, day: number, name: string}>} definitions
 * @param {number} year
 * @returns {string[]} Array of "YYYY-MM-DD" date strings
 */
export function expandRecurringHolidays(definitions, year) {
  if (!Array.isArray(definitions)) return [];

  const dates = [];
  for (const def of definitions) {
    if (def.month >= 1 && def.month <= 12 && def.day >= 1) {
      const maxDay = getDaysInMonthLocal(year, def.month);
      if (def.day <= maxDay) {
        dates.push(formatDateStr(year, def.month, def.day));
      }
    }
  }

  return dates;
}

/**
 * Returns list of supported country codes with names.
 * @returns {Array<{code: string, name: string}>}
 */
export function getSupportedCountries() {
  return Object.entries(COUNTRY_NAMES).map(([code, name]) => ({ code, name }));
}

/**
 * Creates a Set of date strings for a country+year (for use with countBusinessDays).
 * @param {string} countryCode - ISO 3166-1 alpha-2
 * @param {number} year
 * @returns {Set<string>}
 */
export function getHolidaySet(countryCode, year) {
  const holidays = getHolidays(countryCode, year);
  return new Set(holidays.map(h => h.date));
}

/**
 * Formats a date as "YYYY-MM-DD".
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {string}
 */
function formatDateStr(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
