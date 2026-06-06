/**
 * HistoryManager - Calculation history tracking with CRUD operations.
 * Stores up to 500 entries in localStorage with FIFO eviction.
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 12.1, 12.2, 12.5, 12.6
 */

const HistoryManager = {
  MAX_ENTRIES: 500,
  STORAGE_KEY: 'date-calc-history',
  _entries: [],
  _initialized: false,

  /**
   * Initialize: load entries from localStorage.
   */
  init() {
    this._loadFromStorage();
    this._initialized = true;
  },

  /**
   * Add a calculation to history. Evicts oldest if at capacity.
   * @param {Object} entry - { type: string, inputs: Object, outputs: Object, tags?: string[] }
   */
  add(entry) {
    const historyEntry = {
      id: this._generateId(),
      type: entry.type,
      inputs: entry.inputs,
      outputs: entry.outputs,
      timestamp: Date.now(),
      tags: entry.tags || []
    };
    
    this._entries.unshift(historyEntry); // Add to beginning (most recent first)
    
    // FIFO eviction if over capacity
    if (this._entries.length > this.MAX_ENTRIES) {
      this._entries = this._entries.slice(0, this.MAX_ENTRIES);
    }
    
    this._saveToStorage();
    return historyEntry;
  },

  /**
   * Get all entries, optionally filtered by type.
   * Returns in reverse chronological order (newest first).
   * @param {string} [type] - Calculator type filter
   * @returns {Array}
   */
  getAll(type) {
    if (type) {
      return this._entries.filter(e => e.type === type);
    }
    return [...this._entries];
  },

  /**
   * Search entries by keyword (searches in type, inputs, outputs, tags).
   * @param {string} query
   * @returns {Array}
   */
  search(query) {
    if (!query || typeof query !== 'string') return [];
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    return this._entries.filter(entry => {
      const searchable = JSON.stringify(entry).toLowerCase();
      return searchable.includes(q);
    });
  },

  /**
   * Get a single entry by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this._entries.find(e => e.id === id) || null;
  },

  /**
   * Delete a single entry by ID.
   * @param {string} id
   * @returns {boolean} true if found and deleted
   */
  delete(id) {
    const index = this._entries.findIndex(e => e.id === id);
    if (index === -1) return false;
    this._entries.splice(index, 1);
    this._saveToStorage();
    return true;
  },

  /**
   * Delete all entries matching a tag, or all entries if no tag specified.
   * @param {string} [tag] - If provided, only delete entries with this tag
   * @returns {number} Number of entries deleted
   */
  clear(tag) {
    if (tag) {
      const before = this._entries.length;
      this._entries = this._entries.filter(e => !e.tags.includes(tag));
      const deleted = before - this._entries.length;
      this._saveToStorage();
      return deleted;
    }
    const deleted = this._entries.length;
    this._entries = [];
    this._saveToStorage();
    return deleted;
  },

  /**
   * Add a tag to an existing entry.
   * @param {string} id
   * @param {string} tag
   * @returns {boolean}
   */
  addTag(id, tag) {
    const entry = this.getById(id);
    if (!entry) return false;
    if (!entry.tags.includes(tag)) {
      entry.tags.push(tag);
      this._saveToStorage();
    }
    return true;
  },

  /**
   * Remove a tag from an entry.
   * @param {string} id
   * @param {string} tag
   * @returns {boolean}
   */
  removeTag(id, tag) {
    const entry = this.getById(id);
    if (!entry) return false;
    entry.tags = entry.tags.filter(t => t !== tag);
    this._saveToStorage();
    return true;
  },

  /**
   * Returns the current entry count.
   * @returns {number}
   */
  getCount() {
    return this._entries.length;
  },

  /**
   * Get all unique tags across all entries.
   * @returns {string[]}
   */
  getAllTags() {
    const tagSet = new Set();
    this._entries.forEach(e => e.tags.forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  },

  // --- Private Methods ---

  _generateId() {
    return 'h-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  },

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._entries = parsed.filter(e => 
            e && typeof e.id === 'string' && 
            typeof e.type === 'string' && 
            typeof e.timestamp === 'number'
          );
        }
      }
    } catch (e) {
      console.warn('[HistoryManager] Failed to load from localStorage:', e);
      this._entries = [];
    }
  },

  _saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._entries));
    } catch (e) {
      console.warn('[HistoryManager] Failed to save to localStorage:', e);
    }
  }
};

export default HistoryManager;
