/**
 * ThemeManager - Dark/Light mode toggle and persistence
 * Detects OS preference, persists choice, applies smooth transition.
 *
 * Requirements covered: 19.1, 19.2, 19.3, 19.4, 19.5
 */

const ThemeManager = {
  STORAGE_KEY: 'date-calc-theme',
  TRANSITION_DURATION: 300, // ms
  TRANSITION_CLASS: 'theme-transitioning',

  /**
   * Initializes theme based on stored preference or OS setting.
   * Called first thing on page load to prevent FOUC (flash of unstyled content).
   */
  init() {
    // 1. Determine the theme to apply
    const saved = this._getStoredTheme();
    const theme = saved || this.getOSPreference();

    // 2. Apply the determined theme immediately (no transition on init)
    this.apply(theme);

    // 3. Set up toggle button event listener
    this._setupToggleButton();

    // 4. Listen for OS preference changes (in case user changes system theme)
    this._setupMediaQueryListener();
  },

  /**
   * Toggles between light and dark themes.
   * Applies CSS transition and persists choice.
   */
  toggle() {
    const current = this.getCurrent();
    const next = current === 'dark' ? 'light' : 'dark';

    // Enable transition class for smooth switching
    this._enableTransition();

    // Apply new theme
    this.apply(next);

    // Persist choice
    this._persistTheme(next);

    // Remove transition class after duration
    setTimeout(() => {
      this._disableTransition();
    }, this.TRANSITION_DURATION);
  },

  /**
   * Applies the specified theme to the document.
   * @param {'light' | 'dark'} theme
   */
  apply(theme) {
    // Validate theme value
    const validTheme = theme === 'dark' ? 'dark' : 'light';

    // Set data-theme attribute on <html> element
    document.documentElement.setAttribute('data-theme', validTheme);

    // Update meta theme-color for browser chrome
    this._updateMetaThemeColor(validTheme);

    // Update toggle button visual state
    this._updateToggleButton(validTheme);
  },

  /**
   * Gets the current theme.
   * @returns {'light' | 'dark'}
   */
  getCurrent() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /**
   * Gets OS preference.
   * @returns {'light' | 'dark'}
   */
  getOSPreference() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  },

  // ─── Private Methods ─────────────────────────────────────────────────

  /**
   * Retrieves the stored theme preference from localStorage.
   * Returns null if not available or localStorage is inaccessible.
   * @returns {string|null}
   * @private
   */
  _getStoredTheme() {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      return null;
    } catch (e) {
      // localStorage may be unavailable (private browsing, disabled, quota exceeded)
      return null;
    }
  },

  /**
   * Persists the theme choice to localStorage.
   * Fails silently if localStorage is unavailable.
   * @param {'light' | 'dark'} theme
   * @private
   */
  _persistTheme(theme) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, theme);
      }
    } catch (e) {
      // Silently fail if localStorage is unavailable
    }
  },

  /**
   * Adds the transition-enabling CSS class to the document.
   * This class enables CSS transitions for theme properties.
   * @private
   */
  _enableTransition() {
    document.documentElement.classList.add(this.TRANSITION_CLASS);
  },

  /**
   * Removes the transition-enabling CSS class from the document.
   * @private
   */
  _disableTransition() {
    document.documentElement.classList.remove(this.TRANSITION_CLASS);
  },

  /**
   * Updates the meta theme-color tag for browser chrome styling.
   * Creates the tag if it doesn't exist.
   * @param {'light' | 'dark'} theme
   * @private
   */
  _updateMetaThemeColor(theme) {
    if (typeof document === 'undefined') return;

    const colors = {
      light: '#ffffff',
      dark: '#1a1a2e'
    };

    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      const head = document.head || document.querySelector('head');
      if (head) {
        head.appendChild(metaTag);
      }
    }
    if (metaTag) {
      metaTag.setAttribute('content', colors[theme] || colors.light);
    }
  },

  /**
   * Sets up the toggle button event listener.
   * Looks for an element with id="theme-toggle".
   * @private
   */
  _setupToggleButton() {
    if (typeof document === 'undefined') return;

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * Updates the toggle button's visual state (aria-label and icon).
   * @param {'light' | 'dark'} theme
   * @private
   */
  _updateToggleButton(theme) {
    if (typeof document === 'undefined') return;

    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    if (theme === 'dark') {
      toggleBtn.setAttribute('aria-label', 'Switch to light mode');
      toggleBtn.innerHTML = '<span class="theme-icon" aria-hidden="true">&#9788;</span>'; // Sun symbol
    } else {
      toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      toggleBtn.innerHTML = '<span class="theme-icon" aria-hidden="true">&#9790;</span>'; // Moon symbol
    }
  },

  /**
   * Listens for OS-level preference changes and applies if no user preference is stored.
   * @private
   */
  _setupMediaQueryListener() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only auto-switch if the user hasn't explicitly set a preference
      const stored = this._getStoredTheme();
      if (!stored) {
        const newTheme = e.matches ? 'dark' : 'light';
        this._enableTransition();
        this.apply(newTheme);
        setTimeout(() => this._disableTransition(), this.TRANSITION_DURATION);
      }
    };

    // Use addEventListener if available (modern browsers), fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    }
  }
};

export default ThemeManager;
