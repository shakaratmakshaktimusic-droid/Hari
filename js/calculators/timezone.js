/**
 * Timezone Converter - Convert times between timezones worldwide.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7
 */
import { convertTimezone, searchTimezones, getDSTStatus, getAllTimezones } from '../core/timezone-db.js';

const TimezoneConverter = {
  /** @type {string|null} Source timezone IANA id */
  _sourceZone: null,

  /** @type {Array<{id: string, city: string, country: string}>} Target zones */
  _targetZones: [],

  /** @type {HTMLElement|null} */
  _calculatorCard: null,

  /** @type {HTMLElement|null} */
  _resultCard: null,

  /** @type {number|null} Active autocomplete dropdown index */
  _activeDropdown: null,

  /**
   * Initialize the Timezone Converter UI.
   * Renders the form into #calculator-card and sets up event handlers.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!this._calculatorCard) return;

    // Detect user's local timezone
    this._sourceZone = this._detectLocalTimezone();

    this._renderForm();
    this._bindEvents();
  },

  /**
   * Detect user's local IANA timezone using Intl API.
   * @returns {string} IANA timezone id
   */
  _detectLocalTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Verify it's in our database
      const allZones = getAllTimezones();
      const match = allZones.find(z => z.id === tz);
      if (match) return tz;
      // Default fallback
      return 'America/New_York';
    } catch (e) {
      return 'America/New_York';
    }
  },

  /**
   * Get display label for a timezone.
   * @param {string} zoneId - IANA timezone id
   * @returns {string}
   */
  _getZoneLabel(zoneId) {
    const allZones = getAllTimezones();
    const zone = allZones.find(z => z.id === zoneId);
    if (zone) {
      return `${zone.city}, ${zone.country} (${zone.abbreviation})`;
    }
    return zoneId;
  },

  /**
   * Render the converter form with source timezone, time/date inputs,
   * and target zone management.
   */
  _renderForm() {
    const now = new Date();
    const hours24 = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const hoursStr = String(hours24).padStart(2, '0');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this._calculatorCard.innerHTML = `
      <form id="timezone-form" class="timezone-form" novalidate>
        <!-- Source Timezone -->
        <div class="form-group">
          <label class="form-label" for="source-timezone">Source Time Zone</label>
          <div class="input-wrapper tz-autocomplete-wrapper">
            <input
              type="text"
              id="source-timezone"
              class="input-field glass-input"
              placeholder="Search city, country, or abbreviation..."
              autocomplete="off"
              value="${this._getZoneLabel(this._sourceZone)}"
              aria-describedby="source-timezone-error"
              data-zone-id="${this._sourceZone}"
            />
            <div class="tz-autocomplete-dropdown" id="source-dropdown" hidden></div>
          </div>
          <span id="source-timezone-error" class="error-message" role="alert" hidden></span>
        </div>

        <!-- Time and Date Inputs -->
        <div class="form-row">
          <div class="form-group form-group--half">
            <label class="form-label" for="source-time">Time</label>
            <div class="input-wrapper time-input-wrapper">
              <input
                type="time"
                id="source-time"
                class="input-field glass-input"
                value="${hoursStr}:${minutes}"
              />
            </div>
          </div>

          <div class="form-group form-group--half">
            <label class="form-label" for="source-date">Date</label>
            <div class="input-wrapper">
              <input
                type="date"
                id="source-date"
                class="input-field glass-input"
                value="${year}-${month}-${day}"
              />
            </div>
          </div>
        </div>

        <!-- Target Zones Section -->
        <div class="form-group">
          <label class="form-label">Target Time Zones</label>
          <div id="target-zones-list" class="target-zones-list">
            <!-- Target zones will be added here -->
          </div>
          <div class="input-wrapper tz-autocomplete-wrapper">
            <input
              type="text"
              id="add-target-input"
              class="input-field glass-input"
              placeholder="Search and add a target timezone..."
              autocomplete="off"
            />
            <div class="tz-autocomplete-dropdown" id="target-dropdown" hidden></div>
          </div>
        </div>

        <!-- Convert Button -->
        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Convert Time
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="clear-btn">
            Clear All
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Bind DOM event handlers.
   */
  _bindEvents() {
    const form = document.getElementById('timezone-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.convert();
      });
    }

    // Source timezone autocomplete
    const sourceInput = document.getElementById('source-timezone');
    if (sourceInput) {
      sourceInput.addEventListener('input', () => this._handleAutocomplete('source'));
      sourceInput.addEventListener('focus', () => {
        sourceInput.select();
        this._handleAutocomplete('source');
      });
      sourceInput.addEventListener('blur', () => {
        setTimeout(() => this._hideDropdown('source'), 200);
      });
      sourceInput.addEventListener('keydown', (e) => this._handleDropdownKeydown(e, 'source'));
    }

    // Target timezone autocomplete
    const targetInput = document.getElementById('add-target-input');
    if (targetInput) {
      targetInput.addEventListener('input', () => this._handleAutocomplete('target'));
      targetInput.addEventListener('focus', () => this._handleAutocomplete('target'));
      targetInput.addEventListener('blur', () => {
        setTimeout(() => this._hideDropdown('target'), 200);
      });
      targetInput.addEventListener('keydown', (e) => this._handleDropdownKeydown(e, 'target'));
    }

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._clearAll());
    }

    // Auto-convert on time/date change
    const timeInput = document.getElementById('source-time');
    const dateInput = document.getElementById('source-date');
    if (timeInput) {
      timeInput.addEventListener('change', () => this._autoConvert());
    }
    if (dateInput) {
      dateInput.addEventListener('change', () => this._autoConvert());
    }
  },

  /**
   * Handle autocomplete search for timezone fields.
   * @param {'source'|'target'} type
   */
  _handleAutocomplete(type) {
    const inputId = type === 'source' ? 'source-timezone' : 'add-target-input';
    const dropdownId = type === 'source' ? 'source-dropdown' : 'target-dropdown';

    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    const query = input.value.trim();

    let results;
    if (query.length === 0) {
      // Show popular timezones when empty
      results = getAllTimezones().slice(0, 10);
    } else {
      results = searchTimezones(query);
    }

    // Filter out already-added targets if we're adding a target
    if (type === 'target') {
      results = results.filter(r => !this._targetZones.some(t => t.id === r.id));
    }

    if (results.length === 0) {
      dropdown.innerHTML = '<div class="tz-dropdown-empty">No matching timezones found</div>';
      dropdown.hidden = false;
      return;
    }

    dropdown.innerHTML = results.map((tz, index) => `
      <div class="tz-dropdown-item" data-zone-id="${tz.id}" data-index="${index}" role="option">
        <span class="tz-dropdown-city">${tz.city}</span>
        <span class="tz-dropdown-meta">${tz.country} &middot; ${tz.abbreviation} &middot; UTC${tz.utcOffset >= 0 ? '+' : ''}${tz.utcOffset}</span>
      </div>
    `).join('');

    dropdown.hidden = false;
    this._activeDropdown = null;

    // Add click handlers to dropdown items
    const items = dropdown.querySelectorAll('.tz-dropdown-item');
    items.forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const zoneId = item.getAttribute('data-zone-id');
        this._selectTimezone(type, zoneId);
      });
    });
  },

  /**
   * Handle keyboard navigation in dropdown.
   * @param {KeyboardEvent} e
   * @param {'source'|'target'} type
   */
  _handleDropdownKeydown(e, type) {
    const dropdownId = type === 'source' ? 'source-dropdown' : 'target-dropdown';
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown || dropdown.hidden) return;

    const items = dropdown.querySelectorAll('.tz-dropdown-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this._activeDropdown === null) {
        this._activeDropdown = 0;
      } else {
        this._activeDropdown = Math.min(this._activeDropdown + 1, items.length - 1);
      }
      this._highlightDropdownItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this._activeDropdown === null) {
        this._activeDropdown = items.length - 1;
      } else {
        this._activeDropdown = Math.max(this._activeDropdown - 1, 0);
      }
      this._highlightDropdownItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this._activeDropdown !== null && items[this._activeDropdown]) {
        const zoneId = items[this._activeDropdown].getAttribute('data-zone-id');
        this._selectTimezone(type, zoneId);
      }
    } else if (e.key === 'Escape') {
      this._hideDropdown(type);
    }
  },

  /**
   * Highlight active item in dropdown.
   * @param {NodeList} items
   */
  _highlightDropdownItem(items) {
    items.forEach((item, idx) => {
      if (idx === this._activeDropdown) {
        item.classList.add('tz-dropdown-item--active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('tz-dropdown-item--active');
      }
    });
  },

  /**
   * Select a timezone from the autocomplete dropdown.
   * @param {'source'|'target'} type
   * @param {string} zoneId - IANA timezone id
   */
  _selectTimezone(type, zoneId) {
    if (type === 'source') {
      this._sourceZone = zoneId;
      const input = document.getElementById('source-timezone');
      if (input) {
        input.value = this._getZoneLabel(zoneId);
        input.setAttribute('data-zone-id', zoneId);
      }
      this._hideDropdown('source');
      this._autoConvert();
    } else {
      // Add to target zones
      const allZones = getAllTimezones();
      const zone = allZones.find(z => z.id === zoneId);
      if (zone && !this._targetZones.some(t => t.id === zoneId)) {
        this._targetZones.push({ id: zone.id, city: zone.city, country: zone.country });
        this._renderTargetZones();
        const input = document.getElementById('add-target-input');
        if (input) input.value = '';
        this._hideDropdown('target');
        this._autoConvert();
      }
    }
  },

  /**
   * Hide a specific dropdown.
   * @param {'source'|'target'} type
   */
  _hideDropdown(type) {
    const dropdownId = type === 'source' ? 'source-dropdown' : 'target-dropdown';
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.hidden = true;
    this._activeDropdown = null;
  },

  /**
   * Render the list of target timezone chips with remove buttons.
   */
  _renderTargetZones() {
    const container = document.getElementById('target-zones-list');
    if (!container) return;

    if (this._targetZones.length === 0) {
      container.innerHTML = '<p class="tz-hint">Add target timezones above to convert</p>';
      return;
    }

    container.innerHTML = this._targetZones.map(tz => `
      <div class="tz-target-chip" data-zone-id="${tz.id}">
        <span class="tz-target-chip__label">${tz.city}, ${tz.country}</span>
        <button type="button" class="tz-target-chip__remove" data-remove-id="${tz.id}" aria-label="Remove ${tz.city}">
          &times;
        </button>
      </div>
    `).join('');

    // Bind remove buttons
    const removeButtons = container.querySelectorAll('.tz-target-chip__remove');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const removeId = btn.getAttribute('data-remove-id');
        this._removeTargetZone(removeId);
      });
    });
  },

  /**
   * Remove a target zone from the list.
   * @param {string} zoneId
   */
  _removeTargetZone(zoneId) {
    this._targetZones = this._targetZones.filter(t => t.id !== zoneId);
    this._renderTargetZones();
    this._autoConvert();
  },

  /**
   * Auto-convert if there are target zones and source is set.
   */
  _autoConvert() {
    if (this._targetZones.length > 0 && this._sourceZone) {
      this.convert();
    }
  },

  /**
   * Perform timezone conversion for all target zones.
   * Validates inputs and displays results simultaneously.
   */
  convert() {
    if (!this._sourceZone) {
      this._showError('source-timezone', 'Please select a source timezone');
      return;
    }

    if (this._targetZones.length === 0) {
      if (this._resultCard) {
        this._resultCard.innerHTML = '<p class="tz-no-targets">Add at least one target timezone to see conversions.</p>';
        this._resultCard.hidden = false;
      }
      return;
    }

    const timeInput = document.getElementById('source-time');
    const dateInput = document.getElementById('source-date');

    const timeValue = timeInput ? timeInput.value : '';
    const dateValue = dateInput ? dateInput.value : '';

    if (!timeValue) {
      return;
    }

    // Parse time (HH:MM format from time input)
    const timeParts = timeValue.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    // Parse date (YYYY-MM-DD format from date input)
    let year, month, day;
    if (dateValue) {
      const dateParts = dateValue.split('-');
      year = parseInt(dateParts[0], 10);
      month = parseInt(dateParts[1], 10);
      day = parseInt(dateParts[2], 10);
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
      day = now.getDate();
    }

    const time = { hours, minutes, seconds: 0 };
    const date = { year, month, day };

    // Get DST status for source
    const sourceDST = getDSTStatus(this._sourceZone, date);

    // Convert to each target zone
    const results = this._targetZones.map(tz => {
      const convResult = convertTimezone(time, date, this._sourceZone, tz.id);
      const targetDST = getDSTStatus(tz.id, convResult.convertedDate);
      return {
        zone: tz,
        ...convResult,
        targetDST
      };
    });

    this._renderResults(results, time, date, sourceDST);
  },

  /**
   * Render conversion results for all target zones.
   * @param {Array} results - Conversion results for each target
   * @param {{hours: number, minutes: number}} time - Source time
   * @param {{year: number, month: number, day: number}} date - Source date
   * @param {Object} sourceDST - DST status of source zone
   */
  _renderResults(results, time, date, sourceDST) {
    if (!this._resultCard) return;

    const sourceLabel = this._getZoneLabel(this._sourceZone);
    const sourceTimeStr = this._formatTime(time.hours, time.minutes);
    const sourceDateStr = this._formatDateDisplay(date);

    // Source DST badge
    const sourceDSTBadge = sourceDST.isDST
      ? '<span class="badge badge--dst">DST</span>'
      : '<span class="badge badge--standard">Standard</span>';

    const sourceOffsetStr = `UTC${sourceDST.offset >= 0 ? '+' : ''}${this._formatOffset(sourceDST.offset)}`;

    let html = `
      <div class="tz-result-header animate-fade-in">
        <div class="tz-result-source">
          <span class="tz-result-source__label">Source</span>
          <span class="tz-result-source__zone">${sourceLabel}</span>
          <span class="tz-result-source__time">${sourceTimeStr}</span>
          <span class="tz-result-source__date">${sourceDateStr}</span>
          <div class="tz-result-source__meta">
            ${sourceDSTBadge}
            <span class="badge badge--offset">${sourceOffsetStr}</span>
          </div>
        </div>
      </div>

      <div class="tz-result-targets">
    `;

    results.forEach((result, index) => {
      const targetTimeStr = this._formatTime(result.convertedTime.hours, result.convertedTime.minutes);
      const targetDateStr = this._formatDateDisplay(result.convertedDate);
      const targetLabel = `${result.zone.city}, ${result.zone.country}`;

      // DST badge for target
      const targetDSTBadge = result.targetDST.isDST
        ? '<span class="badge badge--dst">DST</span>'
        : '<span class="badge badge--standard">Standard</span>';

      const targetOffsetStr = `UTC${result.targetDST.offset >= 0 ? '+' : ''}${this._formatOffset(result.targetDST.offset)}`;

      // Time difference indicator
      const diffSign = result.offsetHours >= 0 ? '+' : '';
      const diffStr = `${diffSign}${this._formatOffset(result.offsetHours)} hrs`;

      // DST boundary note
      let dstNote = '';
      if (result.crossesDST && result.dstNote) {
        dstNote = `<div class="tz-result-dst-note"><span class="badge badge--warning">DST Boundary</span> ${result.dstNote}</div>`;
      }

      // Date change indicator
      let dateChangeNote = '';
      if (result.convertedDate.day !== date.day || result.convertedDate.month !== date.month || result.convertedDate.year !== date.year) {
        const dayDiff = this._getDayDifference(date, result.convertedDate);
        dateChangeNote = dayDiff > 0
          ? `<span class="badge badge--info">+${dayDiff} day${dayDiff > 1 ? 's' : ''}</span>`
          : `<span class="badge badge--info">${dayDiff} day${dayDiff < -1 ? 's' : ''}</span>`;
      }

      html += `
        <div class="tz-result-target-card animate-slide-up stagger-${index + 1}" data-zone-id="${result.zone.id}">
          <div class="tz-result-target__header">
            <span class="tz-result-target__city">${targetLabel}</span>
            <span class="tz-result-target__diff">${diffStr}</span>
          </div>
          <div class="tz-result-target__time">${targetTimeStr}</div>
          <div class="tz-result-target__date">${targetDateStr} ${dateChangeNote}</div>
          <div class="tz-result-target__meta">
            ${targetDSTBadge}
            <span class="badge badge--offset">${targetOffsetStr}</span>
          </div>
          ${dstNote}
        </div>
      `;
    });

    html += '</div>';

    this._resultCard.innerHTML = html;
    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in');
  },

  /**
   * Format hours and minutes into display string (12h with AM/PM).
   * @param {number} hours - 0-23
   * @param {number} minutes - 0-59
   * @returns {string}
   */
  _formatTime(hours, minutes) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  },

  /**
   * Format a date object for display.
   * @param {{year: number, month: number, day: number}} date
   * @returns {string}
   */
  _formatDateDisplay(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(date.year, date.month - 1, date.day);
    const dayName = days[d.getDay()];
    return `${dayName}, ${months[date.month - 1]} ${date.day}, ${date.year}`;
  },

  /**
   * Format offset value (handles half-hour offsets like 5.5 -> "5:30").
   * @param {number} offset
   * @returns {string}
   */
  _formatOffset(offset) {
    const absOffset = Math.abs(offset);
    const wholeHours = Math.floor(absOffset);
    const fractionalMinutes = Math.round((absOffset - wholeHours) * 60);

    if (fractionalMinutes === 0) {
      return `${offset < 0 ? '-' : ''}${wholeHours}`;
    }
    return `${offset < 0 ? '-' : ''}${wholeHours}:${String(fractionalMinutes).padStart(2, '0')}`;
  },

  /**
   * Calculate approximate day difference between two dates.
   * @param {{year: number, month: number, day: number}} date1
   * @param {{year: number, month: number, day: number}} date2
   * @returns {number}
   */
  _getDayDifference(date1, date2) {
    const d1 = new Date(date1.year, date1.month - 1, date1.day);
    const d2 = new Date(date2.year, date2.month - 1, date2.day);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  /**
   * Show error message for a field.
   * @param {string} fieldId
   * @param {string} message
   */
  _showError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clear all form state and results.
   */
  _clearAll() {
    this._targetZones = [];
    this._renderTargetZones();

    const timeInput = document.getElementById('source-time');
    const dateInput = document.getElementById('source-date');
    const addTargetInput = document.getElementById('add-target-input');

    const now = new Date();
    if (timeInput) {
      timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    if (dateInput) {
      dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (addTargetInput) {
      addTargetInput.value = '';
    }

    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TimezoneConverter.init());
} else {
  TimezoneConverter.init();
}

export default TimezoneConverter;
