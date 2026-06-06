/**
 * Countdown Timer - Create live countdowns to important dates and events.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 *
 * Features:
 * - Set target date/time with custom label
 * - Live countdown updating every second (days, hours, minutes, seconds)
 * - Multiple simultaneous countdowns with custom labels
 * - Persist active countdowns in localStorage ('date-calc-countdowns' key)
 * - Celebration animation when countdown reaches zero
 * - Browser tab title updates with active countdown
 * - Handle past dates with "time since" elapsed display
 * - Delete individual countdowns
 */

const STORAGE_KEY = 'date-calc-countdowns';
const ORIGINAL_TITLE = document.title;

/**
 * Generate a UUID v4 string.
 * @returns {string}
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * @typedef {Object} CountdownEntry
 * @property {string} id - UUID
 * @property {string} label - User-defined label
 * @property {number} targetTimestamp - Target datetime as Unix ms
 * @property {number} createdAt - Creation timestamp
 */

const CountdownTimer = {
  /** @type {CountdownEntry[]} */
  _countdowns: [],

  /** @type {number|null} */
  _intervalId: null,

  /** @type {Set<string>} - IDs of countdowns that have already celebrated */
  _celebrated: new Set(),

  /**
   * Initialize the Countdown Timer UI.
   * Renders the form, restores persisted countdowns, starts update loop.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._countdownsList = document.getElementById('countdowns-list');

    if (!this._calculatorCard) return;

    this._renderForm();
    this._restoreFromStorage();
    this._renderCountdowns();
    this._startUpdateLoop();
    this._bindEvents();
  },

  /**
   * Render the countdown creation form.
   */
  _renderForm() {
    this._calculatorCard.innerHTML = `
      <form id="countdown-form" class="countdown-form" novalidate>
        <div class="form-row">
          <div class="form-group form-group--third">
            <label class="form-label" for="countdown-date">Target Date</label>
            <input
              type="date"
              id="countdown-date"
              class="input-field glass-input"
              required
              aria-describedby="countdown-date-error"
            />
            <span id="countdown-date-error" class="error-message" role="alert" hidden></span>
          </div>

          <div class="form-group form-group--third">
            <label class="form-label" for="countdown-time">Target Time</label>
            <input
              type="time"
              id="countdown-time"
              class="input-field glass-input"
              value="00:00"
              aria-describedby="countdown-time-error"
            />
            <span id="countdown-time-error" class="error-message" role="alert" hidden></span>
          </div>

          <div class="form-group form-group--third">
            <label class="form-label" for="countdown-label">Label</label>
            <input
              type="text"
              id="countdown-label"
              class="input-field glass-input"
              placeholder="e.g. New Year, Birthday"
              maxlength="100"
              required
              aria-describedby="countdown-label-error"
            />
            <span id="countdown-label-error" class="error-message" role="alert" hidden></span>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary countdown-start-btn">
            Start Countdown
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Bind form submission and delegation events.
   */
  _bindEvents() {
    const form = document.getElementById('countdown-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleCreateCountdown();
      });
    }

    // Delegation for delete buttons within countdown cards
    if (this._countdownsList) {
      this._countdownsList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          if (id) this._deleteCountdown(id);
        }
      });
    }
  },

  /**
   * Handle creating a new countdown from form inputs.
   */
  _handleCreateCountdown() {
    const dateInput = document.getElementById('countdown-date');
    const timeInput = document.getElementById('countdown-time');
    const labelInput = document.getElementById('countdown-label');

    // Clear previous errors
    this._clearErrors();

    // Validate date
    const dateValue = dateInput.value.trim();
    if (!dateValue) {
      this._showError('countdown-date-error', 'Please select a target date.');
      dateInput.classList.add('input-field--error');
      return;
    }

    // Validate label
    const labelValue = labelInput.value.trim();
    if (!labelValue) {
      this._showError('countdown-label-error', 'Please enter a label for your countdown.');
      labelInput.classList.add('input-field--error');
      return;
    }

    // Build target timestamp
    const timeValue = timeInput.value || '00:00';
    const targetTimestamp = new Date(`${dateValue}T${timeValue}:00`).getTime();

    if (isNaN(targetTimestamp)) {
      this._showError('countdown-date-error', 'Invalid date or time value.');
      return;
    }

    // Create entry
    const entry = {
      id: generateId(),
      label: labelValue,
      targetTimestamp,
      createdAt: Date.now(),
    };

    this.createCountdown(entry);

    // Reset form
    dateInput.value = '';
    timeInput.value = '00:00';
    labelInput.value = '';
  },

  /**
   * Create a new countdown entry and persist.
   * @param {CountdownEntry} entry
   */
  createCountdown(entry) {
    this._countdowns.push(entry);
    this._persistToStorage();
    this._renderCountdowns();
  },

  /**
   * Delete a countdown by ID.
   * @param {string} id
   */
  _deleteCountdown(id) {
    this._countdowns = this._countdowns.filter((c) => c.id !== id);
    this._celebrated.delete(id);
    this._persistToStorage();
    this._renderCountdowns();
    this._updateTabTitle();
  },

  /**
   * Render all active countdown cards.
   */
  _renderCountdowns() {
    if (!this._countdownsList) return;

    if (this._countdowns.length === 0) {
      this._countdownsList.innerHTML = `
        <div class="countdown-empty glass-card animate-fade-in">
          <p class="countdown-empty__text">No active countdowns. Create one above!</p>
        </div>
      `;
      return;
    }

    this._countdownsList.innerHTML = this._countdowns
      .map((entry, index) => this._renderCountdownCard(entry, index))
      .join('');
  },

  /**
   * Render a single countdown card HTML.
   * @param {CountdownEntry} entry
   * @param {number} index - For stagger animation
   * @returns {string}
   */
  _renderCountdownCard(entry, index) {
    const now = Date.now();
    const diff = entry.targetTimestamp - now;
    const isPast = diff <= 0;
    const decomposition = this._decompose(Math.abs(diff));
    const targetDate = new Date(entry.targetTimestamp);
    const formattedTarget = targetDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
    const pastClass = isPast ? 'countdown-card--past' : '';
    const statusLabel = isPast ? 'Time since' : 'Countdown to';

    return `
      <div class="countdown-card glass-card animate-slide-up ${staggerClass} ${pastClass}" data-id="${entry.id}">
        <div class="countdown-card__header">
          <div class="countdown-card__meta">
            <span class="countdown-card__status badge ${isPast ? 'badge--warning' : ''}">${statusLabel}</span>
            <h3 class="countdown-card__label">${this._escapeHtml(entry.label)}</h3>
            <span class="countdown-card__target">${formattedTarget}</span>
          </div>
          <button
            class="btn btn--ghost countdown-card__delete"
            data-action="delete"
            data-id="${entry.id}"
            aria-label="Delete countdown: ${this._escapeHtml(entry.label)}"
            title="Delete countdown"
          >
            &#x2715;
          </button>
        </div>
        <div class="countdown-card__display" data-countdown-id="${entry.id}">
          ${this._renderTimeDisplay(decomposition, isPast)}
        </div>
        <div class="countdown-card__celebration" data-celebrate-id="${entry.id}" hidden></div>
      </div>
    `;
  },

  /**
   * Render the time display (DD:HH:MM:SS).
   * @param {{days: number, hours: number, minutes: number, seconds: number}} decomposition
   * @param {boolean} isPast
   * @returns {string}
   */
  _renderTimeDisplay(decomposition, isPast) {
    const { days, hours, minutes, seconds } = decomposition;
    const prefix = isPast ? '-' : '';

    return `
      <div class="countdown-display ${isPast ? 'countdown-display--past' : ''}">
        <div class="countdown-unit">
          <span class="countdown-unit__value">${prefix}${days}</span>
          <span class="countdown-unit__label">Days</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__value">${String(hours).padStart(2, '0')}</span>
          <span class="countdown-unit__label">Hours</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__value">${String(minutes).padStart(2, '0')}</span>
          <span class="countdown-unit__label">Minutes</span>
        </div>
        <span class="countdown-separator">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__value">${String(seconds).padStart(2, '0')}</span>
          <span class="countdown-unit__label">Seconds</span>
        </div>
      </div>
    `;
  },

  /**
   * Decompose milliseconds into days, hours, minutes, seconds.
   * @param {number} ms - Absolute value milliseconds
   * @returns {{days: number, hours: number, minutes: number, seconds: number}}
   */
  _decompose(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  },

  /**
   * Start the 1-second interval that updates all countdown displays.
   */
  _startUpdateLoop() {
    if (this._intervalId) return;
    this._intervalId = setInterval(() => {
      this.updateDisplay();
    }, 1000);
  },

  /**
   * Stop the update loop (cleanup).
   */
  _stopUpdateLoop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  /**
   * Update all countdown displays every tick.
   */
  updateDisplay() {
    const now = Date.now();

    this._countdowns.forEach((entry) => {
      const displayEl = document.querySelector(
        `[data-countdown-id="${entry.id}"]`
      );
      if (!displayEl) return;

      const diff = entry.targetTimestamp - now;
      const isPast = diff <= 0;
      const decomposition = this._decompose(Math.abs(diff));

      displayEl.innerHTML = this._renderTimeDisplay(decomposition, isPast);

      // Handle celebration at zero crossing
      if (isPast && !this._celebrated.has(entry.id)) {
        const absDiff = Math.abs(diff);
        // Celebrate if we just crossed zero (within 2 seconds)
        if (absDiff < 2000) {
          this._triggerCelebration(entry.id);
        }
        this._celebrated.add(entry.id);

        // Update card class
        const card = document.querySelector(
          `.countdown-card[data-id="${entry.id}"]`
        );
        if (card && !card.classList.contains('countdown-card--past')) {
          card.classList.add('countdown-card--past');
          const badge = card.querySelector('.countdown-card__status');
          if (badge) {
            badge.textContent = 'Time since';
            badge.classList.add('badge--warning');
          }
        }
      }
    });

    this._updateTabTitle();
  },

  /**
   * Update the browser tab title with the first active (future) countdown.
   */
  _updateTabTitle() {
    const now = Date.now();
    // Find the first future countdown (or the most recently created if all past)
    const futureCountdowns = this._countdowns.filter(
      (c) => c.targetTimestamp > now
    );

    if (futureCountdowns.length > 0) {
      // Use the one with the nearest target
      const nearest = futureCountdowns.reduce((prev, curr) =>
        curr.targetTimestamp < prev.targetTimestamp ? curr : prev
      );
      const diff = nearest.targetTimestamp - now;
      const decomposition = this._decompose(diff);
      const { days, hours, minutes, seconds } = decomposition;
      const timeStr = `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      document.title = `${timeStr} - ${nearest.label}`;
    } else {
      document.title = ORIGINAL_TITLE;
    }
  },

  /**
   * Trigger celebration animation for a countdown that reached zero.
   * @param {string} id
   */
  _triggerCelebration(id) {
    const celebrateEl = document.querySelector(
      `[data-celebrate-id="${id}"]`
    );
    if (!celebrateEl) return;

    celebrateEl.hidden = false;
    celebrateEl.innerHTML = this._generateConfetti();

    // Remove after animation completes
    setTimeout(() => {
      celebrateEl.hidden = true;
      celebrateEl.innerHTML = '';
    }, 3000);
  },

  /**
   * Generate confetti particle HTML using the celebrate keyframe.
   * @returns {string}
   */
  _generateConfetti() {
    const colors = ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    let confetti = '';
    for (let i = 0; i < 20; i++) {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 500;
      const size = 8 + Math.random() * 12;
      confetti += `<span class="confetti-particle animate-celebrate" style="
        position: absolute;
        left: ${left}%;
        top: ${30 + Math.random() * 40}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-delay: ${delay}ms;
        opacity: 0.9;
      "></span>`;
    }
    return confetti;
  },

  /**
   * Persist countdowns to localStorage.
   */
  _persistToStorage() {
    try {
      const data = JSON.stringify(this._countdowns);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.warn('[CountdownTimer] Failed to persist to localStorage:', e);
    }
  },

  /**
   * Restore countdowns from localStorage.
   */
  _restoreFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._countdowns = parsed.filter(
            (entry) =>
              entry &&
              typeof entry.id === 'string' &&
              typeof entry.label === 'string' &&
              typeof entry.targetTimestamp === 'number' &&
              typeof entry.createdAt === 'number'
          );
          // Mark already-past countdowns as celebrated
          const now = Date.now();
          this._countdowns.forEach((c) => {
            if (c.targetTimestamp <= now) {
              this._celebrated.add(c.id);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[CountdownTimer] Failed to restore from localStorage:', e);
      this._countdowns = [];
    }
  },

  /**
   * Show an error message by ID.
   * @param {string} elementId
   * @param {string} message
   */
  _showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  },

  /**
   * Clear all error messages.
   */
  _clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach((el) => {
      el.textContent = '';
      el.hidden = true;
    });
    const errorInputs = document.querySelectorAll('.input-field--error');
    errorInputs.forEach((el) => el.classList.remove('input-field--error'));
  },

  /**
   * Escape HTML entities to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

export default CountdownTimer;

// Auto-init when used as standalone (non-module fallback)
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  // Already loaded
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-init handled by app.js module system
  });
}
