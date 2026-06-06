/**
 * Day of Week Calculator - Find what day of the week any date falls on.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
import { parseDate, formatDate } from '../core/date-parser.js';
import { getDayOfWeek, getDayOfWeekName, getDayOfYear, getDaysRemainingInYear, getDaysInYear } from '../core/date-calc.js';
import { validateDateInput } from '../core/validators.js';

/**
 * Fun facts about days of the week
 */
const DAY_FACTS = {
  Sunday: 'Sunday is named after the Sun (Sol) in many cultures.',
  Monday: 'Monday is named after the Moon (Luna/Mani).',
  Tuesday: 'Tuesday is named after Tiw/Tyr, the Norse god of war.',
  Wednesday: 'Wednesday is named after Odin/Woden, the Norse god of wisdom.',
  Thursday: 'Thursday is named after Thor, the Norse god of thunder.',
  Friday: 'Friday is named after Frigg/Freya, the Norse goddess of love.',
  Saturday: 'Saturday is named after Saturn, the Roman god of agriculture.'
};

/**
 * Format mapping from user-facing labels to parser hints and output formats
 */
const FORMAT_MAP = {
  'MM/DD/YYYY': { parserHint: 'MDY', outputFormat: 'MM/DD/YYYY' },
  'DD/MM/YYYY': { parserHint: 'DMY', outputFormat: 'DD/MM/YYYY' },
  'YYYY-MM-DD': { parserHint: 'MDY', outputFormat: 'YYYY-MM-DD' }
};

const DayOfWeekCalculator = {
  _form: null,
  _resultCard: null,
  _dateInput: null,
  _formatSelect: null,
  _errorEl: null,

  init() {
    // 1. Get DOM references
    const calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!calculatorCard) return;

    // 2. Render the calculator form
    calculatorCard.innerHTML = this._renderForm();

    // 3. Get inner references after rendering
    this._form = document.getElementById('dow-form');
    this._dateInput = document.getElementById('dow-date-input');
    this._formatSelect = document.getElementById('dow-format-select');
    this._errorEl = document.getElementById('dow-error');

    // 4. Set up event handlers
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });

    // Real-time validation on input
    this._dateInput.addEventListener('input', () => {
      this._clearError();
    });

    // Today button
    const todayBtn = document.getElementById('dow-today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this._setToday();
      });
    }

    // 5. Set today's date as default value
    this._setToday();
  },

  _renderForm() {
    return `
      <form id="dow-form" class="dow-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="dow-date-input">Enter a date</label>
          <div class="form-row">
            <input
              type="text"
              id="dow-date-input"
              class="input-field glass-input"
              placeholder="e.g. 06/14/2024"
              autocomplete="off"
              aria-describedby="dow-error"
            />
          </div>
          <span id="dow-error" class="error-message" role="alert" aria-live="polite" hidden></span>
        </div>

        <div class="form-group">
          <label class="form-label" for="dow-format-select">Date format</label>
          <select id="dow-format-select" class="input-field glass-input dow-select">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" id="dow-today-btn" class="btn btn--secondary dow-today-btn">
            <span class="btn-icon">&#x1F4C5;</span> Today
          </button>
          <button type="submit" class="btn btn--primary dow-calculate-btn">
            Calculate Day
          </button>
        </div>
      </form>
    `;
  },

  _renderResult(date, dayName, dayOfYear, daysRemaining, daysInYear) {
    const formattedDate = formatDate(date, this._getSelectedOutputFormat());
    const fact = DAY_FACTS[dayName] || '';
    const yearProgress = ((dayOfYear / daysInYear) * 100).toFixed(1);

    return `
      <div class="result-header animate-slide-up">
        <span class="result-label">Day of the Week</span>
        <h2 class="result-value result-day-name">${dayName}</h2>
      </div>
      <div class="result-details animate-slide-up stagger-1">
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4C6;</span>
          <span class="result-detail-text">${formattedDate}</span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4CA;</span>
          <span class="result-detail-text">Day <strong>${dayOfYear}</strong> of ${daysInYear}</span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x23F3;</span>
          <span class="result-detail-text"><strong>${daysRemaining}</strong> days remaining in ${date.year}</span>
        </div>
        <div class="result-progress animate-slide-up stagger-2">
          <div class="result-progress-label">Year progress: ${yearProgress}%</div>
          <div class="result-progress-bar">
            <div class="result-progress-fill" style="width: ${yearProgress}%"></div>
          </div>
        </div>
      </div>
      <div class="result-fact animate-slide-up stagger-3">
        <span class="result-fact-icon">&#x2728;</span>
        <span class="result-fact-text">${fact}</span>
      </div>
    `;
  },

  calculate() {
    // 1. Get input value
    const inputValue = this._dateInput.value;

    // 2. Get selected format
    const selectedFormat = this._formatSelect.value;
    const formatConfig = FORMAT_MAP[selectedFormat];

    // 3. Validate using validateDateInput
    const validation = validateDateInput(inputValue, 'Date', formatConfig.parserHint);

    // 4. If invalid, show error message
    if (!validation.valid) {
      this._showError(validation.error);
      this._hideResult();
      return;
    }

    // 5. If valid, compute results
    const { year, month, day } = validation.date;
    const dayName = getDayOfWeekName(year, month, day);
    const dayOfYear = getDayOfYear(year, month, day);
    const daysRemaining = getDaysRemainingInYear(year, month, day);
    const daysInYear = getDaysInYear(year);

    // 6. Render result card
    this._clearError();
    this._resultCard.innerHTML = this._renderResult(
      validation.date,
      dayName,
      dayOfYear,
      daysRemaining,
      daysInYear
    );
    this._showResult();
  },

  _showError(message) {
    this._errorEl.textContent = message;
    this._errorEl.hidden = false;
    this._dateInput.classList.add('input-field--error');
    this._dateInput.classList.add('animate-shake');
    // Remove shake animation class after it completes
    setTimeout(() => {
      this._dateInput.classList.remove('animate-shake');
    }, 500);
  },

  _clearError() {
    this._errorEl.textContent = '';
    this._errorEl.hidden = true;
    this._dateInput.classList.remove('input-field--error');
  },

  _showResult() {
    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-slide-up');
    this._resultCard.classList.add('glass-card');
  },

  _hideResult() {
    this._resultCard.hidden = true;
    this._resultCard.classList.remove('animate-slide-up');
  },

  _setToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const selectedFormat = this._formatSelect.value;
    const dateObj = { year, month, day };
    const formatted = formatDate(dateObj, selectedFormat);

    this._dateInput.value = formatted;
    this._clearError();
  },

  _getSelectedOutputFormat() {
    return this._formatSelect ? this._formatSelect.value : 'MM/DD/YYYY';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DayOfWeekCalculator.init());
} else {
  DayOfWeekCalculator.init();
}

export default DayOfWeekCalculator;
