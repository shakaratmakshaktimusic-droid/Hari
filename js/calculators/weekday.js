/**
 * Weekday Calculator - Count weekdays between dates or find the Nth weekday in a month.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Two modes:
 * 1. Count Mode - Count occurrences of specific weekdays within a date range
 * 2. Nth Weekday Mode - Find the Nth occurrence of a weekday in a given month
 */
import { parseDate, formatDate, getDaysInMonth, validateDate } from '../core/date-parser.js';
import { countWeekdays, findNthWeekday, getDayOfWeekName, getDayOfWeek, dateToSerial, serialToDate } from '../core/date-calc.js';
import { validateDateInput, validateNumericInput } from '../core/validators.js';
import DateInputComponent from '../ui/date-input.js';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeekdayCalculator = {
  _mode: 'count', // 'count' or 'nth'

  /**
   * Initialize the Weekday Calculator UI.
   * Renders the tabbed interface and sets up event handlers.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!this._calculatorCard) return;

    this._renderTabs();
    this._renderCountForm();
    this._bindTabEvents();
  },

  /**
   * Render the mode-switching tab interface.
   */
  _renderTabs() {
    const tabsHtml = `
      <div class="tabs" role="tablist" aria-label="Calculator mode">
        <button class="tab tab--active" role="tab" aria-selected="true" aria-controls="tab-panel-count" id="tab-count" data-mode="count">
          Count Weekdays
        </button>
        <button class="tab" role="tab" aria-selected="false" aria-controls="tab-panel-nth" id="tab-nth" data-mode="nth">
          Find Nth Weekday
        </button>
      </div>
      <div class="tab-panel" id="tab-panel-content">
        <!-- Form content rendered dynamically -->
      </div>
    `;
    this._calculatorCard.innerHTML = tabsHtml;
    this._tabPanel = document.getElementById('tab-panel-content');
  },

  /**
   * Bind click events on the tab buttons for mode switching.
   */
  _bindTabEvents() {
    const tabs = this._calculatorCard.querySelectorAll('.tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-mode');
        if (mode === this._mode) return;

        // Update active tab
        tabs.forEach((t) => {
          t.classList.remove('tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('tab--active');
        tab.setAttribute('aria-selected', 'true');

        // Switch mode
        this._mode = mode;
        if (mode === 'count') {
          this._renderCountForm();
        } else {
          this._renderNthForm();
        }

        // Hide result
        if (this._resultCard) {
          this._resultCard.hidden = true;
          this._resultCard.innerHTML = '';
        }
      });
    });
  },

  /**
   * Render the Count Mode form:
   * Start date, End date, Weekday checkboxes, Calculate button.
   */
  _renderCountForm() {
    if (!this._tabPanel) return;

    this._tabPanel.innerHTML = `
      <form id="weekday-count-form" class="weekday-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'count-start-date', label: 'Start Date' })}
          </div>
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'count-end-date', label: 'End Date' })}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Weekdays</label>
          <div class="weekday-checkboxes" role="group" aria-label="Select weekdays to count">
            ${WEEKDAY_NAMES.map((name, idx) => `
              <label class="weekday-checkbox">
                <input type="checkbox" name="weekday" value="${idx}" class="weekday-checkbox__input" />
                <span class="weekday-checkbox__label">${WEEKDAY_SHORT[idx]}</span>
              </label>
            `).join('')}
          </div>
          <span id="weekday-selection-error" class="error-message" role="alert" hidden></span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Count Weekdays
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="count-clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;

    this._bindCountEvents();
  },

  /**
   * Render the Nth Weekday Mode form:
   * Month/Year selectors, Weekday dropdown, N selector, Find button.
   */
  _renderNthForm() {
    if (!this._tabPanel) return;

    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    this._tabPanel.innerHTML = `
      <form id="weekday-nth-form" class="weekday-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--third">
            <label class="form-label" for="nth-month">Month</label>
            <select id="nth-month" class="input-field glass-input select-field">
              ${months.map((name, idx) => `
                <option value="${idx + 1}" ${idx === new Date().getMonth() ? 'selected' : ''}>${name}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group form-group--third">
            <label class="form-label" for="nth-year">Year</label>
            <input
              type="number"
              id="nth-year"
              class="input-field glass-input"
              value="${currentYear}"
              min="1"
              max="9999"
              aria-describedby="nth-year-error"
            />
            <span id="nth-year-error" class="error-message" role="alert" hidden></span>
          </div>

          <div class="form-group form-group--third">
            <label class="form-label" for="nth-n">Occurrence</label>
            <select id="nth-n" class="input-field glass-input select-field">
              <option value="1">1st</option>
              <option value="2">2nd</option>
              <option value="3">3rd</option>
              <option value="4">4th</option>
              <option value="5">5th</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="nth-weekday">Weekday</label>
          <select id="nth-weekday" class="input-field glass-input select-field">
            ${WEEKDAY_NAMES.map((name, idx) => `
              <option value="${idx}">${name}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Find Date
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="nth-clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;

    this._bindNthEvents();
  },

  /**
   * Bind event handlers for the Count Mode form.
   */
  _bindCountEvents() {
    const form = document.getElementById('weekday-count-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculateCount();
      });
    }

    // Initialize DateInputComponent listeners (calendar picker, today buttons, auto-tab)
    DateInputComponent.initListeners(this._tabPanel);

    // Clear button
    const clearBtn = document.getElementById('count-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._clearCountForm();
      });
    }
  },

  /**
   * Bind event handlers for the Nth Weekday Mode form.
   */
  _bindNthEvents() {
    const form = document.getElementById('weekday-nth-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculateNth();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('nth-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._clearNthForm();
      });
    }
  },

  /**
   * Perform the Count Weekdays calculation.
   * Validates inputs, counts selected weekdays in the date range, and renders results.
   */
  calculateCount() {
    this._clearAllCountErrors();

    // Get date values from DateInputComponent
    const startDateValue = DateInputComponent.getValue('count-start-date');
    const endDateValue = DateInputComponent.getValue('count-end-date');

    // Validate start date
    if (!startDateValue) {
      DateInputComponent.showError('count-start-date', 'Start date is required');
      return;
    }
    const startValidation = validateDate(startDateValue.year, startDateValue.month, startDateValue.day);
    if (!startValidation.valid) {
      DateInputComponent.showError('count-start-date', startValidation.error);
      return;
    }

    // Validate end date
    if (!endDateValue) {
      DateInputComponent.showError('count-end-date', 'End date is required');
      return;
    }
    const endValidation = validateDate(endDateValue.year, endDateValue.month, endDateValue.day);
    if (!endValidation.valid) {
      DateInputComponent.showError('count-end-date', endValidation.error);
      return;
    }

    // Get selected weekdays
    const checkboxes = this._tabPanel.querySelectorAll('input[name="weekday"]:checked');
    const selectedWeekdays = Array.from(checkboxes).map((cb) => parseInt(cb.value, 10));

    if (selectedWeekdays.length === 0) {
      this._showFieldError('weekday-selection', 'Please select at least one weekday');
      return;
    }

    const startDate = startDateValue;
    const endDate = endDateValue;

    // Calculate weekday counts
    const results = countWeekdays(startDate, endDate, selectedWeekdays);

    // Render results
    this._renderCountResult(results, startDate, endDate, selectedWeekdays);
  },

  /**
   * Perform the Nth Weekday calculation.
   * Validates inputs and finds the Nth weekday in the given month/year.
   */
  calculateNth() {
    this._clearFieldError('nth-year');

    const monthSelect = document.getElementById('nth-month');
    const yearInput = document.getElementById('nth-year');
    const nSelect = document.getElementById('nth-n');
    const weekdaySelect = document.getElementById('nth-weekday');

    const month = parseInt(monthSelect.value, 10);
    const yearValue = yearInput ? yearInput.value : '';
    const n = parseInt(nSelect.value, 10);
    const weekday = parseInt(weekdaySelect.value, 10);

    // Validate year
    const yearValidation = validateNumericInput(yearValue, {
      min: 1,
      max: 9999,
      integer: true,
      fieldName: 'Year'
    });
    if (!yearValidation.valid) {
      this._showFieldError('nth-year', yearValidation.error);
      return;
    }

    const year = yearValidation.value;

    // Find the Nth weekday
    const result = findNthWeekday(year, month, weekday, n);

    // Render result
    this._renderNthResult(result, year, month, weekday, n);
  },

  /**
   * Render results for the Count Mode.
   * Shows count per weekday numerically plus a mini calendar grid.
   * @param {Map<number, number>} results - Map of weekday number to count
   * @param {{year: number, month: number, day: number}} startDate
   * @param {{year: number, month: number, day: number}} endDate
   * @param {number[]} selectedWeekdays
   */
  _renderCountResult(results, startDate, endDate, selectedWeekdays) {
    if (!this._resultCard) return;

    // Build numerical result rows
    let totalCount = 0;
    const rows = selectedWeekdays.map((wd) => {
      const count = results.get(wd) || 0;
      totalCount += count;
      return `
        <div class="weekday-result-row animate-slide-up">
          <span class="weekday-result-name">${WEEKDAY_NAMES[wd]}</span>
          <span class="weekday-result-count">${count}</span>
        </div>
      `;
    }).join('');

    // Build mini calendar grid for the date range
    const calendarHtml = this._buildMiniCalendar(startDate, endDate, selectedWeekdays);

    const startDisplay = formatDate(startDate, 'MM/DD/YYYY');
    const endDisplay = formatDate(endDate, 'MM/DD/YYYY');

    this._resultCard.innerHTML = `
      <div class="result-header animate-fade-in">
        <div class="result-total">
          <span class="result-value">${totalCount}</span>
          <span class="result-label">Total Occurrences</span>
        </div>
      </div>

      <div class="result-breakdown animate-slide-up stagger-1">
        <h3 class="result-section-title">Count by Weekday</h3>
        <div class="weekday-results">
          ${rows}
        </div>
      </div>

      <div class="result-calendar animate-slide-up stagger-2">
        <h3 class="result-section-title">Calendar View</h3>
        <div class="mini-calendar-container">
          ${calendarHtml}
        </div>
      </div>

      <div class="result-details animate-slide-up stagger-3">
        <h3 class="result-section-title">Range Details</h3>
        <div class="result-date-info">
          <div class="result-date-row">
            <span class="result-date-label">From:</span>
            <span class="result-date-value">${startDisplay} (${getDayOfWeekName(startDate.year, startDate.month, startDate.day)})</span>
          </div>
          <div class="result-date-row">
            <span class="result-date-label">To:</span>
            <span class="result-date-value">${endDisplay} (${getDayOfWeekName(endDate.year, endDate.month, endDate.day)})</span>
          </div>
        </div>
      </div>
    `;

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Render result for the Nth Weekday Mode.
   * Shows the found date or a "does not exist" message.
   * @param {{year: number, month: number, day: number}|null} result
   * @param {number} year
   * @param {number} month
   * @param {number} weekday
   * @param {number} n
   */
  _renderNthResult(result, year, month, weekday, n) {
    if (!this._resultCard) return;

    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const description = `${ordinals[n]} ${WEEKDAY_NAMES[weekday]} of ${months[month]} ${year}`;

    if (result === null) {
      // Does not exist
      this._resultCard.innerHTML = `
        <div class="result-header animate-fade-in">
          <div class="result-total result-total--warning">
            <span class="result-value result-value--icon">&#x26A0;</span>
            <span class="result-label">Does Not Exist</span>
          </div>
        </div>
        <div class="result-details animate-slide-up stagger-1">
          <p class="result-not-found-message">
            The <strong>${description}</strong> does not exist.
            ${months[month]} ${year} does not have a ${ordinals[n]} ${WEEKDAY_NAMES[weekday]}.
          </p>
        </div>
      `;
    } else {
      const formattedDate = formatDate(result, 'MM/DD/YYYY');
      const dayName = getDayOfWeekName(result.year, result.month, result.day);

      // Build a mini calendar for the month highlighting the result
      const calendarHtml = this._buildMonthCalendar(year, month, result.day, weekday);

      this._resultCard.innerHTML = `
        <div class="result-header animate-fade-in">
          <div class="result-total">
            <span class="result-value">${formattedDate}</span>
            <span class="result-label">${description}</span>
          </div>
        </div>

        <div class="result-details animate-slide-up stagger-1">
          <h3 class="result-section-title">Date Details</h3>
          <div class="result-date-info">
            <div class="result-date-row">
              <span class="result-date-label">Date:</span>
              <span class="result-date-value">${formattedDate} (${dayName})</span>
            </div>
            <div class="result-date-row">
              <span class="result-date-label">Occurrence:</span>
              <span class="result-date-value">${description}</span>
            </div>
          </div>
        </div>

        <div class="result-calendar animate-slide-up stagger-2">
          <h3 class="result-section-title">Month Calendar</h3>
          <div class="mini-calendar-container">
            ${calendarHtml}
          </div>
        </div>
      `;
    }

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Build a mini calendar grid for a date range, highlighting selected weekdays.
   * Shows the first month of the range for compactness.
   * @param {{year: number, month: number, day: number}} startDate
   * @param {{year: number, month: number, day: number}} endDate
   * @param {number[]} selectedWeekdays
   * @returns {string} HTML string
   */
  _buildMiniCalendar(startDate, endDate, selectedWeekdays) {
    // Show a compact calendar for the start month
    const year = startDate.year;
    const month = startDate.month;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getDayOfWeek(year, month, 1);

    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Determine which days in this month are within the range and match selected weekdays
    const startSerial = dateToSerial(startDate.year, startDate.month, startDate.day);
    const endSerial = dateToSerial(endDate.year, endDate.month, endDate.day);
    const effectiveStart = Math.min(startSerial, endSerial);
    const effectiveEnd = Math.max(startSerial, endSerial);

    let cells = '';
    // Header row
    cells += '<div class="mini-cal-header">';
    WEEKDAY_SHORT.forEach((name) => {
      cells += `<span class="mini-cal-day-name">${name}</span>`;
    });
    cells += '</div>';

    // Calendar grid
    cells += '<div class="mini-cal-grid">';
    // Empty cells before first day
    for (let i = 0; i < firstDow; i++) {
      cells += '<span class="mini-cal-cell mini-cal-cell--empty"></span>';
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = getDayOfWeek(year, month, d);
      const serial = dateToSerial(year, month, d);
      const inRange = serial >= effectiveStart && serial <= effectiveEnd;
      const isHighlighted = inRange && selectedWeekdays.includes(dow);
      const classes = ['mini-cal-cell'];
      if (isHighlighted) classes.push('mini-cal-cell--highlighted');
      if (inRange) classes.push('mini-cal-cell--in-range');
      cells += `<span class="${classes.join(' ')}">${d}</span>`;
    }
    cells += '</div>';

    return `
      <div class="mini-calendar">
        <div class="mini-cal-title">${months[month]} ${year}</div>
        ${cells}
      </div>
    `;
  },

  /**
   * Build a month calendar with a specific day highlighted.
   * @param {number} year
   * @param {number} month
   * @param {number} highlightDay
   * @param {number} highlightWeekday
   * @returns {string} HTML string
   */
  _buildMonthCalendar(year, month, highlightDay, highlightWeekday) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getDayOfWeek(year, month, 1);

    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let cells = '';
    // Header row
    cells += '<div class="mini-cal-header">';
    WEEKDAY_SHORT.forEach((name) => {
      cells += `<span class="mini-cal-day-name">${name}</span>`;
    });
    cells += '</div>';

    // Calendar grid
    cells += '<div class="mini-cal-grid">';
    // Empty cells before first day
    for (let i = 0; i < firstDow; i++) {
      cells += '<span class="mini-cal-cell mini-cal-cell--empty"></span>';
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = getDayOfWeek(year, month, d);
      const classes = ['mini-cal-cell'];
      if (d === highlightDay) {
        classes.push('mini-cal-cell--highlighted');
        classes.push('mini-cal-cell--target');
      } else if (dow === highlightWeekday) {
        classes.push('mini-cal-cell--same-weekday');
      }
      cells += `<span class="${classes.join(' ')}">${d}</span>`;
    }
    cells += '</div>';

    return `
      <div class="mini-calendar">
        <div class="mini-cal-title">${months[month]} ${year}</div>
        ${cells}
      </div>
    `;
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
   * Clear all count form errors.
   */
  _clearAllCountErrors() {
    DateInputComponent.clearError('count-start-date');
    DateInputComponent.clearError('count-end-date');
    this._clearFieldError('weekday-selection');
  },

  /**
   * Reset the count form to its initial state.
   */
  _clearCountForm() {
    const startInput = document.getElementById('count-start-date');
    const endInput = document.getElementById('count-end-date');
    const checkboxes = this._tabPanel.querySelectorAll('input[name="weekday"]');

    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    checkboxes.forEach((cb) => { cb.checked = false; });

    this._clearAllCountErrors();

    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in');
    }
  },

  /**
   * Reset the Nth form to its initial state.
   */
  _clearNthForm() {
    const yearInput = document.getElementById('nth-year');
    const monthSelect = document.getElementById('nth-month');
    const nSelect = document.getElementById('nth-n');
    const weekdaySelect = document.getElementById('nth-weekday');

    const now = new Date();
    if (yearInput) yearInput.value = now.getFullYear();
    if (monthSelect) monthSelect.value = String(now.getMonth() + 1);
    if (nSelect) nSelect.value = '1';
    if (weekdaySelect) weekdaySelect.value = '0';

    this._clearFieldError('nth-year');

    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WeekdayCalculator.init());
} else {
  WeekdayCalculator.init();
}

export default WeekdayCalculator;
