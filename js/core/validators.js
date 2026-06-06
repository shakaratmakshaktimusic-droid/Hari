/**
 * Input validation utilities for calculator forms.
 * 
 * Provides structured validation for date inputs, numeric inputs,
 * date ranges, and date ordering. All functions are pure and return
 * structured results with descriptive error messages.
 */

import { parseDate, validateDate } from './date-parser.js';

/**
 * Validates a date input string from a form field.
 * Checks for empty/whitespace, parses the date, and returns structured result.
 * 
 * @param {string} input - The raw date string from user input
 * @param {string} fieldName - The field name for error messages (default: 'Date')
 * @param {string} preferredFormat - Format hint for parsing: 'MDY' or 'DMY' (default: 'MDY')
 * @returns {{valid: boolean, date?: {year: number, month: number, day: number}, error?: string}}
 */
export function validateDateInput(input, fieldName = 'Date', preferredFormat = 'MDY') {
  // Check for null/undefined
  if (input === null || input === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  // Check for non-string types
  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} must be a text value` };
  }

  // Check for empty/whitespace-only
  const trimmed = input.trim();
  if (trimmed === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  // Parse the date
  const parseResult = parseDate(trimmed, preferredFormat);
  if (!parseResult.success) {
    return { valid: false, error: `${fieldName}: ${parseResult.error}` };
  }

  return { valid: true, date: parseResult.date };
}

/**
 * Validates a numeric input with configurable constraints.
 * 
 * @param {string|number} input - The raw input value
 * @param {Object} constraints - Validation constraints
 * @param {number} [constraints.min] - Minimum allowed value (inclusive)
 * @param {number} [constraints.max] - Maximum allowed value (inclusive)
 * @param {boolean} [constraints.integer] - Whether only integers are allowed
 * @param {string} [constraints.fieldName] - Field name for error messages (default: 'Value')
 * @returns {{valid: boolean, value?: number, error?: string}}
 */
export function validateNumericInput(input, constraints = {}) {
  const { min, max, integer = false, fieldName = 'Value' } = constraints;

  // Check for null/undefined
  if (input === null || input === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  // Handle string input: check for empty
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return { valid: false, error: `${fieldName} is required` };
    }
    // Attempt numeric parse
    input = Number(trimmed);
  }

  // Check if it's a valid number
  if (typeof input !== 'number' || isNaN(input)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  // Check for infinity
  if (!Number.isFinite(input)) {
    return { valid: false, error: `${fieldName} must be a finite number` };
  }

  // Check integer constraint
  if (integer && !Number.isInteger(input)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }

  // Check minimum bound
  if (min !== undefined && min !== null && input < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  // Check maximum bound
  if (max !== undefined && max !== null && input > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, value: input };
}

/**
 * Validates that a date falls within the supported range (0001-01-01 to 9999-12-31).
 * 
 * @param {{year: number, month: number, day: number}} date - The date to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateDateRange(date) {
  // Check for null/undefined/non-object
  if (!date || typeof date !== 'object') {
    return { valid: false, error: 'Date object is required' };
  }

  const { year, month, day } = date;

  // First validate the date itself
  const dateValidation = validateDate(year, month, day);
  if (!dateValidation.valid) {
    return { valid: false, error: dateValidation.error };
  }

  // validateDate already checks year 1-9999, but be explicit
  if (year < 1 || year > 9999) {
    return { valid: false, error: 'Date must be between January 1, 0001 and December 31, 9999' };
  }

  return { valid: true };
}

/**
 * Validates the ordering of two dates (start should be before or equal to end).
 * Validates both dates individually first, then checks ordering.
 * 
 * @param {{year: number, month: number, day: number}} startDate - The start date
 * @param {{year: number, month: number, day: number}} endDate - The end date
 * @returns {{valid: boolean, reversed?: boolean, error?: string}}
 */
export function validateDateOrder(startDate, endDate) {
  // Validate start date
  if (!startDate || typeof startDate !== 'object') {
    return { valid: false, error: 'Start date is required' };
  }

  if (!endDate || typeof endDate !== 'object') {
    return { valid: false, error: 'End date is required' };
  }

  // Validate start date existence
  const startValidation = validateDate(startDate.year, startDate.month, startDate.day);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  // Validate end date existence
  const endValidation = validateDate(endDate.year, endDate.month, endDate.day);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  // Validate both dates are in range
  const startRange = validateDateRange(startDate);
  if (!startRange.valid) {
    return { valid: false, error: `Start date: ${startRange.error}` };
  }

  const endRange = validateDateRange(endDate);
  if (!endRange.valid) {
    return { valid: false, error: `End date: ${endRange.error}` };
  }

  // Compare dates: convert to comparable numbers
  const startValue = startDate.year * 10000 + startDate.month * 100 + startDate.day;
  const endValue = endDate.year * 10000 + endDate.month * 100 + endDate.day;

  if (startValue > endValue) {
    return { valid: true, reversed: true };
  }

  return { valid: true, reversed: false };
}
