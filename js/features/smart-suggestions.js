/**
 * SmartSuggestionEngine - AI-powered date suggestions based on usage patterns.
 * Analyzes calculation history to suggest frequently used dates and common upcoming dates.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

const SmartSuggestionEngine = {
  MAX_SUGGESTIONS: 5,
  STORAGE_KEY: 'date-calc-suggestions',
  _dismissed: [],
  _frequencies: {},

  init() {
    this._loadFromStorage();
  },

  /**
   * Generate up to 5 suggestions based on history and current context.
   * @param {string} partialInput - Current user input (for filtering)
   * @param {Array} history - History entries from HistoryManager
   * @returns {Array<{id, date, label, priority, source}>}
   */
  getSuggestions(partialInput, history) {
    const suggestions = [];

    // 1. Get common upcoming dates (end of month, end of quarter, holidays)
    suggestions.push(...this.getCommonDates());

    // 2. Get frequently used dates from history
    if (history && history.length > 0) {
      const frequent = this.analyzeFrequency(history);
      frequent.forEach(f => {
        suggestions.push({
          id: `freq-${f.dateStr}`,
          date: f.date,
          label: `Used ${f.count} times`,
          priority: f.count * 10,
          source: 'frequent'
        });
      });
    }

    // 3. Filter out dismissed suggestions
    const filtered = suggestions.filter(s => !this._dismissed.includes(s.id));

    // 4. Sort by priority descending and limit to MAX_SUGGESTIONS
    filtered.sort((a, b) => b.priority - a.priority);
    return filtered.slice(0, this.MAX_SUGGESTIONS);
  },

  /**
   * Dismiss a suggestion (reduce its priority in future).
   * @param {string} suggestionId
   */
  dismiss(suggestionId) {
    if (!this._dismissed.includes(suggestionId)) {
      this._dismissed.push(suggestionId);
      this._saveToStorage();
    }
  },

  /**
   * Get common upcoming dates (end of month, end of quarter, common holidays).
   * @returns {Array<{id, date, label, priority, source}>}
   */
  getCommonDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const dates = [];

    // End of current month
    const daysInMonth = new Date(year, month, 0).getDate();
    dates.push({
      id: `common-eom-${year}-${month}`,
      date: { year, month, day: daysInMonth },
      label: 'End of this month',
      priority: 30,
      source: 'common'
    });

    // End of quarter
    const quarterEndMonth = Math.ceil(month / 3) * 3;
    const quarterEndDay = new Date(year, quarterEndMonth, 0).getDate();
    if (quarterEndMonth !== month) {
      dates.push({
        id: `common-eoq-${year}-${quarterEndMonth}`,
        date: { year, month: quarterEndMonth, day: quarterEndDay },
        label: 'End of quarter',
        priority: 25,
        source: 'common'
      });
    }

    // End of year
    dates.push({
      id: `common-eoy-${year}`,
      date: { year, month: 12, day: 31 },
      label: 'End of year',
      priority: 20,
      source: 'common'
    });

    // New Year next year
    dates.push({
      id: `common-ny-${year + 1}`,
      date: { year: year + 1, month: 1, day: 1 },
      label: 'New Year',
      priority: 15,
      source: 'common'
    });

    return dates;
  },

  /**
   * Analyze history to find frequently used dates.
   * @param {Array} history - History entries
   * @returns {Array<{dateStr, date, count}>}
   */
  analyzeFrequency(history) {
    const freq = {};

    history.forEach(entry => {
      if (entry.inputs) {
        // Extract dates from inputs
        Object.values(entry.inputs).forEach(val => {
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            freq[val] = (freq[val] || 0) + 1;
          }
        });
      }
    });

    // Convert to sorted array, top 10
    return Object.entries(freq)
      .map(([dateStr, count]) => {
        const parts = dateStr.split('-');
        return {
          dateStr,
          date: { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) },
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this._dismissed = data.dismissed || [];
        this._frequencies = data.frequencies || {};
      }
    } catch (e) { /* silently fail */ }
  },

  _saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        dismissed: this._dismissed,
        frequencies: this._frequencies
      }));
    } catch (e) { /* silently fail */ }
  }
};

export default SmartSuggestionEngine;
