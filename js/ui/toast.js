/**
 * Toast - Lightweight notification toast system
 * Shows temporary messages at the bottom-right of the viewport.
 * Supports info, success, error, and warning types.
 *
 * Requirements covered: 12.4 (clipboard feedback), general UX
 */

const Toast = {
  /** @type {HTMLElement|null} */
  _container: null,

  /** Maximum number of visible toasts at once */
  MAX_VISIBLE: 5,

  /**
   * Initializes the toast system by creating the container.
   */
  init() {
    this._createContainer();
  },


  /**
   * Shows a toast notification.
   * @param {string} message - The message to display
   * @param {'info'|'success'|'error'|'warning'} type - Toast type
   * @param {number} duration - Auto-dismiss duration in ms (0 = manual)
   */
  show(message, type = 'info', duration = 3000) {
    if (!this._container) {
      this._createContainer();
    }

    const toast = this._createToastElement(message, type);
    this._container.appendChild(toast);

    // Enforce max visible limit
    this._enforceMaxVisible();

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => {
      toast.classList.add('toast--visible');
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this._dismiss(toast);
      }, duration);
    }

    return toast;
  },


  /**
   * Dismisses a specific toast with exit animation.
   * @param {HTMLElement} toast
   * @private
   */
  _dismiss(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.remove('toast--visible');
    toast.classList.add('toast--exiting');

    // Remove from DOM after animation completes
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, { once: true });

    // Fallback removal if transitionend doesn't fire
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  },


  /**
   * Creates the fixed-position toast container element.
   * @private
   */
  _createContainer() {
    if (this._container) return;

    this._container = document.createElement('div');
    this._container.className = 'toast-container';
    this._container.setAttribute('role', 'status');
    this._container.setAttribute('aria-live', 'polite');
    this._container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(this._container);
  },

  /**
   * Creates an individual toast DOM element.
   * @param {string} message
   * @param {string} type
   * @returns {HTMLElement}
   * @private
   */
  _createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');

    const icon = this._getIcon(type);

    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icon}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Dismiss">&times;</button>
    `;

    // Manual dismiss on close button
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => this._dismiss(toast));

    return toast;
  },


  /**
   * Returns the icon character for a toast type.
   * @param {string} type
   * @returns {string}
   * @private
   */
  _getIcon(type) {
    const icons = {
      info: '\u2139\uFE0F',     // i info
      success: '\u2705',        // checkmark
      error: '\u274C',          // cross
      warning: '\u26A0\uFE0F'   // warning sign
    };
    return icons[type] || icons.info;
  },

  /**
   * Ensures no more than MAX_VISIBLE toasts are shown.
   * Removes oldest toasts if limit exceeded.
   * @private
   */
  _enforceMaxVisible() {
    if (!this._container) return;
    const toasts = this._container.querySelectorAll('.toast');
    if (toasts.length > this.MAX_VISIBLE) {
      // Remove the oldest (first) toasts
      const excess = toasts.length - this.MAX_VISIBLE;
      for (let i = 0; i < excess; i++) {
        this._dismiss(toasts[i]);
      }
    }
  }
};

export default Toast;
