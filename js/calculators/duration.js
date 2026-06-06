/**
 * Duration Calculator - Calculate the exact duration between two dates.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
import { parseDate, formatDate } from '../core/date-parser.js';
import { calculateDuration, getDayOfWeekName } from '../core/date-calc.js';
import { validateDateInput } from '../core/validators.js';

const DurationCalculator = {
  /**
   * Initialize the Duration Calculator UI.
   * Renders the form into #calculator-card and sets up event handlers.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!this._calculatorCard) return;

    this._renderForm();
    this._bindEvents();
  },

  /**
   * Render the calculator form with start/end date inputs,
   * include-end-date toggle, and calculate button.
   */
  _renderForm() {
    this._calculatorCard.innerHTML = `
      <form id="duration-form" class="duration-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label" for="start-date">Start Date</label>
            <div class="input-wrapper">
              <input
                type="text"
                id="start-date"
                class="input-field glass-input"
                placeholder="MM/DD/YYYY or YYYY-MM-DD"
                autocomplete="off"
                aria-describedby="start-date-error"
              />
              <button type="button" class="btn btn--ghost btn--today" data-target="start-date" aria-label="Set start date to today">
                Today
              </button>
            </div>
            <span id="start-date-error" class="error-message" role="alert" hidden></span>
          </div>

          <div class="form-group form-group--half">
            <label class="form-label" for="end-date">End Date</label>
            <div class="input-wrapper">
              <input
                type="text"
                id="end-date"
                class="input-field glass-input"
                placeholder="MM/DD/YYYY or YYYY-MM-DD"
                autocomplete="off"
                aria-describedby="end-date-error"
              />
              <button type="button" class="btn btn--ghost btn--today" data-target="end-date" aria-label="Set end date to today">
                Today
              </button>
            </div>
            <span id="end-date-error" class="error-message" role="alert" hidden></span>
          </div>
        </div>

        <div class="form-group form-group--toggle">
          <label class="toggle-label" for="include-end-date">
            <span class="toggle-switch">
              <input type="checkbox" id="include-end-date" class="toggle-input" />
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </span>
            <span class="toggle-text">Include end date in count (+1 day)</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Calculate Duration
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Bind DOM event handlers for form submission, today buttons, and clear.
   */
  _bindEvents() {
    const form = document.getElementById('duration-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculate();
      });
    }

    // Today buttons
    const todayButtons = this._calculatorCard.querySelectorAll('.btn--today');
    todayButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          input.value = `${year}-${month}-${day}`;
          this._clearFieldError(targetId);
        }
      });
    });

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._clearForm();
      });
    }
  },

  /**
   * Perform the duration calculation.
   * Validates inputs, parses dates, computes duration, and renders the result.
   */
  calculate() {
    // Clear previous errors
    this._clearAllErrors();

    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const includeEndCheckbox = document.getElementById('include-end-date');

    const startValue = startInput ? startInput.value : '';
    const endValue = endInput ? endInput.value : '';
    const includeEndDate = includeEndCheckbox ? includeEndCheckbox.checked : false;

    // Validate start date
    const startValidation = validateDateInput(startValue, 'Start date');
    if (!startValidation.valid) {
      this._showFieldError('start-date', startValidation.error);
      return;
    }

    // Validate end date
    const endValidation = validateDateInput(endValue, 'End date');
    if (!endValidation.valid) {
      this._showFieldError('end-date', endValidation.error);
      return;
    }

    const startDate = startValidation.date;
    const endDate = endValidation.date;

    // Calculate duration
    const result = calculateDuration(startDate, endDate, includeEndDate);

    // Get day-of-week names for both dates
    const startDayName = getDayOfWeekName(startDate.year, startDate.month, startDate.day);
    const endDayName = getDayOfWeekName(endDate.year, endDate.month, endDate.day);

    // Render result
    this._renderResult(result, startDate, endDate, startDayName, endDayName, includeEndDate);
  },

  /**
   * Render the calculation result with full breakdown and animation.
   * @param {Object} result - The duration result from calculateDuration
   * @param {Object} startDate - Parsed start date
   * @param {Object} endDate - Parsed end date
   * @param {string} startDayName - Day-of-week name for start date
   * @param {string} endDayName - Day-of-week name for end date
   * @param {boolean} includeEndDate - Whether end date was included
   */
  _renderResult(result, startDate, endDate, startDayName, endDayName, includeEndDate) {
    if (!this._resultCard) return;

    const { totalDays, totalHours, totalMinutes, totalSeconds, breakdown, reversed } = result;

    // Build combined breakdown string
    const breakdownParts = [];
    if (breakdown.years > 0) breakdownParts.push(`${breakdown.years} year${breakdown.years !== 1 ? 's' : ''}`);
    if (breakdown.months > 0) breakdownParts.push(`${breakdown.months} month${breakdown.months !== 1 ? 's' : ''}`);
    if (breakdown.weeks > 0) breakdownParts.push(`${breakdown.weeks} week${breakdown.weeks !== 1 ? 's' : ''}`);
    if (breakdown.days > 0) breakdownParts.push(`${breakdown.days} day${breakdown.days !== 1 ? 's' : ''}`);
    const breakdownStr = breakdownParts.length > 0 ? breakdownParts.join(', ') : '0 days';

    // Format display dates
    const startDisplay = formatDate(startDate, 'MM/DD/YYYY');
    const endDisplay = formatDate(endDate, 'MM/DD/YYYY');

    this._resultCard.innerHTML = `
      <div class="result-header animate-fade-in">
        <div class="result-total">
          <span class="result-value">${totalDays.toLocaleString()}</span>
          <span class="result-label">Total Days</span>
        </div>
      </div>

      <div class="result-breakdown animate-slide-up stagger-1">
        <h3 class="result-section-title">Duration Breakdown</h3>
        <p class="result-combined">${breakdownStr}</p>
        <div class="result-units">
          <div class="result-unit">
            <span class="result-unit-value">${breakdown.years}</span>
            <span class="result-unit-label">Years</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${breakdown.months}</span>
            <span class="result-unit-label">Months</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${breakdown.weeks}</span>
            <span class="result-unit-label">Weeks</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${breakdown.days}</span>
            <span class="result-unit-label">Days</span>
          </div>
        </div>
      </div>

      <div class="result-time-equivalents animate-slide-up stagger-2">
        <h3 class="result-section-title">Time Equivalents</h3>
        <div class="result-units">
          <div class="result-unit">
            <span class="result-unit-value">${totalHours.toLocaleString()}</span>
            <span class="result-unit-label">Hours</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${totalMinutes.toLocaleString()}</span>
            <span class="result-unit-label">Minutes</span>
          </div>
          <div class="result-unit">
            <span class="result-unit-value">${totalSeconds.toLocaleString()}</span>
            <span class="result-unit-label">Seconds</span>
          </div>
        </div>
      </div>

      <div class="result-details animate-slide-up stagger-3">
        <h3 class="result-section-title">Date Details</h3>
        <div class="result-date-info">
          <div class="result-date-row">
            <span class="result-date-label">Start:</span>
            <span class="result-date-value">${startDisplay} (${startDayName})</span>
          </div>
          <div class="result-date-row">
            <span class="result-date-label">End:</span>
            <span class="result-date-value">${endDisplay} (${endDayName})</span>
          </div>
          ${includeEndDate ? '<div class="result-note"><span class="badge badge--success">End date included</span></div>' : ''}
          ${reversed ? '<div class="result-note result-note--warning"><span class="badge badge--warning">Dates were reversed (showing absolute duration)</span></div>' : ''}
        </div>
      </div>
    `;

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Show a validation error for a specific field.
   * @param {string} fieldId - The input field ID
   * @param {string} message - The error message to display
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
    this._clearFieldError('start-date');
    this._clearFieldError('end-date');
  },

  /**
   * Reset the form to its initial state.
   */
  _clearForm() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const includeEndCheckbox = document.getElementById('include-end-date');

    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    if (includeEndCheckbox) includeEndCheckbox.checked = false;

    this._clearAllErrors();

    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DurationCalculator.init());
} else {
  DurationCalculator.init();
}

export default DurationCalculator;
