/**
 * Week Number Calculator - Find the ISO week number for any date
 * and view full-year week calendars.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
import { parseDate, formatDate } from '../core/date-parser.js';
import { getISOWeekNumber, getISOWeekDates, getDayOfWeekName } from '../core/date-calc.js';
import { validateDateInput } from '../core/validators.js';

/**
 * Format mapping from user-facing labels to parser hints
 */
const FORMAT_MAP = {
  'MM/DD/YYYY': { parserHint: 'MDY', outputFormat: 'MM/DD/YYYY' },
  'DD/MM/YYYY': { parserHint: 'DMY', outputFormat: 'DD/MM/YYYY' },
  'YYYY-MM-DD': { parserHint: 'MDY', outputFormat: 'YYYY-MM-DD' }
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WeekNumberCalculator = {
  _form: null,
  _resultCard: null,
  _dateInput: null,
  _formatSelect: null,
  _errorEl: null,
  _calendarContainer: null,
  _selectedWeek: null,
  _selectedYear: null,
  _currentIsoWeek: null,
  _currentIsoYear: null,

  init() {
    const calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!calculatorCard) return;

    // Calculate current week for highlighting
    const today = new Date();
    const currentResult = getISOWeekNumber(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this._currentIsoWeek = currentResult.isoWeek;
    this._currentIsoYear = currentResult.isoYear;

    // Render the calculator form
    calculatorCard.innerHTML = this._renderForm();

    // Get DOM references
    this._form = document.getElementById('wn-form');
    this._dateInput = document.getElementById('wn-date-input');
    this._formatSelect = document.getElementById('wn-format-select');
    this._errorEl = document.getElementById('wn-error');
    this._calendarContainer = document.getElementById('wn-calendar-container');

    // Set up event handlers
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });

    this._dateInput.addEventListener('input', () => {
      this._clearError();
    });

    const todayBtn = document.getElementById('wn-today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this._setToday();
        this.calculate();
      });
    }

    // Set today's date as default and calculate
    this._setToday();
    this.calculate();
  },

  _renderForm() {
    return `
      <form id="wn-form" class="wn-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="wn-date-input">Enter a date</label>
          <div class="form-row">
            <input
              type="text"
              id="wn-date-input"
              class="input-field glass-input"
              placeholder="e.g. 06/14/2024"
              autocomplete="off"
              aria-describedby="wn-error"
            />
          </div>
          <span id="wn-error" class="error-message" role="alert" aria-live="polite" hidden></span>
        </div>

        <div class="form-group">
          <label class="form-label" for="wn-format-select">Date format</label>
          <select id="wn-format-select" class="input-field glass-input wn-select">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" id="wn-today-btn" class="btn btn--secondary wn-today-btn">
            <span class="btn-icon">&#x1F4C5;</span> Today
          </button>
          <button type="submit" class="btn btn--primary wn-calculate-btn">
            Find Week Number
          </button>
        </div>
      </form>

      <div id="wn-calendar-container" class="wn-calendar-container"></div>
    `;
  },

  _renderResult(date, isoWeek, isoYear, weekDates) {
    const formattedDate = formatDate(date, this._getSelectedOutputFormat());
    const startFormatted = this._formatShortDate(weekDates.start);
    const endFormatted = this._formatShortDate(weekDates.end);
    const dayName = getDayOfWeekName(date.year, date.month, date.day);

    return `
      <div class="result-header animate-slide-up">
        <span class="result-label">ISO Week Number</span>
        <h2 class="result-value wn-week-number">Week ${isoWeek}</h2>
      </div>
      <div class="result-details animate-slide-up stagger-1">
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4C6;</span>
          <span class="result-detail-text">${formattedDate} (${dayName})</span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4CB;</span>
          <span class="result-detail-text">ISO Year: <strong>${isoYear}</strong></span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4C5;</span>
          <span class="result-detail-text">Week range: <strong>${startFormatted}</strong> &mdash; <strong>${endFormatted}</strong></span>
        </div>
        ${isoYear !== date.year ? `
        <div class="result-detail-row wn-note">
          <span class="result-detail-icon">&#x26A0;&#xFE0F;</span>
          <span class="result-detail-text">Note: ISO year differs from calendar year at this boundary</span>
        </div>
        ` : ''}
      </div>
    `;
  },

  _renderWeekCalendar(isoYear, selectedWeek) {
    // Determine total weeks in this ISO year
    const totalWeeks = this._getISOWeeksInYear(isoYear);

    let html = `
      <div class="wn-calendar animate-slide-up stagger-2">
        <div class="wn-calendar-header">
          <button type="button" class="btn btn--icon wn-year-nav" data-direction="prev" aria-label="Previous year">&#x25C0;</button>
          <h3 class="wn-calendar-title">ISO Year ${isoYear} &middot; ${totalWeeks} Weeks</h3>
          <button type="button" class="btn btn--icon wn-year-nav" data-direction="next" aria-label="Next year">&#x25B6;</button>
        </div>
        <div class="wn-week-grid">
    `;

    for (let w = 1; w <= totalWeeks; w++) {
      const isCurrent = (w === this._currentIsoWeek && isoYear === this._currentIsoYear);
      const isSelected = (w === selectedWeek);
      const weekDates = getISOWeekDates(isoYear, w);
      const startShort = this._formatTinyDate(weekDates.start);
      const endShort = this._formatTinyDate(weekDates.end);

      let classes = 'wn-week-cell';
      if (isCurrent) classes += ' wn-week-cell--current';
      if (isSelected) classes += ' wn-week-cell--selected';

      html += `
        <button type="button" class="${classes}" data-week="${w}" data-year="${isoYear}"
                title="Week ${w}: ${startShort} - ${endShort}"
                aria-label="Week ${w}, ${startShort} to ${endShort}">
          <span class="wn-week-cell-number">${w}</span>
        </button>
      `;
    }

    html += `
        </div>
    `;

    // Show selected week detail
    if (selectedWeek) {
      const weekDates = getISOWeekDates(isoYear, selectedWeek);
      const startFmt = this._formatShortDate(weekDates.start);
      const endFmt = this._formatShortDate(weekDates.end);
      const startDay = getDayOfWeekName(weekDates.start.year, weekDates.start.month, weekDates.start.day);
      const endDay = getDayOfWeekName(weekDates.end.year, weekDates.end.month, weekDates.end.day);

      html += `
        <div class="wn-selected-detail animate-slide-up">
          <div class="wn-selected-detail-header">
            <span class="wn-selected-detail-week">Week ${selectedWeek}</span>
            <span class="wn-selected-detail-year">ISO ${isoYear}</span>
          </div>
          <div class="wn-selected-detail-range">
            <div class="wn-selected-detail-date">
              <span class="wn-date-label">Start (${startDay})</span>
              <span class="wn-date-value">${startFmt}</span>
            </div>
            <span class="wn-range-arrow">&#x27A1;&#xFE0F;</span>
            <div class="wn-selected-detail-date">
              <span class="wn-date-label">End (${endDay})</span>
              <span class="wn-date-value">${endFmt}</span>
            </div>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  },

  calculate() {
    const inputValue = this._dateInput.value;
    const selectedFormat = this._formatSelect.value;
    const formatConfig = FORMAT_MAP[selectedFormat];

    const validation = validateDateInput(inputValue, 'Date', formatConfig.parserHint);

    if (!validation.valid) {
      this._showError(validation.error);
      this._hideResult();
      this._calendarContainer.innerHTML = '';
      return;
    }

    const { year, month, day } = validation.date;
    const { isoWeek, isoYear } = getISOWeekNumber(year, month, day);
    const weekDates = getISOWeekDates(isoYear, isoWeek);

    this._selectedWeek = isoWeek;
    this._selectedYear = isoYear;

    // Render result card
    this._clearError();
    this._resultCard.innerHTML = this._renderResult(validation.date, isoWeek, isoYear, weekDates);
    this._showResult();

    // Render full-year calendar
    this._calendarContainer.innerHTML = this._renderWeekCalendar(isoYear, isoWeek);
    this._attachCalendarListeners();
  },

  _attachCalendarListeners() {
    // Week cell click handlers
    const cells = this._calendarContainer.querySelectorAll('.wn-week-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const week = parseInt(cell.dataset.week, 10);
        const year = parseInt(cell.dataset.year, 10);
        this._onWeekSelect(year, week);
      });
    });

    // Year navigation buttons
    const navBtns = this._calendarContainer.querySelectorAll('.wn-year-nav');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const direction = btn.dataset.direction;
        if (direction === 'prev') {
          this._selectedYear--;
        } else {
          this._selectedYear++;
        }
        this._selectedWeek = null;
        this._calendarContainer.innerHTML = this._renderWeekCalendar(this._selectedYear, this._selectedWeek);
        this._attachCalendarListeners();
      });
    });
  },

  _onWeekSelect(isoYear, isoWeek) {
    this._selectedWeek = isoWeek;
    this._selectedYear = isoYear;

    const weekDates = getISOWeekDates(isoYear, isoWeek);

    // Update result card to show selected week info
    this._resultCard.innerHTML = `
      <div class="result-header animate-slide-up">
        <span class="result-label">Selected Week</span>
        <h2 class="result-value wn-week-number">Week ${isoWeek}</h2>
      </div>
      <div class="result-details animate-slide-up stagger-1">
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4CB;</span>
          <span class="result-detail-text">ISO Year: <strong>${isoYear}</strong></span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4C5;</span>
          <span class="result-detail-text">
            Start (Mon): <strong>${this._formatShortDate(weekDates.start)}</strong>
          </span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-icon">&#x1F4C6;</span>
          <span class="result-detail-text">
            End (Sun): <strong>${this._formatShortDate(weekDates.end)}</strong>
          </span>
        </div>
      </div>
    `;
    this._showResult();

    // Re-render calendar with new selection
    this._calendarContainer.innerHTML = this._renderWeekCalendar(isoYear, isoWeek);
    this._attachCalendarListeners();
  },

  /**
   * Determine how many ISO weeks exist in a given ISO year.
   * An ISO year has 53 weeks if January 1 is a Thursday,
   * or if December 31 is a Thursday (only happens in leap years).
   */
  _getISOWeeksInYear(isoYear) {
    // Use the getISOWeekNumber function to check Dec 28 (always in the last week)
    const dec28 = getISOWeekNumber(isoYear, 12, 28);
    return dec28.isoWeek;
  },

  _formatShortDate(date) {
    const monthName = MONTH_NAMES[date.month - 1];
    return `${monthName} ${date.day}, ${date.year}`;
  },

  _formatTinyDate(date) {
    const monthName = MONTH_NAMES[date.month - 1];
    return `${monthName} ${date.day}`;
  },

  _showError(message) {
    this._errorEl.textContent = message;
    this._errorEl.hidden = false;
    this._dateInput.classList.add('input-field--error');
    this._dateInput.classList.add('animate-shake');
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
  document.addEventListener('DOMContentLoaded', () => WeekNumberCalculator.init());
} else {
  WeekNumberCalculator.init();
}

export default WeekNumberCalculator;
