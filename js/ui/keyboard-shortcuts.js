/**
 * KeyboardShortcutManager - Global keyboard shortcut system
 * Registers shortcuts, detects conflicts with browser defaults,
 * provides a help overlay listing all available shortcuts.
 *
 * Requirements covered: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

const KeyboardShortcutManager = {
  /** @type {Map<string, {handler: Function, description: string}>} */
  shortcuts: new Map(),

  /** Whether the help overlay is currently visible */
  _isHelpVisible: false,

  /** @type {HTMLElement|null} */
  _helpOverlay: null,

  /**
   * Browser default shortcuts that must never be overridden.
   * These are normalized to a canonical format (modifiers sorted alphabetically).
   */
  BROWSER_CONFLICTS: new Set([
    'Ctrl+D', 'Ctrl+F', 'Ctrl+G', 'Ctrl+H', 'Ctrl+J',
    'Ctrl+L', 'Ctrl+N', 'Ctrl+P', 'Ctrl+R', 'Ctrl+S',
    'Ctrl+T', 'Ctrl+Tab', 'Ctrl+U', 'Ctrl+W',
    'Ctrl+Shift+Tab',
    'F5', 'F11', 'F12'
  ]),

  /**
   * Initializes the shortcut manager.
   * Registers default application shortcuts and attaches the global keydown listener.
   */
  init() {
    // Register default shortcuts for page navigation (Alt+1 through Alt+8)
    const pages = [
      { key: 'Alt+1', page: 'index.html', desc: 'Go to Day-of-Week Calculator' },
      { key: 'Alt+2', page: 'duration.html', desc: 'Go to Duration Calculator' },
      { key: 'Alt+3', page: 'weekday.html', desc: 'Go to Weekday Calculator' },
      { key: 'Alt+4', page: 'arithmetic.html', desc: 'Go to Date Arithmetic' },
      { key: 'Alt+5', page: 'business-days.html', desc: 'Go to Business Days' },
      { key: 'Alt+6', page: 'week-number.html', desc: 'Go to Week Number' },
      { key: 'Alt+7', page: 'countdown.html', desc: 'Go to Countdown Timer' },
      { key: 'Alt+8', page: 'timezone.html', desc: 'Go to Time Zone Converter' }
    ];

    pages.forEach(({ key, page, desc }) => {
      this.register(key, () => {
        window.location.href = page;
      }, desc);
    });

    // Ctrl+Enter triggers the calculate action on the current page
    this.register('Ctrl+Enter', () => {
      const calcBtn = document.querySelector('[data-action="calculate"], .btn--primary, #calculate-btn');
      if (calcBtn) {
        calcBtn.click();
      }
    }, 'Trigger calculation');

    // Ctrl+Shift+D toggles dark mode
    this.register('Ctrl+Shift+D', () => {
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.click();
      }
    }, 'Toggle dark/light mode');

    // Attach global keydown listener
    document.addEventListener('keydown', (e) => this._handleKeyDown(e));
  },

  /**
   * Registers a keyboard shortcut.
   * @param {string} combo - Key combination (e.g., 'Alt+1', 'Ctrl+Enter')
   * @param {Function} handler - Callback to execute when shortcut is triggered
   * @param {string} description - Human-readable description for help overlay
   * @returns {boolean} true if registered, false if conflicts with browser default
   */
  register(combo, handler, description) {
    const normalized = this._normalizeCombo(combo);

    if (this.hasConflict(normalized)) {
      console.warn(`[KeyboardShortcuts] Cannot register "${combo}" — conflicts with browser default.`);
      return false;
    }

    this.shortcuts.set(normalized, { handler, description });
    return true;
  },

  /**
   * Unregisters a keyboard shortcut.
   * @param {string} combo - Key combination to remove
   * @returns {boolean} true if removed, false if not found
   */
  unregister(combo) {
    const normalized = this._normalizeCombo(combo);
    return this.shortcuts.delete(normalized);
  },

  /**
   * Returns all registered shortcuts as an array of {combo, description}.
   * @returns {Array<{combo: string, description: string}>}
   */
  getAll() {
    const result = [];
    this.shortcuts.forEach((value, key) => {
      result.push({ combo: key, description: value.description });
    });
    return result;
  },

  /**
   * Checks if a key combo conflicts with known browser defaults.
   * @param {string} combo - Normalized key combination
   * @returns {boolean} true if conflicts
   */
  hasConflict(combo) {
    const normalized = this._normalizeCombo(combo);
    return this.BROWSER_CONFLICTS.has(normalized);
  },

  /**
   * Shows the keyboard shortcut help overlay.
   * @private
   */
  _showHelp() {
    if (this._isHelpVisible) return;
    this._isHelpVisible = true;

    // Create overlay if it doesn't exist
    if (!this._helpOverlay) {
      this._helpOverlay = this._createHelpOverlay();
      document.body.appendChild(this._helpOverlay);
    }

    // Populate the shortcut list
    this._populateHelpContent();

    // Show with animation
    this._helpOverlay.classList.add('shortcut-help--visible');
    this._helpOverlay.setAttribute('aria-hidden', 'false');

    // Focus trap: focus the close button
    const closeBtn = this._helpOverlay.querySelector('.shortcut-help__close');
    if (closeBtn) {
      closeBtn.focus();
    }
  },

  /**
   * Hides the keyboard shortcut help overlay.
   * @private
   */
  _hideHelp() {
    if (!this._isHelpVisible) return;
    this._isHelpVisible = false;

    if (this._helpOverlay) {
      this._helpOverlay.classList.remove('shortcut-help--visible');
      this._helpOverlay.setAttribute('aria-hidden', 'true');
    }
  },

  /**
   * Handles keydown events and dispatches to registered handlers.
   * @param {KeyboardEvent} e
   * @private
   */
  _handleKeyDown(e) {
    // "?" key (no modifier, no input focused) shows help overlay
    if (e.key === '?' && !this._isInputFocused()) {
      e.preventDefault();
      if (this._isHelpVisible) {
        this._hideHelp();
      } else {
        this._showHelp();
      }
      return;
    }

    // Escape closes help overlay
    if (e.key === 'Escape' && this._isHelpVisible) {
      e.preventDefault();
      this._hideHelp();
      return;
    }

    // Build combo string from event
    const combo = this._eventToCombo(e);
    if (!combo) return;

    const entry = this.shortcuts.get(combo);
    if (entry) {
      e.preventDefault();
      e.stopPropagation();
      try {
        entry.handler();
      } catch (err) {
        console.error(`[KeyboardShortcuts] Error executing handler for "${combo}":`, err);
      }
    }
  },

  /**
   * Converts a KeyboardEvent to a normalized combo string.
   * @param {KeyboardEvent} e
   * @returns {string|null} Normalized combo or null if it's just a modifier key
   * @private
   */
  _eventToCombo(e) {
    const key = e.key;

    // Ignore standalone modifier key presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      return null;
    }

    const parts = [];
    if (e.altKey) parts.push('Alt');
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');

    // Normalize key names
    let normalizedKey = key;
    if (key === 'Enter') normalizedKey = 'Enter';
    else if (key === ' ') normalizedKey = 'Space';
    else if (key.length === 1) normalizedKey = key.toUpperCase();
    else normalizedKey = key; // F1, Tab, Escape, etc.

    parts.push(normalizedKey);
    return parts.join('+');
  },

  /**
   * Normalizes a combo string to a canonical format.
   * Modifiers are sorted: Alt, Ctrl, Shift, then the key.
   * @param {string} combo
   * @returns {string}
   * @private
   */
  _normalizeCombo(combo) {
    const parts = combo.split('+').map(p => p.trim());
    const modifiers = [];
    let key = '';

    const modifierSet = new Set(['Alt', 'Ctrl', 'Shift', 'Meta']);

    parts.forEach(part => {
      // Normalize Meta to Ctrl for cross-platform
      const normalized = part === 'Meta' ? 'Ctrl' : part;
      if (modifierSet.has(normalized)) {
        modifiers.push(normalized);
      } else {
        key = normalized;
      }
    });

    // Sort modifiers alphabetically for consistent lookup
    modifiers.sort();
    if (key) modifiers.push(key);
    return modifiers.join('+');
  },

  /**
   * Checks if an input/textarea/select element is currently focused.
   * @returns {boolean}
   * @private
   */
  _isInputFocused() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || active.isContentEditable;
  },

  /**
   * Creates the help overlay DOM element.
   * @returns {HTMLElement}
   * @private
   */
  _createHelpOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'shortcut-help';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Keyboard shortcuts');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="shortcut-help__backdrop"></div>
      <div class="shortcut-help__panel">
        <div class="shortcut-help__header">
          <h2 class="shortcut-help__title">Keyboard Shortcuts</h2>
          <button class="shortcut-help__close" aria-label="Close shortcuts panel">&times;</button>
        </div>
        <div class="shortcut-help__body">
          <ul class="shortcut-help__list"></ul>
        </div>
        <div class="shortcut-help__footer">
          <span class="shortcut-help__hint">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</span>
        </div>
      </div>
    `;

    // Close on backdrop click
    const backdrop = overlay.querySelector('.shortcut-help__backdrop');
    backdrop.addEventListener('click', () => this._hideHelp());

    // Close on button click
    const closeBtn = overlay.querySelector('.shortcut-help__close');
    closeBtn.addEventListener('click', () => this._hideHelp());

    return overlay;
  },

  /**
   * Populates the help overlay with current shortcuts.
   * @private
   */
  _populateHelpContent() {
    if (!this._helpOverlay) return;

    const list = this._helpOverlay.querySelector('.shortcut-help__list');
    if (!list) return;

    const shortcuts = this.getAll();
    list.innerHTML = shortcuts.map(({ combo, description }) => `
      <li class="shortcut-help__item">
        <kbd class="shortcut-help__key">${this._formatComboDisplay(combo)}</kbd>
        <span class="shortcut-help__desc">${description}</span>
      </li>
    `).join('');

    // Add the "?" shortcut itself
    list.innerHTML += `
      <li class="shortcut-help__item">
        <kbd class="shortcut-help__key">?</kbd>
        <span class="shortcut-help__desc">Show this help overlay</span>
      </li>
    `;
  },

  /**
   * Formats a combo string for display in the help overlay.
   * @param {string} combo
   * @returns {string}
   * @private
   */
  _formatComboDisplay(combo) {
    return combo.split('+').map(part => `<span>${part}</span>`).join(' + ');
  }
};

export default KeyboardShortcutManager;
