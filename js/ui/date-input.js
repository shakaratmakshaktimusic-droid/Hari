/**
 * DateInputComponent - Reusable date input with separate day/month/year boxes + calendar picker.
 * Provides a consistent, user-friendly date input across all calculator pages.
 */

const DateInputComponent = {
  /**
   * Renders a date input group with separate DD/MM/YYYY fields + calendar picker.
   * @param {Object} config
   * @param {string} config.id - Base ID for the input group (e.g., 'start-date')
   * @param {string} config.label - Label text
   * @param {string} [config.value] - Pre-filled date as 'YYYY-MM-DD'
   * @returns {string} HTML string
   */
  render(config) {
    const { id, label, value } = config;
    let day = '', month = '', year = '';
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1].replace(/^0/, '');
        day = parts[2].replace(/^0/, '');
      }
    }

    return `
      <div class="form-group date-input-group" data-date-input="${id}">
        <label class="form-label">${label}</label>
        <div class="date-input-boxes">
          <div class="date-input-box">
            <input type="number" class="input-field glass-input date-input-day" 
                   id="${id}-day" placeholder="DD" min="1" max="31" 
                   value="${day}" aria-label="Day" />
            <span class="date-input-box-label">Day</span>
          </div>
          <div class="date-input-box">
            <input type="number" class="input-field glass-input date-input-month" 
                   id="${id}-month" placeholder="MM" min="1" max="12" 
                   value="${month}" aria-label="Month" />
            <span class="date-input-box-label">Month</span>
          </div>
          <div class="date-input-box">
            <input type="number" class="input-field glass-input date-input-year" 
                   id="${id}-year" placeholder="YYYY" min="1" max="9999" 
                   value="${year}" aria-label="Year" />
            <span class="date-input-box-label">Year</span>
          </div>
          <div class="date-input-calendar-wrapper">
            <input type="date" class="date-input-native" id="${id}-native" 
                   aria-label="Pick date from calendar" tabindex="-1" />
            <button type="button" class="btn btn--ghost date-input-calendar-btn" 
                    data-target="${id}" aria-label="Open calendar picker" title="Pick from calendar">
              &#x1F4C5;
            </button>
          </div>
          <button type="button" class="btn btn--ghost date-input-today-btn" 
                  data-target="${id}" aria-label="Set to today" title="Today">
            Today
          </button>
        </div>
        <span id="${id}-error" class="error-message" role="alert" hidden></span>
      </div>
    `;
  },

  /**
   * Gets the date value from a date input group.
   * @param {string} id - Base ID of the date input group
   * @returns {{year: number, month: number, day: number} | null}
   */
  getValue(id) {
    const dayEl = document.getElementById(`${id}-day`);
    const monthEl = document.getElementById(`${id}-month`);
    const yearEl = document.getElementById(`${id}-year`);
    if (!dayEl || !monthEl || !yearEl) return null;

    const day = parseInt(dayEl.value, 10);
    const month = parseInt(monthEl.value, 10);
    const year = parseInt(yearEl.value, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return { year, month, day };
  },

  /**
   * Sets the date value in a date input group.
   * @param {string} id - Base ID
   * @param {{year: number, month: number, day: number}} date
   */
  setValue(id, date) {
    const dayEl = document.getElementById(`${id}-day`);
    const monthEl = document.getElementById(`${id}-month`);
    const yearEl = document.getElementById(`${id}-year`);
    if (dayEl) dayEl.value = date.day;
    if (monthEl) monthEl.value = date.month;
    if (yearEl) yearEl.value = date.year;
  },

  /**
   * Sets today's date in a date input group.
   * @param {string} id - Base ID
   */
  setToday(id) {
    const now = new Date();
    this.setValue(id, {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    });
  },

  /**
   * Shows an error message for a date input group.
   * @param {string} id - Base ID
   * @param {string} message - Error message
   */
  showError(id, message) {
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clears the error message for a date input group.
   * @param {string} id - Base ID
   */
  clearError(id) {
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  },

  /**
   * Initialize event listeners for calendar picker and today buttons within a container.
   * Call this after rendering date inputs.
   * @param {HTMLElement} container - The parent element containing date inputs
   */
  initListeners(container) {
    if (!container) return;

    // Calendar picker buttons
    container.querySelectorAll('.date-input-calendar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const nativeInput = document.getElementById(`${targetId}-native`);
        if (nativeInput) {
          nativeInput.showPicker ? nativeInput.showPicker() : nativeInput.click();
        }
      });
    });

    // Native date input change -> populate day/month/year boxes
    container.querySelectorAll('.date-input-native').forEach(input => {
      input.addEventListener('change', () => {
        const id = input.id.replace('-native', '');
        if (input.value) {
          const parts = input.value.split('-');
          const dayEl = document.getElementById(`${id}-day`);
          const monthEl = document.getElementById(`${id}-month`);
          const yearEl = document.getElementById(`${id}-year`);
          if (dayEl) dayEl.value = parseInt(parts[2], 10);
          if (monthEl) monthEl.value = parseInt(parts[1], 10);
          if (yearEl) yearEl.value = parseInt(parts[0], 10);
          // Clear error
          const errorEl = document.getElementById(`${id}-error`);
          if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
        }
      });
    });

    // Today buttons
    container.querySelectorAll('.date-input-today-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        this.setToday(targetId);
        // Clear error
        const errorEl = document.getElementById(`${targetId}-error`);
        if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
      });
    });

    // Auto-tab: when day field has 2 digits, move focus to month
    // When month field has 2 digits, move focus to year
    container.querySelectorAll('.date-input-day').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.length >= 2) {
          const id = input.id.replace('-day', '');
          const monthEl = document.getElementById(`${id}-month`);
          if (monthEl) monthEl.focus();
        }
      });
    });

    container.querySelectorAll('.date-input-month').forEach(input => {
      input.addEventListener('input', () => {
        if (input.value.length >= 2) {
          const id = input.id.replace('-month', '');
          const yearEl = document.getElementById(`${id}-year`);
          if (yearEl) yearEl.focus();
        }
      });
    });
  }
};

export default DateInputComponent;
