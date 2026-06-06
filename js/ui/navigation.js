/**
 * Navigation - Top navbar with active state and mobile drawer
 * Handles hamburger menu, active link detection, and responsive behavior.
 */

const Navigation = {
  /** @type {HTMLElement|null} */
  _navbar: null,
  /** @type {HTMLElement|null} */
  _hamburger: null,
  /** @type {HTMLElement|null} */
  _navLinks: null,
  /** @type {HTMLElement|null} */
  _overlay: null,
  /** @type {boolean} */
  _isDrawerOpen: false,

  /**
   * Initializes navbar: detects current page, sets active link,
   * sets up hamburger toggle and overlay click handler.
   */
  init() {
    // Cache DOM references
    this._navbar = document.getElementById('navbar');
    this._hamburger = document.getElementById('hamburger');
    this._navLinks = document.getElementById('nav-links');
    this._overlay = document.getElementById('nav-overlay');

    if (!this._navbar || !this._hamburger || !this._navLinks || !this._overlay) {
      return;
    }

    // 1. Detect current page from window.location
    const currentPage = this.getCurrentPage();

    // 2. Set active class on matching nav link
    this.setActive(currentPage);

    // 3. Set up hamburger button click handler
    this._hamburger.addEventListener('click', () => {
      this.toggleMobileDrawer();
    });

    // 4. Set up overlay click to close drawer
    this._overlay.addEventListener('click', () => {
      this.closeMobileDrawer();
    });

    // 5. Set up nav link clicks to close drawer on mobile
    const links = this._navLinks.querySelectorAll('.navbar__link');
    links.forEach((link) => {
      link.addEventListener('click', () => {
        if (this._isDrawerOpen) {
          this.closeMobileDrawer();
        }
      });
    });

    // 6. Handle escape key to close drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isDrawerOpen) {
        this.closeMobileDrawer();
      }
    });

    // Add mobile class to nav-links for responsive styling
    this._addMobileClass();
    window.addEventListener('resize', () => {
      this._addMobileClass();
    });
  },

  /**
   * Adds or removes the mobile class based on viewport width.
   * @private
   */
  _addMobileClass() {
    if (!this._navLinks) return;
    if (window.innerWidth <= 768) {
      this._navLinks.classList.add('navbar__links--mobile');
    } else {
      this._navLinks.classList.remove('navbar__links--mobile');
      // If resizing to desktop while drawer was open, close it
      if (this._isDrawerOpen) {
        this.closeMobileDrawer();
      }
    }
  },

  /**
   * Sets the active navigation item based on current page filename.
   * @param {string} pageFilename - e.g., 'index.html', 'duration.html'
   */
  setActive(pageFilename) {
    if (!this._navLinks) return;

    const links = this._navLinks.querySelectorAll('.navbar__link');

    // Remove all active classes
    links.forEach((link) => {
      link.classList.remove('navbar__link--active');
    });

    // Find matching link by href
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === pageFilename) {
        link.classList.add('navbar__link--active');
      }
    });
  },

  /**
   * Toggles mobile drawer open/closed.
   */
  toggleMobileDrawer() {
    if (this._isDrawerOpen) {
      this.closeMobileDrawer();
    } else {
      this.openMobileDrawer();
    }
  },

  /**
   * Opens mobile drawer.
   */
  openMobileDrawer() {
    if (!this._navLinks || !this._hamburger || !this._overlay) return;

    this._isDrawerOpen = true;

    // Toggle classes on nav-links, hamburger, overlay
    this._navLinks.classList.add('navbar__links--open');
    this._hamburger.classList.add('navbar__hamburger--active');
    this._overlay.classList.add('navbar__overlay--visible');

    // Toggle body scroll lock
    document.body.style.overflow = 'hidden';

    // Update aria attributes
    this._hamburger.setAttribute('aria-expanded', 'true');
    this._hamburger.setAttribute('aria-label', 'Close navigation menu');
  },

  /**
   * Closes mobile drawer.
   */
  closeMobileDrawer() {
    if (!this._navLinks || !this._hamburger || !this._overlay) return;

    this._isDrawerOpen = false;

    // Remove active classes
    this._navLinks.classList.remove('navbar__links--open');
    this._hamburger.classList.remove('navbar__hamburger--active');
    this._overlay.classList.remove('navbar__overlay--visible');

    // Restore body scroll
    document.body.style.overflow = '';

    // Update aria attributes
    this._hamburger.setAttribute('aria-expanded', 'false');
    this._hamburger.setAttribute('aria-label', 'Toggle navigation menu');
  },

  /**
   * Gets the current page filename.
   * @returns {string}
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
  }
};

export default Navigation;
