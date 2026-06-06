/**
 * Business Day Calculator - Calculate working days between dates or find date after N business days.
 * Supports holiday presets for 12 countries and custom recurring holidays.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
import { parseDate, formatDate, validateDate } from '../core/date-parser.js';
import { countBusinessDays, addBusinessDays, getDayOfWeekName, getDayOfWeek } from '../core/date-calc.js';
import { validateDateInput, validateNumericInput } from '../core/validators.js';
import { getSupportedCountries, getHolidaySet, getHolidays } from '../core/holiday-db.js';
import DateInputComponent from '../ui/date-input.js';

const BusinessDayCalculator = {
  _mode: 'count', // 'count' or 'add'
  _selectedCountry: '',
  _customHolidays: [],

  /**
   * Initialize the Business Day Calculator UI.
   * Renders the tabbed interface into #calculator-card and sets up event handlers.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!this._calculatorCard) return;

    this._render();
    this._bindEvents();
  },

  /**
   * Render the full calculator UI with tabs and current mode form.
   */
  _render() {
    this._calculatorCard.innerHTML = `
      <div class="tabs">
        <button class="tab-btn ${this._mode === 'count' ? 'tab-btn--active' : ''}" data-mode="count" aria-selected="${this._mode === 'count'}">
          Count Business Days
        </button>
        <button class="tab-btn ${this._mode === 'add' ? 'tab-btn--active' : ''}" data-mode="add" aria-selected="${this._mode === 'add'}">
          Add Business Days
        </button>
      </div>
      <div class="tab-content" id="tab-content">
        ${this._mode === 'count' ? this._getCountFormHTML() : this._getAddFormHTML()}
      </div>
    `;
  },

  /**
   * Returns HTML string for the "Count Business Days" form.
   * Includes start/end date inputs, country selector, custom holidays, and calculate button.
   * @returns {string}
   */
  _getCountFormHTML() {
    const countries = getSupportedCountries();
    const countryOptions = countries.map(c =>
      `<option value="${c.code}" ${c.code === this._selectedCountry ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    return `
      <form id="business-days-form" class="business-days-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'start-date', label: 'Start Date' })}
          </div>
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'end-date', label: 'End Date' })}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="country-select">Holiday Calendar (Optional)</label>
          <select id="country-select" class="input-field glass-input select-field">
            <option value="">No holidays — weekdays only</option>
            ${countryOptions}
          </select>
          <span class="form-hint">Select a country to automatically exclude public holidays</span>
        </div>

        ${this._getCustomHolidaysHTML()}

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Calculate Business Days
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Returns HTML string for the "Add Business Days" form.
   * Includes start date, number of days input, country selector, and calculate button.
   * @returns {string}
   */
  _getAddFormHTML() {
    const countries = getSupportedCountries();
    const countryOptions = countries.map(c =>
      `<option value="${c.code}" ${c.code === this._selectedCountry ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    return `
      <form id="business-days-form" class="business-days-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'start-date', label: 'Start Date' })}
          </div>

          <div class="form-group form-group--half">
            <label class="form-label" for="business-days-count">Business Days to Add</label>
            <div class="input-wrapper">
              <input
                type="number"
                id="business-days-count"
                class="input-field glass-input"
                placeholder="e.g., 10"
                autocomplete="off"
                aria-describedby="business-days-count-error"
              />
            </div>
            <span id="business-days-count-error" class="error-message" role="alert" hidden></span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="country-select">Holiday Calendar (Optional)</label>
          <select id="country-select" class="input-field glass-input select-field">
            <option value="">No holidays — weekdays only</option>
            ${countryOptions}
          </select>
          <span class="form-hint">Select a country to automatically exclude public holidays</span>
        </div>

        ${this._getCustomHolidaysHTML()}

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Find Result Date
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Returns HTML string for the custom holidays section.
   * Allows users to add/remove recurring holidays (month/day + name).
   * @returns {string}
   */
  _getCustomHolidaysHTML() {
    const rows = this._customHolidays.map((h, i) => `
      <div class="custom-holiday-row" data-index="${i}">
        <select class="input-field glass-input custom-holiday-month" aria-label="Month">
          ${Array.from({ length: 12 }, (_, m) =>
            `<option value="${m + 1}" ${h.month === m + 1 ? 'selected' : ''}>${this._getMonthName(m + 1)}</option>`
          ).join('')}
        </select>
        <input type="number" class="input-field glass-input custom-holiday-day" min="1" max="31" value="${h.day}" aria-label="Day" />
        <input type="text" class="input-field glass-input custom-holiday-name" value="${h.name}" placeholder="Holiday name" aria-label="Holiday name" />
        <button type="button" class="btn btn--ghost btn--remove-holiday" data-index="${i}" aria-label="Remove holiday">
          &times;
        </button>
      </div>
    `).join('');

    return `
      <div class="form-group custom-holidays-section">
        <label class="form-label">Custom Recurring Holidays</label>
        <div id="custom-holidays-list" class="custom-holidays-list">
          ${rows}
        </div>
        <button type="button" class="btn btn--ghost btn--add-holiday" id="add-holiday-btn">
          + Add Custom Holiday
        </button>
        <span class="form-hint">Define recurring holidays (e.g., every December 25)</span>
      </div>
    `;
  },

  /**
   * Bind DOM event handlers for tabs, form submission, today buttons, and custom holidays.
   */
  _bindEvents() {
    // Tab switching
    const tabs = this._calculatorCard.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this._mode = tab.getAttribute('data-mode');
        this._render();
        this._bindEvents();
      });
    });

    // Initialize DateInputComponent listeners (calendar picker, today buttons, auto-tab)
    DateInputComponent.initListeners(this._calculatorCard);

    // Form submission
    const form = document.getElementById('business-days-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this._mode === 'count') {
          this.countBetween();
        } else {
          this.addDays();
        }
      });
    }

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._clearForm());
    }

    // Country selector change
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        this._selectedCountry = countrySelect.value;
      });
    }

    // Add custom holiday button
    const addHolidayBtn = document.getElementById('add-holiday-btn');
    if (addHolidayBtn) {
      addHolidayBtn.addEventListener('click', () => {
        this._customHolidays.push({ month: 1, day: 1, name: '' });
        this._refreshCustomHolidays();
      });
    }

    // Remove custom holiday buttons
    this._bindRemoveHolidayButtons();
  },

  /**
   * Bind event listeners for remove holiday buttons and change events on custom holiday inputs.
   */
  _bindRemoveHolidayButtons() {
    const removeButtons = this._calculatorCard.querySelectorAll('.btn--remove-holiday');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        this._customHolidays.splice(index, 1);
        this._refreshCustomHolidays();
      });
    });

    // Sync custom holiday input values on change
    const rows = this._calculatorCard.querySelectorAll('.custom-holiday-row');
    rows.forEach(row => {
      const index = parseInt(row.getAttribute('data-index'), 10);
      const monthSelect = row.querySelector('.custom-holiday-month');
      const dayInput = row.querySelector('.custom-holiday-day');
      const nameInput = row.querySelector('.custom-holiday-name');

      if (monthSelect) {
        monthSelect.addEventListener('change', () => {
          this._customHolidays[index].month = parseInt(monthSelect.value, 10);
        });
      }
      if (dayInput) {
        dayInput.addEventListener('change', () => {
          this._customHolidays[index].day = parseInt(dayInput.value, 10) || 1;
        });
      }
      if (nameInput) {
        nameInput.addEventListener('input', () => {
          this._customHolidays[index].name = nameInput.value;
        });
      }
    });
  },

  /**
   * Refresh only the custom holidays section (avoid full re-render).
   */
  _refreshCustomHolidays() {
    const container = document.getElementById('custom-holidays-list');
    if (!container) return;

    const rows = this._customHolidays.map((h, i) => `
      <div class="custom-holiday-row" data-index="${i}">
        <select class="input-field glass-input custom-holiday-month" aria-label="Month">
          ${Array.from({ length: 12 }, (_, m) =>
            `<option value="${m + 1}" ${h.month === m + 1 ? 'selected' : ''}>${this._getMonthName(m + 1)}</option>`
          ).join('')}
        </select>
        <input type="number" class="input-field glass-input custom-holiday-day" min="1" max="31" value="${h.day}" aria-label="Day" />
        <input type="text" class="input-field glass-input custom-holiday-name" value="${h.name}" placeholder="Holiday name" aria-label="Holiday name" />
        <button type="button" class="btn btn--ghost btn--remove-holiday" data-index="${i}" aria-label="Remove holiday">
          &times;
        </button>
      </div>
    `).join('');

    container.innerHTML = rows;
    this._bindRemoveHolidayButtons();
  },

  /**
   * Build a combined holiday Set from the country preset and custom holidays for the relevant years.
   * @param {number} startYear
   * @param {number} endYear
   * @returns {{holidaySet: Set<string>, holidayDetails: Array<{date: string, name: string}>}}
   */
  _buildHolidaySet(startYear, endYear) {
    const holidaySet = new Set();
    const holidayDetails = [];

    // Get all unique years that span the range
    const years = new Set();
    for (let y = startYear; y <= endYear; y++) {
      years.add(y);
    }

    // Add country holidays
    if (this._selectedCountry) {
      for (const year of years) {
        const holidays = getHolidays(this._selectedCountry, year);
        for (const h of holidays) {
          if (!holidaySet.has(h.date)) {
            holidaySet.add(h.date);
            holidayDetails.push({ date: h.date, name: h.name });
          }
        }
      }
    }

    // Add custom recurring holidays
    if (this._customHolidays.length > 0) {
      for (const year of years) {
        for (const custom of this._customHolidays) {
          if (custom.month >= 1 && custom.month <= 12 && custom.day >= 1 && custom.day <= 31) {
            const dateStr = `${String(year).padStart(4, '0')}-${String(custom.month).padStart(2, '0')}-${String(custom.day).padStart(2, '0')}`;
            if (!holidaySet.has(dateStr)) {
              holidaySet.add(dateStr);
              holidayDetails.push({ date: dateStr, name: custom.name || 'Custom Holiday' });
            }
          }
        }
      }
    }

    // Sort details by date
    holidayDetails.sort((a, b) => a.date.localeCompare(b.date));

    return { holidaySet, holidayDetails };
  },

  /**
   * Count business days between two dates (mode: 'count').
   * Validates inputs, builds holiday set, computes result, and renders.
   */
  countBetween() {
    this._clearAllErrors();

    // Get date values from DateInputComponent
    const startDateValue = DateInputComponent.getValue('start-date');
    const endDateValue = DateInputComponent.getValue('end-date');

    // Validate start date
    if (!startDateValue) {
      DateInputComponent.showError('start-date', 'Start date is required');
      return;
    }
    const startValidation = validateDate(startDateValue.year, startDateValue.month, startDateValue.day);
    if (!startValidation.valid) {
      DateInputComponent.showError('start-date', startValidation.error);
      return;
    }

    // Validate end date
    if (!endDateValue) {
      DateInputComponent.showError('end-date', 'End date is required');
      return;
    }
    const endValidation = validateDate(endDateValue.year, endDateValue.month, endDateValue.day);
    if (!endValidation.valid) {
      DateInputComponent.showError('end-date', endValidation.error);
      return;
    }

    const startDate = startDateValue;
    const endDate = endDateValue;

    // Read country from dropdown (in case user changed without triggering change event)
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
      this._selectedCountry = countrySelect.value;
    }

    // Determine year range for holiday lookup
    const minYear = Math.min(startDate.year, endDate.year);
    const maxYear = Math.max(startDate.year, endDate.year);

    // Build holiday set
    const { holidaySet, holidayDetails } = this._buildHolidaySet(minYear, maxYear);

    // Calculate business days
    const result = countBusinessDays(startDate, endDate, holidaySet);

    // Find which holidays fell in the range and were excluded
    const excludedHolidays = this._getExcludedHolidays(startDate, endDate, holidayDetails);

    this._renderCountResult(result, startDate, endDate, excludedHolidays);
  },

  /**
   * Add N business days to a start date (mode: 'add').
   * Validates inputs, builds holiday set, computes result, and renders.
   */
  addDays() {
    this._clearAllErrors();

    const daysInput = document.getElementById('business-days-count');
    const daysValue = daysInput ? daysInput.value : '';

    // Get start date from DateInputComponent
    const startDateValue = DateInputComponent.getValue('start-date');

    // Validate start date
    if (!startDateValue) {
      DateInputComponent.showError('start-date', 'Start date is required');
      return;
    }
    const startValidation = validateDate(startDateValue.year, startDateValue.month, startDateValue.day);
    if (!startValidation.valid) {
      DateInputComponent.showError('start-date', startValidation.error);
      return;
    }

    // Validate business days count
    const daysValidation = validateNumericInput(daysValue, {
      min: -9999,
      max: 9999,
      integer: true,
      fieldName: 'Business days'
    });
    if (!daysValidation.valid) {
      this._showFieldError('business-days-count', daysValidation.error);
      return;
    }

    const startDate = startDateValue;
    const businessDaysToAdd = daysValidation.value;

    // Read country from dropdown
    const countrySelect = document.getElementById('country-select');
    if (countrySelect) {
      this._selectedCountry = countrySelect.value;
    }

    // Build holiday set — estimate year range (assume max ~20 years span for large additions)
    const estimatedYears = Math.ceil(Math.abs(businessDaysToAdd) / 250) + 1;
    const minYear = businessDaysToAdd >= 0 ? startDate.year : startDate.year - estimatedYears;
    const maxYear = businessDaysToAdd >= 0 ? startDate.year + estimatedYears : startDate.year;

    const { holidaySet, holidayDetails } = this._buildHolidaySet(minYear, maxYear);

    // Calculate result date
    const resultDate = addBusinessDays(startDate, businessDaysToAdd, holidaySet);

    // Find excluded holidays between start and result
    const excludedHolidays = this._getExcludedHolidays(startDate, resultDate, holidayDetails);

    this._renderAddResult(resultDate, startDate, businessDaysToAdd, excludedHolidays);
  },

  /**
   * Determine which holidays from the details list fall within the given date range
   * and are on a weekday (thus would have been excluded).
   * @param {{year: number, month: number, day: number}} startDate
   * @param {{year: number, month: number, day: number}} endDate
   * @param {Array<{date: string, name: string}>} holidayDetails
   * @returns {Array<{date: string, name: string, dayName: string}>}
   */
  _getExcludedHolidays(startDate, endDate, holidayDetails) {
    const excluded = [];
    const startStr = formatDate(startDate, 'YYYY-MM-DD');
    const endStr = formatDate(endDate, 'YYYY-MM-DD');

    const rangeStart = startStr < endStr ? startStr : endStr;
    const rangeEnd = startStr < endStr ? endStr : startStr;

    for (const h of holidayDetails) {
      if (h.date >= rangeStart && h.date <= rangeEnd) {
        // Check if this holiday falls on a weekday
        const parts = h.date.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const dow = getDayOfWeek(year, month, day);
        if (dow !== 0 && dow !== 6) {
          const dayName = getDayOfWeekName(year, month, day);
          excluded.push({ date: h.date, name: h.name, dayName });
        }
      }
    }

    return excluded;
  },

  /**
   * Render the result for "Count Business Days" mode.
   * @param {number} result - Business day count
   * @param {{year: number, month: number, day: number}} startDate
   * @param {{year: number, month: number, day: number}} endDate
   * @param {Array<{date: string, name: string, dayName: string}>} excludedHolidays
   */
  _renderCountResult(result, startDate, endDate, excludedHolidays) {
    if (!this._resultCard) return;

    const startDisplay = formatDate(startDate, 'MM/DD/YYYY');
    const endDisplay = formatDate(endDate, 'MM/DD/YYYY');
    const startDayName = getDayOfWeekName(startDate.year, startDate.month, startDate.day);
    const endDayName = getDayOfWeekName(endDate.year, endDate.month, endDate.day);

    const holidayListHTML = excludedHolidays.length > 0
      ? `
        <div class="result-holidays animate-slide-up stagger-2">
          <h3 class="result-section-title">Excluded Holidays (${excludedHolidays.length})</h3>
          <ul class="holiday-list">
            ${excludedHolidays.map(h => `
              <li class="holiday-item">
                <span class="holiday-date">${this._formatHolidayDate(h.date)}</span>
                <span class="holiday-name">${h.name}</span>
                <span class="holiday-day">(${h.dayName})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    const countryName = this._selectedCountry
      ? getSupportedCountries().find(c => c.code === this._selectedCountry)?.name || ''
      : '';

    this._resultCard.innerHTML = `
      <div class="result-header animate-fade-in">
        <div class="result-total">
          <span class="result-value">${result.toLocaleString()}</span>
          <span class="result-label">Business Days</span>
        </div>
      </div>

      <div class="result-details animate-slide-up stagger-1">
        <h3 class="result-section-title">Date Range</h3>
        <div class="result-date-info">
          <div class="result-date-row">
            <span class="result-date-label">Start:</span>
            <span class="result-date-value">${startDisplay} (${startDayName})</span>
          </div>
          <div class="result-date-row">
            <span class="result-date-label">End:</span>
            <span class="result-date-value">${endDisplay} (${endDayName})</span>
          </div>
          ${countryName ? `<div class="result-note"><span class="badge badge--info">Holiday calendar: ${countryName}</span></div>` : ''}
          ${!this._selectedCountry && this._customHolidays.length === 0 ? '<div class="result-note"><span class="badge badge--neutral">Weekdays only (no holidays excluded)</span></div>' : ''}
        </div>
      </div>

      ${holidayListHTML}

      <div class="result-summary animate-slide-up stagger-3">
        <h3 class="result-section-title">Summary</h3>
        <div class="result-units">
          <div class="result-unit">
            <span class="result-unit-value">${result}</span>
            <span class="result-unit-label">Business Days</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${Math.ceil(result / 5)}</span>
            <span class="result-unit-label">Approx. Weeks</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${excludedHolidays.length}</span>
            <span class="result-unit-label">Holidays Excluded</span>
          </div>
        </div>
      </div>
    `;

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Render the result for "Add Business Days" mode.
   * @param {{year: number, month: number, day: number}} resultDate
   * @param {{year: number, month: number, day: number}} startDate
   * @param {number} businessDaysAdded
   * @param {Array<{date: string, name: string, dayName: string}>} excludedHolidays
   */
  _renderAddResult(resultDate, startDate, businessDaysAdded, excludedHolidays) {
    if (!this._resultCard) return;

    const startDisplay = formatDate(startDate, 'MM/DD/YYYY');
    const resultDisplay = formatDate(resultDate, 'MM/DD/YYYY');
    const startDayName = getDayOfWeekName(startDate.year, startDate.month, startDate.day);
    const resultDayName = getDayOfWeekName(resultDate.year, resultDate.month, resultDate.day);
    const direction = businessDaysAdded >= 0 ? 'after' : 'before';

    const holidayListHTML = excludedHolidays.length > 0
      ? `
        <div class="result-holidays animate-slide-up stagger-2">
          <h3 class="result-section-title">Skipped Holidays (${excludedHolidays.length})</h3>
          <ul class="holiday-list">
            ${excludedHolidays.map(h => `
              <li class="holiday-item">
                <span class="holiday-date">${this._formatHolidayDate(h.date)}</span>
                <span class="holiday-name">${h.name}</span>
                <span class="holiday-day">(${h.dayName})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : '';

    const countryName = this._selectedCountry
      ? getSupportedCountries().find(c => c.code === this._selectedCountry)?.name || ''
      : '';

    this._resultCard.innerHTML = `
      <div class="result-header animate-fade-in">
        <div class="result-total">
          <span class="result-value">${resultDisplay}</span>
          <span class="result-label">${resultDayName}</span>
        </div>
      </div>

      <div class="result-details animate-slide-up stagger-1">
        <h3 class="result-section-title">Calculation Details</h3>
        <div class="result-date-info">
          <div class="result-date-row">
            <span class="result-date-label">Start:</span>
            <span class="result-date-value">${startDisplay} (${startDayName})</span>
          </div>
          <div class="result-date-row">
            <span class="result-date-label">Added:</span>
            <span class="result-date-value">${Math.abs(businessDaysAdded)} business day${Math.abs(businessDaysAdded) !== 1 ? 's' : ''} ${direction}</span>
          </div>
          <div class="result-date-row">
            <span class="result-date-label">Result:</span>
            <span class="result-date-value">${resultDisplay} (${resultDayName})</span>
          </div>
          ${countryName ? `<div class="result-note"><span class="badge badge--info">Holiday calendar: ${countryName}</span></div>` : ''}
          ${!this._selectedCountry && this._customHolidays.length === 0 ? '<div class="result-note"><span class="badge badge--neutral">Weekdays only (no holidays excluded)</span></div>' : ''}
        </div>
      </div>

      ${holidayListHTML}
    `;

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Format a "YYYY-MM-DD" string to a more readable display format.
   * @param {string} dateStr - "YYYY-MM-DD"
   * @returns {string}
   */
  _formatHolidayDate(dateStr) {
    const parts = dateStr.split('-');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);
    return `${this._getMonthName(month)} ${day}, ${year}`;
  },

  /**
   * Returns full month name for a given month number (1-12).
   * @param {number} month - 1-12
   * @returns {string}
   */
  _getMonthName(month) {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return names[month - 1] || '';
  },

  /**
   * Show a validation error for a specific field.
   * @param {string} fieldId - The input field ID
   * @param {string} message - The error message
   */
  _showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) {
      input.classList.add('input-field--error');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clear the error state for a specific field.
   * @param {string} fieldId - The input field ID
   */
  _clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (input) {
      input.classList.remove('input-field--error');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  },

  /**
   * Clear all validation errors in the form.
   */
  _clearAllErrors() {
    DateInputComponent.clearError('start-date');
    DateInputComponent.clearError('end-date');
    this._clearFieldError('business-days-count');
  },

  /**
   * Reset the form and result to initial state.
   */
  _clearForm() {
    // Clear DateInputComponent fields
    DateInputComponent.setValue('start-date', { year: '', month: '', day: '' });
    DateInputComponent.clearError('start-date');
    DateInputComponent.setValue('end-date', { year: '', month: '', day: '' });
    DateInputComponent.clearError('end-date');

    const daysInput = document.getElementById('business-days-count');
    const countrySelect = document.getElementById('country-select');

    if (daysInput) daysInput.value = '';
    if (countrySelect) countrySelect.value = '';

    this._selectedCountry = '';
    this._customHolidays = [];
    this._clearAllErrors();
    this._refreshCustomHolidays();

    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BusinessDayCalculator.init());
} else {
  BusinessDayCalculator.init();
}

export default BusinessDayCalculator;
