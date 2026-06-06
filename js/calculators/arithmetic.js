/**
 * Date Arithmetic Calculator - Add or subtract days, weeks, months, and years from any date.
 * Supports chaining multiple operations and business day toggle.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { parseDate, formatDate, validateDate } from '../core/date-parser.js';
import { addToDate, subtractFromDate, getDayOfWeekName, addBusinessDays } from '../core/date-calc.js';
import { validateDateInput, validateNumericInput } from '../core/validators.js';
import DateInputComponent from '../ui/date-input.js';

const MAX_OPERATIONS = 10;

const UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' }
];

const ArithmeticCalculator = {
  _operations: [], // Array of {type: 'add'|'subtract', unit: string, value: number}
  _calculatorCard: null,
  _resultCard: null,
  _useBusinessDays: false,

  /**
   * Initialize the Arithmetic Calculator UI.
   * Renders the form into #calculator-card and sets up event handlers.
   */
  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');

    if (!this._calculatorCard) return;

    // Start with one operation row
    this._operations = [{ type: 'add', unit: 'days', value: '' }];
    this._useBusinessDays = false;

    this._renderForm();
    this._bindEvents();
  },

  /**
   * Render the complete calculator form with start date, operations, and controls.
   */
  _renderForm() {
    this._calculatorCard.innerHTML = `
      <form id="arithmetic-form" class="arithmetic-form" novalidate>
        ${DateInputComponent.render({ id: 'arith-start-date', label: 'Start Date' })}

        <div class="form-group">
          <label class="form-label">Operations</label>
          <div id="arith-operations-container" class="arith-operations-container">
            ${this._renderOperationRows()}
          </div>
          <div class="arith-add-operation-wrapper">
            <button type="button" id="arith-add-operation" class="btn btn--ghost btn--add-op" ${this._operations.length >= MAX_OPERATIONS ? 'disabled' : ''}>
              + Add Operation
            </button>
            <span class="arith-op-count">${this._operations.length}/${MAX_OPERATIONS}</span>
          </div>
        </div>

        <div class="form-group form-group--toggle">
          <label class="toggle-label" for="arith-business-days">
            <span class="toggle-switch">
              <input type="checkbox" id="arith-business-days" class="toggle-input" ${this._useBusinessDays ? 'checked' : ''} />
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
            </span>
            <span class="toggle-text">Use business days (skip weekends) for day-based arithmetic</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary btn--calculate">
            Calculate Result
          </button>
          <button type="button" class="btn btn--secondary btn--clear" id="arith-clear-btn">
            Clear
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Render all operation rows.
   * @returns {string} HTML for all operation rows
   */
  _renderOperationRows() {
    return this._operations.map((op, index) => this._renderOperationRow(op, index)).join('');
  },

  /**
   * Render a single operation row with type, value, and unit.
   * @param {Object} op - The operation object
   * @param {number} index - Row index
   * @returns {string} HTML for the operation row
   */
  _renderOperationRow(op, index) {
    const showRemove = this._operations.length > 1;
    return `
      <div class="arith-operation-row animate-slide-up" data-index="${index}">
        <select class="input-field glass-input arith-op-type" data-index="${index}" aria-label="Operation type">
          <option value="add" ${op.type === 'add' ? 'selected' : ''}>+ Add</option>
          <option value="subtract" ${op.type === 'subtract' ? 'selected' : ''}>- Subtract</option>
        </select>
        <input
          type="number"
          class="input-field glass-input arith-op-value"
          data-index="${index}"
          placeholder="0"
          value="${op.value}"
          min="0"
          aria-label="Number of units"
        />
        <select class="input-field glass-input arith-op-unit" data-index="${index}" aria-label="Unit of time">
          ${UNITS.map(u => `<option value="${u.value}" ${op.unit === u.value ? 'selected' : ''}>${u.label}</option>`).join('')}
        </select>
        ${showRemove ? `<button type="button" class="btn btn--ghost btn--remove-op" data-index="${index}" aria-label="Remove operation">&#x2715;</button>` : ''}
      </div>
    `;
  },

  /**
   * Bind all form events using delegation.
   */
  _bindEvents() {
    const form = document.getElementById('arithmetic-form');
    if (!form) return;

    // Initialize DateInputComponent listeners (calendar picker, today buttons, auto-tab)
    DateInputComponent.initListeners(this._calculatorCard);

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });

    // Event delegation for operations container
    const opsContainer = document.getElementById('arith-operations-container');
    if (opsContainer) {
      opsContainer.addEventListener('change', (e) => {
        const target = e.target;
        const index = parseInt(target.getAttribute('data-index'), 10);
        if (isNaN(index)) return;

        if (target.classList.contains('arith-op-type')) {
          this._operations[index].type = target.value;
        } else if (target.classList.contains('arith-op-unit')) {
          this._operations[index].unit = target.value;
        }
      });

      opsContainer.addEventListener('input', (e) => {
        const target = e.target;
        const index = parseInt(target.getAttribute('data-index'), 10);
        if (isNaN(index)) return;

        if (target.classList.contains('arith-op-value')) {
          this._operations[index].value = target.value;
        }
      });

      opsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn--remove-op');
        if (removeBtn) {
          const index = parseInt(removeBtn.getAttribute('data-index'), 10);
          this._removeOperationRow(index);
        }
      });
    }

    // Add operation button
    const addOpBtn = document.getElementById('arith-add-operation');
    if (addOpBtn) {
      addOpBtn.addEventListener('click', () => {
        this._addOperationRow();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('arith-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this._clearForm();
      });
    }

    // Business days toggle
    const bizDaysToggle = document.getElementById('arith-business-days');
    if (bizDaysToggle) {
      bizDaysToggle.addEventListener('change', (e) => {
        this._useBusinessDays = e.target.checked;
      });
    }
  },

  /**
   * Add a new empty operation row (up to MAX_OPERATIONS).
   */
  _addOperationRow() {
    if (this._operations.length >= MAX_OPERATIONS) return;

    this._operations.push({ type: 'add', unit: 'days', value: '' });
    this._refreshOperationsUI();
  },

  /**
   * Remove an operation row by index.
   * @param {number} index - The index of the row to remove
   */
  _removeOperationRow(index) {
    if (this._operations.length <= 1) return;

    this._operations.splice(index, 1);
    this._refreshOperationsUI();
  },

  /**
   * Refresh the operations container and add-button state.
   */
  _refreshOperationsUI() {
    const opsContainer = document.getElementById('arith-operations-container');
    if (opsContainer) {
      opsContainer.innerHTML = this._renderOperationRows();
    }

    const addBtn = document.getElementById('arith-add-operation');
    if (addBtn) {
      addBtn.disabled = this._operations.length >= MAX_OPERATIONS;
    }

    const countEl = this._calculatorCard.querySelector('.arith-op-count');
    if (countEl) {
      countEl.textContent = `${this._operations.length}/${MAX_OPERATIONS}`;
    }
  },

  /**
   * Perform the calculation with all chained operations.
   * 1. Validate start date
   * 2. Validate all operations
   * 3. Apply operations sequentially
   * 4. Handle month-end overflow (auto-capped by addToDate)
   * 5. Render result
   */
  calculate() {
    this._clearAllErrors();

    // 1. Validate start date using DateInputComponent
    const startDateValue = DateInputComponent.getValue('arith-start-date');

    if (!startDateValue) {
      DateInputComponent.showError('arith-start-date', 'Start date is required');
      this._hideResult();
      return;
    }

    const startValidation = validateDate(startDateValue.year, startDateValue.month, startDateValue.day);
    if (!startValidation.valid) {
      DateInputComponent.showError('arith-start-date', startValidation.error);
      this._hideResult();
      return;
    }

    // 2. Sync and validate all operations from current DOM values
    this._syncOperationsFromDOM();
    const validatedOps = [];
    let hasError = false;

    for (let i = 0; i < this._operations.length; i++) {
      const op = this._operations[i];
      const valResult = validateNumericInput(op.value, {
        min: 0,
        integer: true,
        fieldName: `Operation ${i + 1} value`
      });

      if (!valResult.valid) {
        this._showOperationError(i, valResult.error);
        hasError = true;
      } else {
        validatedOps.push({
          type: op.type,
          unit: op.unit,
          value: valResult.value
        });
      }
    }

    if (hasError) {
      this._hideResult();
      return;
    }

    // 3. Apply operations sequentially
    let currentDate = { ...startDateValue };
    const appliedOps = [];

    for (const op of validatedOps) {
      if (op.value === 0) {
        appliedOps.push({ ...op, skipped: true });
        continue;
      }

      const useBusinessDays = this._useBusinessDays && (op.unit === 'days');

      if (useBusinessDays) {
        // Use business day arithmetic for day-based operations
        const direction = op.type === 'add' ? 1 : -1;
        const businessDays = op.value * direction;
        currentDate = addBusinessDays(currentDate, businessDays);
      } else {
        // Standard date arithmetic
        const offset = { [op.unit]: op.value };
        if (op.type === 'add') {
          currentDate = addToDate(currentDate, offset);
        } else {
          currentDate = subtractFromDate(currentDate, offset);
        }
      }

      appliedOps.push({ ...op, skipped: false });
    }

    // 4. Render result
    this._renderResult(startDateValue, currentDate, appliedOps);
  },

  /**
   * Sync operation values from the DOM into the _operations array.
   * Needed because input values may not have triggered a change event yet.
   */
  _syncOperationsFromDOM() {
    const opsContainer = document.getElementById('arith-operations-container');
    if (!opsContainer) return;

    const typeSelects = opsContainer.querySelectorAll('.arith-op-type');
    const valueInputs = opsContainer.querySelectorAll('.arith-op-value');
    const unitSelects = opsContainer.querySelectorAll('.arith-op-unit');

    typeSelects.forEach((el, i) => {
      if (this._operations[i]) {
        this._operations[i].type = el.value;
      }
    });

    valueInputs.forEach((el, i) => {
      if (this._operations[i]) {
        this._operations[i].value = el.value;
      }
    });

    unitSelects.forEach((el, i) => {
      if (this._operations[i]) {
        this._operations[i].unit = el.value;
      }
    });
  },

  /**
   * Render the calculation result with start date, result date, and operation chain.
   * @param {Object} startDate - The original start date
   * @param {Object} resultDate - The final calculated date
   * @param {Array} operations - The applied operations
   */
  _renderResult(startDate, resultDate, operations) {
    if (!this._resultCard) return;

    const startDayName = getDayOfWeekName(startDate.year, startDate.month, startDate.day);
    const resultDayName = getDayOfWeekName(resultDate.year, resultDate.month, resultDate.day);
    const startFormatted = formatDate(startDate, 'MM/DD/YYYY');
    const resultFormatted = formatDate(resultDate, 'MM/DD/YYYY');

    // Build operations chain display
    const opsDisplay = operations
      .filter(op => !op.skipped)
      .map(op => {
        const sign = op.type === 'add' ? '+' : '-';
        const unitLabel = op.value === 1 ? op.unit.slice(0, -1) : op.unit;
        const bizLabel = (this._useBusinessDays && op.unit === 'days') ? ' (business)' : '';
        return `<span class="arith-op-badge arith-op-badge--${op.type}">${sign} ${op.value} ${unitLabel}${bizLabel}</span>`;
      })
      .join(' ');

    this._resultCard.innerHTML = `
      <div class="result-header animate-fade-in">
        <div class="result-total">
          <span class="result-label">Result Date</span>
          <h2 class="result-value result-date-value">${resultFormatted}</h2>
          <span class="result-day-name">${resultDayName}</span>
        </div>
      </div>

      <div class="result-timeline animate-slide-up stagger-1">
        <div class="arith-timeline">
          <div class="arith-timeline-start">
            <span class="arith-timeline-date">${startFormatted}</span>
            <span class="arith-timeline-day">${startDayName}</span>
          </div>
          <div class="arith-timeline-arrow">
            <span class="arith-timeline-ops">${opsDisplay || '<span class="arith-op-badge">No changes</span>'}</span>
            <span class="arith-timeline-arrow-icon">&#x27A1;</span>
          </div>
          <div class="arith-timeline-end">
            <span class="arith-timeline-date">${resultFormatted}</span>
            <span class="arith-timeline-day">${resultDayName}</span>
          </div>
        </div>
      </div>

      <div class="result-details animate-slide-up stagger-2">
        <h3 class="result-section-title">Operations Applied</h3>
        <ol class="arith-operations-list">
          ${operations.map((op, i) => {
            if (op.skipped) {
              return `<li class="arith-op-list-item arith-op-list-item--skipped">
                <span class="arith-op-list-num">${i + 1}.</span>
                <span>${op.type === 'add' ? 'Add' : 'Subtract'} 0 ${op.unit} (skipped)</span>
              </li>`;
            }
            const bizLabel = (this._useBusinessDays && op.unit === 'days') ? ' (business days)' : '';
            return `<li class="arith-op-list-item">
              <span class="arith-op-list-num">${i + 1}.</span>
              <span>${op.type === 'add' ? 'Add' : 'Subtract'} ${op.value} ${op.value === 1 ? op.unit.slice(0, -1) : op.unit}${bizLabel}</span>
            </li>`;
          }).join('')}
        </ol>
      </div>

      ${this._useBusinessDays ? `
      <div class="result-note animate-slide-up stagger-3">
        <span class="badge badge--info">Business days mode: weekends skipped for day-based operations</span>
      </div>` : ''}
    `;

    this._resultCard.hidden = false;
    this._resultCard.classList.add('animate-scale-in', 'glass-card');
  },

  /**
   * Show a validation error for the start date field.
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
   * Show an error message for a specific operation row.
   * @param {number} index - The operation row index
   * @param {string} message - The error message
   */
  _showOperationError(index, message) {
    const opsContainer = document.getElementById('arith-operations-container');
    if (!opsContainer) return;

    const row = opsContainer.querySelector(`[data-index="${index}"].arith-operation-row`);
    if (row) {
      const valueInput = row.querySelector('.arith-op-value');
      if (valueInput) {
        valueInput.classList.add('input-field--error');
      }
      // Add error message below the row if not already present
      let errorEl = row.querySelector('.arith-op-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message arith-op-error';
        errorEl.setAttribute('role', 'alert');
        row.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
  },

  /**
   * Clear all error states from the form.
   */
  _clearAllErrors() {
    // Clear start date error via DateInputComponent
    DateInputComponent.clearError('arith-start-date');

    // Clear operation row errors
    const opsContainer = document.getElementById('arith-operations-container');
    if (opsContainer) {
      const errorInputs = opsContainer.querySelectorAll('.input-field--error');
      errorInputs.forEach(el => el.classList.remove('input-field--error'));
      const errorMessages = opsContainer.querySelectorAll('.arith-op-error');
      errorMessages.forEach(el => {
        el.textContent = '';
        el.hidden = true;
      });
    }
  },

  /**
   * Hide the result card.
   */
  _hideResult() {
    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.classList.remove('animate-scale-in');
    }
  },

  /**
   * Reset the form to its initial state.
   */
  _clearForm() {
    // Clear the DateInputComponent fields
    DateInputComponent.setValue('arith-start-date', { year: '', month: '', day: '' });
    DateInputComponent.clearError('arith-start-date');

    this._operations = [{ type: 'add', unit: 'days', value: '' }];
    this._useBusinessDays = false;

    this._clearAllErrors();
    this._refreshOperationsUI();

    // Reset business days toggle
    const bizDaysToggle = document.getElementById('arith-business-days');
    if (bizDaysToggle) bizDaysToggle.checked = false;

    // Hide result
    if (this._resultCard) {
      this._resultCard.hidden = true;
      this._resultCard.innerHTML = '';
      this._resultCard.classList.remove('animate-scale-in', 'glass-card');
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ArithmeticCalculator.init());
} else {
  ArithmeticCalculator.init();
}

export default ArithmeticCalculator;
