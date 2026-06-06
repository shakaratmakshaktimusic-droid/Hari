/**
 * TimezoneDB - IANA timezone database and conversion logic
 * Uses the browser's Intl API for actual timezone conversions,
 * with a local database for search/autocomplete.
 */

// Database of major IANA timezones with metadata
const TIMEZONE_DATABASE = [
  // North America - United States
  { id: 'America/New_York', city: 'New York', country: 'United States', abbreviation: 'EST/EDT', utcOffset: -5, dstOffset: -4 },
  { id: 'America/Chicago', city: 'Chicago', country: 'United States', abbreviation: 'CST/CDT', utcOffset: -6, dstOffset: -5 },
  { id: 'America/Denver', city: 'Denver', country: 'United States', abbreviation: 'MST/MDT', utcOffset: -7, dstOffset: -6 },
  { id: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States', abbreviation: 'PST/PDT', utcOffset: -8, dstOffset: -7 },
  { id: 'America/Anchorage', city: 'Anchorage', country: 'United States', abbreviation: 'AKST/AKDT', utcOffset: -9, dstOffset: -8 },
  { id: 'Pacific/Honolulu', city: 'Honolulu', country: 'United States', abbreviation: 'HST', utcOffset: -10, dstOffset: -10 },
  { id: 'America/Phoenix', city: 'Phoenix', country: 'United States', abbreviation: 'MST', utcOffset: -7, dstOffset: -7 },
  { id: 'America/Detroit', city: 'Detroit', country: 'United States', abbreviation: 'EST/EDT', utcOffset: -5, dstOffset: -4 },
  { id: 'America/Indiana/Indianapolis', city: 'Indianapolis', country: 'United States', abbreviation: 'EST/EDT', utcOffset: -5, dstOffset: -4 },
  { id: 'America/Boise', city: 'Boise', country: 'United States', abbreviation: 'MST/MDT', utcOffset: -7, dstOffset: -6 },

  // North America - Canada
  { id: 'America/Toronto', city: 'Toronto', country: 'Canada', abbreviation: 'EST/EDT', utcOffset: -5, dstOffset: -4 },
  { id: 'America/Vancouver', city: 'Vancouver', country: 'Canada', abbreviation: 'PST/PDT', utcOffset: -8, dstOffset: -7 },
  { id: 'America/Edmonton', city: 'Edmonton', country: 'Canada', abbreviation: 'MST/MDT', utcOffset: -7, dstOffset: -6 },
  { id: 'America/Winnipeg', city: 'Winnipeg', country: 'Canada', abbreviation: 'CST/CDT', utcOffset: -6, dstOffset: -5 },
  { id: 'America/Halifax', city: 'Halifax', country: 'Canada', abbreviation: 'AST/ADT', utcOffset: -4, dstOffset: -3 },
  { id: 'America/St_Johns', city: "St. John's", country: 'Canada', abbreviation: 'NST/NDT', utcOffset: -3.5, dstOffset: -2.5 },

  // North America - Mexico
  { id: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico', abbreviation: 'CST', utcOffset: -6, dstOffset: -6 },
  { id: 'America/Cancun', city: 'Cancun', country: 'Mexico', abbreviation: 'EST', utcOffset: -5, dstOffset: -5 },
  { id: 'America/Tijuana', city: 'Tijuana', country: 'Mexico', abbreviation: 'PST/PDT', utcOffset: -8, dstOffset: -7 },

  // Central America & Caribbean
  { id: 'America/Panama', city: 'Panama City', country: 'Panama', abbreviation: 'EST', utcOffset: -5, dstOffset: -5 },
  { id: 'America/Costa_Rica', city: 'San Jose', country: 'Costa Rica', abbreviation: 'CST', utcOffset: -6, dstOffset: -6 },
  { id: 'America/Jamaica', city: 'Kingston', country: 'Jamaica', abbreviation: 'EST', utcOffset: -5, dstOffset: -5 },

  // South America
  { id: 'America/Sao_Paulo', city: 'Sao Paulo', country: 'Brazil', abbreviation: 'BRT', utcOffset: -3, dstOffset: -3 },
  { id: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina', abbreviation: 'ART', utcOffset: -3, dstOffset: -3 },
  { id: 'America/Lima', city: 'Lima', country: 'Peru', abbreviation: 'PET', utcOffset: -5, dstOffset: -5 },
  { id: 'America/Bogota', city: 'Bogota', country: 'Colombia', abbreviation: 'COT', utcOffset: -5, dstOffset: -5 },
  { id: 'America/Santiago', city: 'Santiago', country: 'Chile', abbreviation: 'CLT/CLST', utcOffset: -4, dstOffset: -3 },
  { id: 'America/Caracas', city: 'Caracas', country: 'Venezuela', abbreviation: 'VET', utcOffset: -4, dstOffset: -4 },
  { id: 'America/Montevideo', city: 'Montevideo', country: 'Uruguay', abbreviation: 'UYT', utcOffset: -3, dstOffset: -3 },
  { id: 'America/La_Paz', city: 'La Paz', country: 'Bolivia', abbreviation: 'BOT', utcOffset: -4, dstOffset: -4 },
  { id: 'America/Guayaquil', city: 'Quito', country: 'Ecuador', abbreviation: 'ECT', utcOffset: -5, dstOffset: -5 },

  // Europe
  { id: 'Europe/London', city: 'London', country: 'United Kingdom', abbreviation: 'GMT/BST', utcOffset: 0, dstOffset: 1 },
  { id: 'Europe/Paris', city: 'Paris', country: 'France', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Berlin', city: 'Berlin', country: 'Germany', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Madrid', city: 'Madrid', country: 'Spain', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Rome', city: 'Rome', country: 'Italy', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Moscow', city: 'Moscow', country: 'Russia', abbreviation: 'MSK', utcOffset: 3, dstOffset: 3 },
  { id: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Brussels', city: 'Brussels', country: 'Belgium', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Vienna', city: 'Vienna', country: 'Austria', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Oslo', city: 'Oslo', country: 'Norway', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland', abbreviation: 'EET/EEST', utcOffset: 2, dstOffset: 3 },
  { id: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Prague', city: 'Prague', country: 'Czech Republic', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Budapest', city: 'Budapest', country: 'Hungary', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },
  { id: 'Europe/Bucharest', city: 'Bucharest', country: 'Romania', abbreviation: 'EET/EEST', utcOffset: 2, dstOffset: 3 },
  { id: 'Europe/Athens', city: 'Athens', country: 'Greece', abbreviation: 'EET/EEST', utcOffset: 2, dstOffset: 3 },
  { id: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey', abbreviation: 'TRT', utcOffset: 3, dstOffset: 3 },
  { id: 'Europe/Lisbon', city: 'Lisbon', country: 'Portugal', abbreviation: 'WET/WEST', utcOffset: 0, dstOffset: 1 },
  { id: 'Europe/Dublin', city: 'Dublin', country: 'Ireland', abbreviation: 'GMT/IST', utcOffset: 0, dstOffset: 1 },
  { id: 'Europe/Kiev', city: 'Kyiv', country: 'Ukraine', abbreviation: 'EET/EEST', utcOffset: 2, dstOffset: 3 },
  { id: 'Europe/Belgrade', city: 'Belgrade', country: 'Serbia', abbreviation: 'CET/CEST', utcOffset: 1, dstOffset: 2 },

  // Middle East
  { id: 'Asia/Dubai', city: 'Dubai', country: 'United Arab Emirates', abbreviation: 'GST', utcOffset: 4, dstOffset: 4 },
  { id: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia', abbreviation: 'AST', utcOffset: 3, dstOffset: 3 },
  { id: 'Asia/Tehran', city: 'Tehran', country: 'Iran', abbreviation: 'IRST/IRDT', utcOffset: 3.5, dstOffset: 4.5 },
  { id: 'Asia/Jerusalem', city: 'Jerusalem', country: 'Israel', abbreviation: 'IST/IDT', utcOffset: 2, dstOffset: 3 },
  { id: 'Asia/Baghdad', city: 'Baghdad', country: 'Iraq', abbreviation: 'AST', utcOffset: 3, dstOffset: 3 },
  { id: 'Asia/Kuwait', city: 'Kuwait City', country: 'Kuwait', abbreviation: 'AST', utcOffset: 3, dstOffset: 3 },
  { id: 'Asia/Qatar', city: 'Doha', country: 'Qatar', abbreviation: 'AST', utcOffset: 3, dstOffset: 3 },

  // South Asia
  { id: 'Asia/Kolkata', city: 'Mumbai', country: 'India', abbreviation: 'IST', utcOffset: 5.5, dstOffset: 5.5 },
  { id: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka', abbreviation: 'IST', utcOffset: 5.5, dstOffset: 5.5 },
  { id: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan', abbreviation: 'PKT', utcOffset: 5, dstOffset: 5 },
  { id: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh', abbreviation: 'BST', utcOffset: 6, dstOffset: 6 },
  { id: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal', abbreviation: 'NPT', utcOffset: 5.75, dstOffset: 5.75 },

  // Southeast Asia
  { id: 'Asia/Singapore', city: 'Singapore', country: 'Singapore', abbreviation: 'SGT', utcOffset: 8, dstOffset: 8 },
  { id: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand', abbreviation: 'ICT', utcOffset: 7, dstOffset: 7 },
  { id: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', country: 'Vietnam', abbreviation: 'ICT', utcOffset: 7, dstOffset: 7 },
  { id: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia', abbreviation: 'WIB', utcOffset: 7, dstOffset: 7 },
  { id: 'Asia/Manila', city: 'Manila', country: 'Philippines', abbreviation: 'PHT', utcOffset: 8, dstOffset: 8 },
  { id: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', abbreviation: 'MYT', utcOffset: 8, dstOffset: 8 },

  // East Asia
  { id: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan', abbreviation: 'JST', utcOffset: 9, dstOffset: 9 },
  { id: 'Asia/Shanghai', city: 'Shanghai', country: 'China', abbreviation: 'CST', utcOffset: 8, dstOffset: 8 },
  { id: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'China', abbreviation: 'HKT', utcOffset: 8, dstOffset: 8 },
  { id: 'Asia/Seoul', city: 'Seoul', country: 'South Korea', abbreviation: 'KST', utcOffset: 9, dstOffset: 9 },
  { id: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan', abbreviation: 'CST', utcOffset: 8, dstOffset: 8 },

  // Central Asia
  { id: 'Asia/Almaty', city: 'Almaty', country: 'Kazakhstan', abbreviation: 'ALMT', utcOffset: 6, dstOffset: 6 },
  { id: 'Asia/Tashkent', city: 'Tashkent', country: 'Uzbekistan', abbreviation: 'UZT', utcOffset: 5, dstOffset: 5 },
  { id: 'Asia/Yekaterinburg', city: 'Yekaterinburg', country: 'Russia', abbreviation: 'YEKT', utcOffset: 5, dstOffset: 5 },
  { id: 'Asia/Novosibirsk', city: 'Novosibirsk', country: 'Russia', abbreviation: 'NOVT', utcOffset: 7, dstOffset: 7 },
  { id: 'Asia/Vladivostok', city: 'Vladivostok', country: 'Russia', abbreviation: 'VLAT', utcOffset: 10, dstOffset: 10 },

  // Australia & Oceania
  { id: 'Australia/Sydney', city: 'Sydney', country: 'Australia', abbreviation: 'AEST/AEDT', utcOffset: 10, dstOffset: 11 },
  { id: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia', abbreviation: 'AEST/AEDT', utcOffset: 10, dstOffset: 11 },
  { id: 'Australia/Perth', city: 'Perth', country: 'Australia', abbreviation: 'AWST', utcOffset: 8, dstOffset: 8 },
  { id: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia', abbreviation: 'AEST', utcOffset: 10, dstOffset: 10 },
  { id: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia', abbreviation: 'ACST/ACDT', utcOffset: 9.5, dstOffset: 10.5 },
  { id: 'Australia/Darwin', city: 'Darwin', country: 'Australia', abbreviation: 'ACST', utcOffset: 9.5, dstOffset: 9.5 },
  { id: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand', abbreviation: 'NZST/NZDT', utcOffset: 12, dstOffset: 13 },
  { id: 'Pacific/Fiji', city: 'Suva', country: 'Fiji', abbreviation: 'FJT', utcOffset: 12, dstOffset: 12 },
  { id: 'Pacific/Guam', city: 'Guam', country: 'Guam', abbreviation: 'ChST', utcOffset: 10, dstOffset: 10 },
  { id: 'Pacific/Tongatapu', city: 'Nuku\'alofa', country: 'Tonga', abbreviation: 'TOT', utcOffset: 13, dstOffset: 13 },

  // Africa
  { id: 'Africa/Cairo', city: 'Cairo', country: 'Egypt', abbreviation: 'EET', utcOffset: 2, dstOffset: 2 },
  { id: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria', abbreviation: 'WAT', utcOffset: 1, dstOffset: 1 },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa', abbreviation: 'SAST', utcOffset: 2, dstOffset: 2 },
  { id: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya', abbreviation: 'EAT', utcOffset: 3, dstOffset: 3 },
  { id: 'Africa/Casablanca', city: 'Casablanca', country: 'Morocco', abbreviation: 'WET/WEST', utcOffset: 1, dstOffset: 1 },
  { id: 'Africa/Accra', city: 'Accra', country: 'Ghana', abbreviation: 'GMT', utcOffset: 0, dstOffset: 0 },
  { id: 'Africa/Addis_Ababa', city: 'Addis Ababa', country: 'Ethiopia', abbreviation: 'EAT', utcOffset: 3, dstOffset: 3 },
  { id: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam', country: 'Tanzania', abbreviation: 'EAT', utcOffset: 3, dstOffset: 3 },
  { id: 'Africa/Kinshasa', city: 'Kinshasa', country: 'DR Congo', abbreviation: 'WAT', utcOffset: 1, dstOffset: 1 },
  { id: 'Africa/Algiers', city: 'Algiers', country: 'Algeria', abbreviation: 'CET', utcOffset: 1, dstOffset: 1 },

  // UTC
  { id: 'UTC', city: 'UTC', country: 'Coordinated Universal Time', abbreviation: 'UTC', utcOffset: 0, dstOffset: 0 },

  // Additional entries to reach 100+
  { id: 'America/Bogota', city: 'Bogota', country: 'Colombia', abbreviation: 'COT', utcOffset: -5, dstOffset: -5 },
  { id: 'America/Havana', city: 'Havana', country: 'Cuba', abbreviation: 'CST/CDT', utcOffset: -5, dstOffset: -4 },
  { id: 'America/Guatemala', city: 'Guatemala City', country: 'Guatemala', abbreviation: 'CST', utcOffset: -6, dstOffset: -6 },
  { id: 'Europe/Minsk', city: 'Minsk', country: 'Belarus', abbreviation: 'MSK', utcOffset: 3, dstOffset: 3 },
  { id: 'Asia/Kabul', city: 'Kabul', country: 'Afghanistan', abbreviation: 'AFT', utcOffset: 4.5, dstOffset: 4.5 },
  { id: 'Asia/Yangon', city: 'Yangon', country: 'Myanmar', abbreviation: 'MMT', utcOffset: 6.5, dstOffset: 6.5 },
  { id: 'Indian/Maldives', city: 'Male', country: 'Maldives', abbreviation: 'MVT', utcOffset: 5, dstOffset: 5 },
  { id: 'Indian/Mauritius', city: 'Port Louis', country: 'Mauritius', abbreviation: 'MUT', utcOffset: 4, dstOffset: 4 },
  { id: 'Atlantic/Reykjavik', city: 'Reykjavik', country: 'Iceland', abbreviation: 'GMT', utcOffset: 0, dstOffset: 0 },
  { id: 'Pacific/Port_Moresby', city: 'Port Moresby', country: 'Papua New Guinea', abbreviation: 'PGT', utcOffset: 10, dstOffset: 10 },
];

/**
 * Converts a time from one timezone to another.
 * Uses the Intl.DateTimeFormat API for accuracy with DST handling.
 * 
 * @param {{hours: number, minutes: number, seconds: number}} time
 * @param {{year: number, month: number, day: number}} date - Needed for DST calculation
 * @param {string} sourceZone - IANA timezone identifier
 * @param {string} targetZone - IANA timezone identifier
 * @returns {{convertedTime: {hours: number, minutes: number, seconds: number}, convertedDate: {year: number, month: number, day: number}, crossesDST: boolean, dstNote: string|null, offsetHours: number}}
 */
export function convertTimezone(time, date, sourceZone, targetZone) {
  const { hours, minutes, seconds } = time;
  const { year, month, day } = date;

  // Create a Date object representing the given time in the source timezone.
  // We use the Intl API to determine UTC offset for the source zone on that date,
  // then construct the correct UTC time.
  const sourceOffset = getTimezoneOffsetMinutes(sourceZone, year, month, day, hours);
  const targetOffset = getTimezoneOffsetMinutes(targetZone, year, month, day, hours);

  // Convert source local time to UTC (in minutes from midnight)
  const sourceMinutesFromMidnight = hours * 60 + minutes;
  // UTC minutes from midnight of that day
  const utcMinutes = sourceMinutesFromMidnight - sourceOffset;

  // Convert UTC to target local time
  const targetMinutes = utcMinutes + targetOffset;

  // Handle day crossover
  let totalSeconds = targetMinutes * 60 + (seconds || 0);
  let dayOffset = 0;
  const secondsInDay = 24 * 60 * 60;

  while (totalSeconds < 0) {
    totalSeconds += secondsInDay;
    dayOffset--;
  }
  while (totalSeconds >= secondsInDay) {
    totalSeconds -= secondsInDay;
    dayOffset++;
  }

  const convertedHours = Math.floor(totalSeconds / 3600);
  const convertedMinutes = Math.floor((totalSeconds % 3600) / 60);
  const convertedSeconds = totalSeconds % 60;

  // Calculate converted date (applying day offset)
  let convertedDate = { year, month, day };
  if (dayOffset !== 0) {
    convertedDate = addDaysSimple(year, month, day, dayOffset);
  }

  // Check DST status
  const sourceDST = getDSTStatus(sourceZone, date);
  const targetDST = getDSTStatus(targetZone, convertedDate);
  const crossesDST = sourceDST.isDST !== targetDST.isDST;

  let dstNote = null;
  if (crossesDST) {
    if (targetDST.isDST) {
      dstNote = `${targetZone} is currently observing Daylight Saving Time`;
    } else {
      dstNote = `${targetZone} is currently on Standard Time`;
    }
  }

  const offsetHours = (targetOffset - sourceOffset) / 60;

  return {
    convertedTime: { hours: convertedHours, minutes: convertedMinutes, seconds: convertedSeconds },
    convertedDate,
    crossesDST,
    dstNote,
    offsetHours
  };
}

/**
 * Gets the UTC offset in minutes for a timezone at a specific date/time.
 * Uses the Intl API when available, falls back to database values.
 * 
 * @param {string} zone - IANA timezone identifier
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @param {number} [hour=12] - Hour (used for DST boundary detection)
 * @returns {number} UTC offset in minutes (positive = ahead of UTC)
 */
function getTimezoneOffsetMinutes(zone, year, month, day, hour = 12) {
  // Try using Intl API for accuracy
  try {
    // Create a UTC Date for the given parameters
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
    
    // Get the formatted parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(utcDate);
    const getValue = (type) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };

    const localYear = getValue('year');
    const localMonth = getValue('month');
    const localDay = getValue('day');
    let localHour = getValue('hour');
    if (localHour === 24) localHour = 0;
    const localMinute = getValue('minute');

    // Compute difference between local time and UTC time
    const utcTotalMinutes = utcDate.getUTCHours() * 60 + utcDate.getUTCMinutes();
    const localTotalMinutes = localHour * 60 + localMinute;
    
    // Account for day difference
    let dayDiff = 0;
    if (localDay !== utcDate.getUTCDate()) {
      if (localDay > utcDate.getUTCDate() || (localMonth > utcDate.getUTCMonth() + 1) || (localYear > utcDate.getUTCFullYear())) {
        dayDiff = 1;
      } else {
        dayDiff = -1;
      }
    }

    const offsetMinutes = (localTotalMinutes + dayDiff * 24 * 60) - utcTotalMinutes;
    return offsetMinutes;
  } catch (e) {
    // Fallback to database values
    const entry = TIMEZONE_DATABASE.find(tz => tz.id === zone);
    if (entry) {
      const isDST = isInDSTPeriod(month, day, zone);
      const offset = isDST ? entry.dstOffset : entry.utcOffset;
      return offset * 60;
    }
    return 0;
  }
}

/**
 * Simple heuristic to check if a date falls in DST period.
 * Used as fallback when Intl API is not available.
 * 
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 * @param {string} zone - IANA timezone identifier
 * @returns {boolean}
 */
function isInDSTPeriod(month, day, zone) {
  const entry = TIMEZONE_DATABASE.find(tz => tz.id === zone);
  if (!entry || entry.utcOffset === entry.dstOffset) {
    return false; // No DST observed
  }

  // Southern hemisphere zones (reverse DST)
  const southernZones = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Adelaide', 'Pacific/Auckland', 'America/Santiago'];
  const isSouthern = southernZones.some(sz => zone.startsWith(sz) || zone === sz);

  if (isSouthern) {
    // DST from October to March (approximately)
    return month >= 10 || month <= 3;
  } else {
    // Northern hemisphere: DST from March to October (approximately)
    return month >= 3 && month <= 10;
  }
}

/**
 * Simple date addition helper (without importing date-calc to avoid circular deps).
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day
 * @param {number} days - Number of days to add (can be negative)
 * @returns {{year: number, month: number, day: number}}
 */
function addDaysSimple(year, month, day, days) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const getDim = (y, m) => (m === 2 && isLeap(y)) ? 29 : daysInMonth[m - 1];

  let d = day + days;
  let m = month;
  let y = year;

  while (d > getDim(y, m)) {
    d -= getDim(y, m);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  while (d < 1) {
    m--;
    if (m < 1) { m = 12; y--; }
    d += getDim(y, m);
  }

  return { year: y, month: m, day: d };
}

/**
 * Searches timezone database by city, country, or abbreviation.
 * Case-insensitive substring matching.
 * Returns up to 10 results.
 * 
 * @param {string} query - Search query
 * @returns {Array<{id: string, city: string, country: string, abbreviation: string, utcOffset: number, dstOffset: number}>}
 */
export function searchTimezones(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const results = [];

  for (const entry of TIMEZONE_DATABASE) {
    if (results.length >= 10) break;

    const matches =
      entry.city.toLowerCase().includes(q) ||
      entry.country.toLowerCase().includes(q) ||
      entry.abbreviation.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q);

    if (matches) {
      results.push({ ...entry });
    }
  }

  return results;
}

/**
 * Returns whether a timezone is currently observing DST.
 * Uses the Intl API for accurate detection.
 * 
 * @param {string} zone - IANA timezone identifier
 * @param {{year: number, month: number, day: number}} date
 * @returns {{isDST: boolean, offset: number, dstNote: string|undefined}}
 */
export function getDSTStatus(zone, date) {
  const { year, month, day } = date;
  const entry = TIMEZONE_DATABASE.find(tz => tz.id === zone);

  // If zone doesn't observe DST
  if (entry && entry.utcOffset === entry.dstOffset) {
    return {
      isDST: false,
      offset: entry.utcOffset,
      dstNote: undefined
    };
  }

  // Try using Intl API
  try {
    // Check January (standard time) and July (DST in northern hemisphere) offsets
    const janDate = new Date(Date.UTC(year, 0, 15, 12, 0, 0));
    const julDate = new Date(Date.UTC(year, 6, 15, 12, 0, 0));
    const checkDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    const getOffset = (d) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(d);
      const getValue = (type) => {
        const part = parts.find(p => p.type === type);
        return part ? parseInt(part.value, 10) : 0;
      };
      let localHour = getValue('hour');
      if (localHour === 24) localHour = 0;
      const localMinute = getValue('minute');
      const localDay = getValue('day');
      const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
      const localMinutes = localHour * 60 + localMinute;
      let dayDiff = localDay - d.getUTCDate();
      if (dayDiff > 15) dayDiff -= 30; // Month boundary
      if (dayDiff < -15) dayDiff += 30;
      return localMinutes + dayDiff * 24 * 60 - utcMinutes;
    };

    const janOffset = getOffset(janDate);
    const julOffset = getOffset(julDate);
    const currentOffset = getOffset(checkDate);

    // Standard time has the smaller (more negative or less positive) offset in northern hemisphere
    const standardOffset = Math.min(janOffset, julOffset);
    const isDST = currentOffset > standardOffset;

    const offsetHours = currentOffset / 60;

    return {
      isDST,
      offset: offsetHours,
      dstNote: isDST ? `Currently observing Daylight Saving Time (UTC${offsetHours >= 0 ? '+' : ''}${offsetHours})` : undefined
    };
  } catch (e) {
    // Fallback to heuristic
    const isDST = isInDSTPeriod(month, day, zone);
    const offset = entry ? (isDST ? entry.dstOffset : entry.utcOffset) : 0;
    return {
      isDST,
      offset,
      dstNote: isDST ? `Currently observing Daylight Saving Time (UTC${offset >= 0 ? '+' : ''}${offset})` : undefined
    };
  }
}

/**
 * Returns all timezone entries (for listing/display).
 * @returns {Array<{id: string, city: string, country: string, abbreviation: string, utcOffset: number, dstOffset: number}>}
 */
export function getAllTimezones() {
  return TIMEZONE_DATABASE.map(entry => ({ ...entry }));
}

/**
 * Returns the UTC offset in hours for a timezone at a specific date.
 * @param {string} zone - IANA timezone identifier
 * @param {{year: number, month: number, day: number}} date
 * @returns {number} offset in hours
 */
export function getTimezoneOffset(zone, date) {
  const offsetMinutes = getTimezoneOffsetMinutes(zone, date.year, date.month, date.day);
  return offsetMinutes / 60;
}
