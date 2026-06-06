/**
 * Duration Calculator - Calculate the exact duration between two dates.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
import { formatDate, validateDate } from '../core/date-parser.js';
import { calculateDuration, getDayOfWeekName } from '../core/date-calc.js';
import DateInputComponent from '../ui/date-input.js';

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
   * Render the calculator form with start/end date inputs using DateInputComponent,
   * include-end-date toggle, and calculate button.
   */
  _renderForm() {
    this._calculatorCard.innerHTML = `
      <form id="duration-form" class="duration-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'start-date', label: 'Start Date' })}
          </div>

          <div class="form-group form-group--half">
            ${DateInputComponent.render({ id: 'end-date', label: 'End Date' })}
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
   * Bind DOM event handlers for form submission and clear.
   */
  _bindEvents() {
    // Initialize DateInputComponent listeners
    DateInputComponent.initListeners(this._calculatorCard);

    const form = document.getElementById('duration-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculate();
      });
    }

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
    DateInputComponent.clearError('start-date');
    DateInputComponent.clearError('end-date');

    const includeEndCheckbox = document.getElementById('include-end-date');
    const includeEndDate = includeEndCheckbox ? includeEndCheckbox.checked : false;

    // Get date values from DateInputComponent
    const startDate = DateInputComponent.getValue('start-date');
    const endDate = DateInputComponent.getValue('end-date');

    // Validate start date
    if (!startDate) {
      DateInputComponent.showError('start-date', 'Start date is required. Please fill in all fields.');
      return;
    }
    const startValidation = validateDate(startDate.year, startDate.month, startDate.day);
    if (!startValidation.valid) {
      DateInputComponent.showError('start-date', startValidation.error);
      return;
    }

    // Validate end date
    if (!endDate) {
      DateInputComponent.showError('end-date', 'End date is required. Please fill in all fields.');
      return;
    }
    const endValidation = validateDate(endDate.year, endDate.month, endDate.day);
    if (!endValidation.valid) {
      DateInputComponent.showError('end-date', endValidation.error);
      return;
    }

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
   * Reset the form to its initial state.
   */
  _clearForm() {
    // Clear all input fields
    ['start-date-day', 'start-date-month', 'start-date-year',
     'end-date-day', 'end-date-month', 'end-date-year'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const includeEndCheckbox = document.getElementById('include-end-date');
    if (includeEndCheckbox) includeEndCheckbox.checked = false;

    DateInputComponent.clearError('start-date');
    DateInputComponent.clearError('end-date');

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
