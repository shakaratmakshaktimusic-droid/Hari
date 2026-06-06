/**
 * Unit tests for js/core/timezone-db.js
 * Uses Node.js built-in test runner.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  convertTimezone,
  searchTimezones,
  getDSTStatus,
  getAllTimezones,
  getTimezoneOffset
} from '../js/core/timezone-db.js';

describe('getAllTimezones', () => {
  it('should return at least 100 timezone entries', () => {
    const all = getAllTimezones();
    assert(all.length >= 100, `Expected at least 100, got ${all.length}`);
  });

  it('each entry should have required fields', () => {
    const all = getAllTimezones();
    for (const entry of all) {
      assert(entry.id, 'Missing id');
      assert(entry.city, 'Missing city');
      assert(entry.country, 'Missing country');
      assert(entry.abbreviation, 'Missing abbreviation');
      assert(typeof entry.utcOffset === 'number', 'utcOffset should be number');
      assert(typeof entry.dstOffset === 'number', 'dstOffset should be number');
    }
  });

  it('should include all required regions', () => {
    const all = getAllTimezones();
    const ids = all.map(e => e.id);

    // US timezones
    assert(ids.includes('America/New_York'));
    assert(ids.includes('America/Los_Angeles'));
    assert(ids.includes('America/Chicago'));
    assert(ids.includes('America/Denver'));
    assert(ids.includes('Pacific/Honolulu'));

    // Europe
    assert(ids.includes('Europe/London'));
    assert(ids.includes('Europe/Paris'));
    assert(ids.includes('Europe/Berlin'));
    assert(ids.includes('Europe/Madrid'));
    assert(ids.includes('Europe/Rome'));
    assert(ids.includes('Europe/Moscow'));

    // Asia
    assert(ids.includes('Asia/Tokyo'));
    assert(ids.includes('Asia/Shanghai'));
    assert(ids.includes('Asia/Kolkata'));
    assert(ids.includes('Asia/Dubai'));
    assert(ids.includes('Asia/Singapore'));
    assert(ids.includes('Asia/Bangkok'));
    assert(ids.includes('Asia/Seoul'));

    // Australia
    assert(ids.includes('Australia/Sydney'));
    assert(ids.includes('Australia/Melbourne'));
    assert(ids.includes('Australia/Perth'));

    // South America
    assert(ids.includes('America/Sao_Paulo'));
    assert(ids.includes('America/Argentina/Buenos_Aires'));
    assert(ids.includes('America/Lima'));

    // Africa
    assert(ids.includes('Africa/Cairo'));
    assert(ids.includes('Africa/Lagos'));
    assert(ids.includes('Africa/Johannesburg'));
    assert(ids.includes('Africa/Nairobi'));

    // Pacific
    assert(ids.includes('Pacific/Auckland'));
    assert(ids.includes('Pacific/Fiji'));
  });
});

describe('searchTimezones', () => {
  it('should find timezones by city name', () => {
    const results = searchTimezones('New York');
    assert(results.length > 0);
    assert(results.some(r => r.id === 'America/New_York'));
  });

  it('should find timezones by country', () => {
    const results = searchTimezones('Japan');
    assert(results.length > 0);
    assert(results.some(r => r.id === 'Asia/Tokyo'));
  });

  it('should find timezones by abbreviation', () => {
    const results = searchTimezones('PST');
    assert(results.length > 0);
    assert(results.some(r => r.id === 'America/Los_Angeles'));
  });

  it('should be case-insensitive', () => {
    const results1 = searchTimezones('london');
    const results2 = searchTimezones('LONDON');
    assert(results1.length > 0);
    assert.equal(results1.length, results2.length);
  });

  it('should return at most 10 results', () => {
    const results = searchTimezones('a'); // Very broad search
    assert(results.length <= 10);
  });

  it('should return empty array for empty query', () => {
    assert.deepEqual(searchTimezones(''), []);
    assert.deepEqual(searchTimezones(null), []);
    assert.deepEqual(searchTimezones(undefined), []);
  });

  it('should return empty array for no matches', () => {
    const results = searchTimezones('zzxxyynomatch');
    assert.equal(results.length, 0);
  });

  it('should find by IANA id substring', () => {
    const results = searchTimezones('America/Chi');
    assert(results.length > 0);
    assert(results.some(r => r.id === 'America/Chicago'));
  });
});

describe('convertTimezone', () => {
  it('should convert New York to London (EST → GMT, winter)', () => {
    // In January (EST = UTC-5, GMT = UTC+0), so 10:00 EST = 15:00 GMT
    const result = convertTimezone(
      { hours: 10, minutes: 0, seconds: 0 },
      { year: 2024, month: 1, day: 15 },
      'America/New_York',
      'Europe/London'
    );
    assert.equal(result.convertedTime.hours, 15);
    assert.equal(result.convertedTime.minutes, 0);
    assert.equal(result.offsetHours, 5);
  });

  it('should convert London to Tokyo', () => {
    // In January: GMT = UTC+0, JST = UTC+9, so 12:00 GMT = 21:00 JST
    const result = convertTimezone(
      { hours: 12, minutes: 0, seconds: 0 },
      { year: 2024, month: 1, day: 15 },
      'Europe/London',
      'Asia/Tokyo'
    );
    assert.equal(result.convertedTime.hours, 21);
    assert.equal(result.convertedTime.minutes, 0);
  });

  it('should handle date crossing (forward)', () => {
    // 23:00 London → +9 = 08:00 next day Tokyo
    const result = convertTimezone(
      { hours: 23, minutes: 0, seconds: 0 },
      { year: 2024, month: 1, day: 15 },
      'Europe/London',
      'Asia/Tokyo'
    );
    assert.equal(result.convertedTime.hours, 8);
    assert.equal(result.convertedDate.day, 16);
  });

  it('should handle date crossing (backward)', () => {
    // 02:00 Tokyo → -9 = 17:00 previous day London
    const result = convertTimezone(
      { hours: 2, minutes: 0, seconds: 0 },
      { year: 2024, month: 1, day: 15 },
      'Asia/Tokyo',
      'Europe/London'
    );
    assert.equal(result.convertedTime.hours, 17);
    assert.equal(result.convertedDate.day, 14);
  });

  it('should preserve minutes and seconds', () => {
    const result = convertTimezone(
      { hours: 10, minutes: 30, seconds: 45 },
      { year: 2024, month: 1, day: 15 },
      'America/New_York',
      'Europe/London'
    );
    assert.equal(result.convertedTime.minutes, 30);
    assert.equal(result.convertedTime.seconds, 45);
  });

  it('should convert same timezone to itself', () => {
    const result = convertTimezone(
      { hours: 14, minutes: 30, seconds: 0 },
      { year: 2024, month: 6, day: 15 },
      'America/New_York',
      'America/New_York'
    );
    assert.equal(result.convertedTime.hours, 14);
    assert.equal(result.convertedTime.minutes, 30);
    assert.equal(result.offsetHours, 0);
  });
});

describe('getDSTStatus', () => {
  it('should detect DST for New York in summer', () => {
    const result = getDSTStatus('America/New_York', { year: 2024, month: 7, day: 15 });
    assert.equal(result.isDST, true);
  });

  it('should detect standard time for New York in winter', () => {
    const result = getDSTStatus('America/New_York', { year: 2024, month: 1, day: 15 });
    assert.equal(result.isDST, false);
  });

  it('should return isDST false for zones without DST', () => {
    // Phoenix does not observe DST
    const result = getDSTStatus('America/Phoenix', { year: 2024, month: 7, day: 15 });
    assert.equal(result.isDST, false);
  });

  it('should return offset for the timezone', () => {
    const result = getDSTStatus('Asia/Tokyo', { year: 2024, month: 6, day: 15 });
    assert.equal(result.isDST, false); // Japan doesn't observe DST
    assert.equal(result.offset, 9);
  });
});

describe('getTimezoneOffset', () => {
  it('should return correct offset for UTC', () => {
    const offset = getTimezoneOffset('UTC', { year: 2024, month: 6, day: 15 });
    assert.equal(offset, 0);
  });

  it('should return correct offset for Tokyo', () => {
    const offset = getTimezoneOffset('Asia/Tokyo', { year: 2024, month: 6, day: 15 });
    assert.equal(offset, 9);
  });

  it('should return correct offset for New York in winter (EST)', () => {
    const offset = getTimezoneOffset('America/New_York', { year: 2024, month: 1, day: 15 });
    assert.equal(offset, -5);
  });

  it('should return correct offset for New York in summer (EDT)', () => {
    const offset = getTimezoneOffset('America/New_York', { year: 2024, month: 7, day: 15 });
    assert.equal(offset, -4);
  });
});
