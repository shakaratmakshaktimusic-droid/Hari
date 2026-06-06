/**
 * Day of Week Calculator - Find what day of the week any date falls on.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
import { formatDate } from '../core/date-parser.js';
import { getDayOfWeekName, getDayOfYear, getDaysRemainingInYear, getDaysInYear } from '../core/date-calc.js';
import { validateDate } from '../core/date-parser.js';
import DateInputComponent from '../ui/date-input.js';

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

const DayOfWeekCalculator = {
  _resultCard: null,

  init() {
    // 1. Get DOM references
    const calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!calculatorCard) return;

    // 2. Render the calculator form
    calculatorCard.innerHTML = this._renderForm();

    // 3. Initialize DateInputComponent listeners
    DateInputComponent.initListeners(calculatorCard);

    // 4. Set up form submit handler
    const form = document.getElementById('dow-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculate();
      });
    }

    // 5. Set today's date as default value
    DateInputComponent.setToday('dow-date');
  },

  _renderForm() {
    return `
      <form id="dow-form" class="dow-form" novalidate>
        ${DateInputComponent.render({ id: 'dow-date', label: 'Enter a date' })}

        <div class="form-actions">
          <button type="submit" class="btn btn--primary dow-calculate-btn">
            Calculate Day
          </button>
        </div>
      </form>
    `;
  },

  _renderResult(date, dayName, dayOfYear, daysRemaining, daysInYear) {
    const formattedDate = formatDate(date, 'MM/DD/YYYY');
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
    // 1. Get date value from DateInputComponent
    const dateValue = DateInputComponent.getValue('dow-date');

    // 2. If fields are incomplete, show error
    if (!dateValue) {
      DateInputComponent.showError('dow-date', 'Please fill in all date fields (Day, Month, Year)');
      this._hideResult();
      return;
    }

    const { year, month, day } = dateValue;

    // 3. Validate the date
    const validation = validateDate(year, month, day);
    if (!validation.valid) {
      DateInputComponent.showError('dow-date', validation.error);
      this._hideResult();
      return;
    }

    // 4. Compute results
    const dayName = getDayOfWeekName(year, month, day);
    const dayOfYear = getDayOfYear(year, month, day);
    const daysRemaining = getDaysRemainingInYear(year, month, day);
    const daysInYear = getDaysInYear(year);

    // 5. Render result card
    DateInputComponent.clearError('dow-date');
    this._resultCard.innerHTML = this._renderResult(
      { year, month, day },
      dayName,
      dayOfYear,
      daysRemaining,
      daysInYear
    );
    this._showResult();
  },

  _showResult() {
    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-slide-up');
    this._resultCard.classList.add('glass-card');
  },

  _hideResult() {
    this._resultCard.hidden = true;
    this._resultCard.classList.remove('animate-slide-up');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DayOfWeekCalculator.init());
} else {
  DayOfWeekCalculator.init();
}

export default DayOfWeekCalculator;
