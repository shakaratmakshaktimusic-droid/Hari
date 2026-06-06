/**
 * BatchCalculator - Process multiple date calculations simultaneously.
 * Supports mixing calculation types, export to CSV/JSON.
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */
import { parseDate, formatDate } from '../core/date-parser.js';
import { calculateDuration, addToDate, countBusinessDays, getDayOfWeekName } from '../core/date-calc.js';
import { validateDateInput } from '../core/validators.js';

const BatchCalculator = {
  MAX_ROWS: 50,
  _rows: [],

  init() {
    this._calculatorCard = document.getElementById('calculator-card');
    this._resultCard = document.getElementById('result-card');
    if (!this._calculatorCard) return;

    this._rows = [this._createEmptyRow()];
    this._render();
    this._bindEvents();
  },

  _createEmptyRow() {
    return {
      id: 'row-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type: 'duration',
      inputs: { startDate: '', endDate: '' },
      result: null,
      error: null
    };
  },

  _render() {
    // Render form with:
    // - Table header (Type | Input 1 | Input 2 | Actions)
    // - Rows with type selector + inputs
    // - Add Row / Remove Row / Duplicate buttons
    // - Process All button
    // - Export CSV/JSON buttons
    this._calculatorCard.innerHTML = `
      <div class="batch-header">
        <h3 class="batch-title">Batch Calculations</h3>
        <span class="batch-row-count">${this._rows.length}/${this.MAX_ROWS} rows</span>
      </div>
      <div class="batch-table-wrapper">
        <table class="batch-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Input 1</th>
              <th>Input 2</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="batch-rows">
            ${this._rows.map((row, i) => this._renderRow(row, i)).join('')}
          </tbody>
        </table>
      </div>
      <div class="batch-controls">
        <button type="button" class="btn btn--secondary" id="batch-add-row" ${this._rows.length >= this.MAX_ROWS ? 'disabled' : ''}>+ Add Row</button>
        <button type="button" class="btn btn--primary" id="batch-process">Process All</button>
      </div>
    `;
  },

  _renderRow(row, index) {
    return `
      <tr data-row-id="${row.id}" class="${row.error ? 'batch-row--error' : ''} ${row.result ? 'batch-row--success' : ''}">
        <td>${index + 1}</td>
        <td>
          <select class="input-field batch-type-select" data-index="${index}">
            <option value="duration" ${row.type === 'duration' ? 'selected' : ''}>Duration</option>
            <option value="day-of-week" ${row.type === 'day-of-week' ? 'selected' : ''}>Day of Week</option>
            <option value="add-days" ${row.type === 'add-days' ? 'selected' : ''}>Add Days</option>
            <option value="business-days" ${row.type === 'business-days' ? 'selected' : ''}>Business Days</option>
          </select>
        </td>
        <td><input class="input-field glass-input batch-input-1" data-index="${index}" placeholder="Start date" value="${row.inputs.startDate || ''}" /></td>
        <td><input class="input-field glass-input batch-input-2" data-index="${index}" placeholder="End date / days" value="${row.inputs.endDate || ''}" /></td>
        <td class="batch-actions">
          <button type="button" class="btn btn--ghost batch-duplicate" data-index="${index}" title="Duplicate">&#x2398;</button>
          <button type="button" class="btn btn--ghost batch-remove" data-index="${index}" title="Remove">&#x2715;</button>
        </td>
      </tr>
      ${row.result ? `<tr class="batch-result-row"><td colspan="5"><span class="batch-result">${row.result}</span></td></tr>` : ''}
      ${row.error ? `<tr class="batch-error-row"><td colspan="5"><span class="error-message">${row.error}</span></td></tr>` : ''}
    `;
  },

  _bindEvents() {
    const addBtn = document.getElementById('batch-add-row');
    if (addBtn) addBtn.addEventListener('click', () => this._addRow());

    const processBtn = document.getElementById('batch-process');
    if (processBtn) processBtn.addEventListener('click', () => this.process());

    // Delegation for row actions
    const tbody = document.getElementById('batch-rows');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const dupBtn = e.target.closest('.batch-duplicate');
        if (dupBtn) this._duplicateRow(parseInt(dupBtn.dataset.index));
        const remBtn = e.target.closest('.batch-remove');
        if (remBtn) this._removeRow(parseInt(remBtn.dataset.index));
      });
      tbody.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (isNaN(idx)) return;
        if (e.target.classList.contains('batch-type-select')) this._rows[idx].type = e.target.value;
        if (e.target.classList.contains('batch-input-1')) this._rows[idx].inputs.startDate = e.target.value;
      });
      tbody.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (isNaN(idx)) return;
        if (e.target.classList.contains('batch-input-1')) this._rows[idx].inputs.startDate = e.target.value;
        if (e.target.classList.contains('batch-input-2')) this._rows[idx].inputs.endDate = e.target.value;
      });
    }
  },

  _addRow() {
    if (this._rows.length >= this.MAX_ROWS) return;
    this._rows.push(this._createEmptyRow());
    this._render();
    this._bindEvents();
  },

  _removeRow(index) {
    if (this._rows.length <= 1) return;
    this._rows.splice(index, 1);
    this._render();
    this._bindEvents();
  },

  _duplicateRow(index) {
    if (this._rows.length >= this.MAX_ROWS) return;
    const clone = {
      ...this._rows[index],
      id: 'row-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      result: null,
      error: null,
      inputs: { ...this._rows[index].inputs }
    };
    this._rows.splice(index + 1, 0, clone);
    this._render();
    this._bindEvents();
  },

  /**
   * Process all rows. Invalid rows get flagged, valid rows get results.
   * @returns {Array}
   */
  process() {
    const results = [];

    this._rows.forEach((row, i) => {
      row.result = null;
      row.error = null;

      try {
        const result = this._processRow(row);
        row.result = result;
        results.push({ rowId: row.id, success: true, result });
      } catch (e) {
        row.error = e.message || 'Calculation error';
        results.push({ rowId: row.id, success: false, error: row.error });
      }
    });

    this._render();
    this._bindEvents();
    this._renderExportButtons(results);
    return results;
  },

  _processRow(row) {
    const { type, inputs } = row;

    switch (type) {
      case 'duration': {
        const startVal = validateDateInput(inputs.startDate, 'Start');
        if (!startVal.valid) throw new Error(startVal.error);
        const endVal = validateDateInput(inputs.endDate, 'End');
        if (!endVal.valid) throw new Error(endVal.error);
        const result = calculateDuration(startVal.date, endVal.date);
        return `${result.totalDays} days (${result.breakdown.years}y ${result.breakdown.months}m ${result.breakdown.weeks}w ${result.breakdown.days}d)`;
      }
      case 'day-of-week': {
        const val = validateDateInput(inputs.startDate, 'Date');
        if (!val.valid) throw new Error(val.error);
        return getDayOfWeekName(val.date.year, val.date.month, val.date.day);
      }
      case 'add-days': {
        const startVal = validateDateInput(inputs.startDate, 'Start');
        if (!startVal.valid) throw new Error(startVal.error);
        const days = parseInt(inputs.endDate);
        if (isNaN(days)) throw new Error('Enter number of days');
        const result = addToDate(startVal.date, { days });
        return `${formatDate(result)} (${getDayOfWeekName(result.year, result.month, result.day)})`;
      }
      case 'business-days': {
        const startVal = validateDateInput(inputs.startDate, 'Start');
        if (!startVal.valid) throw new Error(startVal.error);
        const endVal = validateDateInput(inputs.endDate, 'End');
        if (!endVal.valid) throw new Error(endVal.error);
        const result = countBusinessDays(startVal.date, endVal.date);
        return `${result} business days`;
      }
      default:
        throw new Error('Unknown calculation type');
    }
  },

  _renderExportButtons(results) {
    const validResults = results.filter(r => r.success);
    if (validResults.length === 0) return;

    if (!this._resultCard) return;
    this._resultCard.innerHTML = `
      <div class="batch-export">
        <h3 class="result-section-title">Export Results (${validResults.length} successful)</h3>
        <div class="form-actions">
          <button type="button" class="btn btn--secondary" id="batch-export-csv">Export CSV</button>
          <button type="button" class="btn btn--secondary" id="batch-export-json">Export JSON</button>
        </div>
      </div>
    `;
    this._resultCard.hidden = false;

    document.getElementById('batch-export-csv')?.addEventListener('click', () => this._exportCSV());
    document.getElementById('batch-export-json')?.addEventListener('click', () => this._exportJSON());
  },

  _exportCSV() {
    const lines = ['Type,Input1,Input2,Result'];
    this._rows.forEach(row => {
      if (row.result) {
        lines.push(`"${row.type}","${row.inputs.startDate}","${row.inputs.endDate}","${row.result}"`);
      }
    });
    this._downloadFile(lines.join('\n'), 'batch-results.csv', 'text/csv');
  },

  _exportJSON() {
    const data = this._rows.filter(r => r.result).map(row => ({
      type: row.type,
      inputs: row.inputs,
      result: row.result
    }));
    this._downloadFile(JSON.stringify(data, null, 2), 'batch-results.json', 'application/json');
  },

  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export default BatchCalculator;
