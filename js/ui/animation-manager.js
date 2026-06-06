/**
 * AnimationManager - Page-load and scroll-triggered animations
 * Uses IntersectionObserver for performant scroll-based reveals,
 * and provides staggered entrance animations on page load.
 *
 * Requirements covered: 2.3, 2.6
 */

const AnimationManager = {
  /** @type {IntersectionObserver|null} */
  _observer: null,

  /** Default stagger delay between elements (ms) */
  STAGGER_DELAY: 80,

  /** Animation duration CSS class prefix */
  ANIM_CLASS_PREFIX: 'anim--',


  /**
   * Initializes the AnimationManager.
   * Sets up IntersectionObserver for scroll-triggered animations.
   */
  init() {
    this._setupObserver();
  },

  /**
   * Triggers staggered entrance animations for all elements
   * with [data-animate] attribute on the page.
   */
  triggerPageLoad() {
    const elements = document.querySelectorAll('[data-animate]');
    if (elements.length === 0) return;

    elements.forEach((el, index) => {
      const animation = el.getAttribute('data-animate') || 'fadeIn';
      const customDelay = el.getAttribute('data-animate-delay');
      const delay = customDelay
        ? parseInt(customDelay, 10)
        : index * this.STAGGER_DELAY;

      this.animateElement(el, animation, delay);
    });
  },


  /**
   * Applies an animation class to a single element after a delay.
   * @param {HTMLElement} element - The DOM element to animate
   * @param {string} animation - Animation name (maps to CSS class)
   * @param {number} delay - Delay in ms before applying animation
   */
  animateElement(element, animation = 'fadeIn', delay = 0) {
    if (!element) return;

    // Start invisible
    element.style.opacity = '0';

    const applyAnimation = () => {
      element.classList.add(`${this.ANIM_CLASS_PREFIX}${animation}`);
      element.style.opacity = '';
    };

    if (delay > 0) {
      setTimeout(applyAnimation, delay);
    } else {
      applyAnimation();
    }
  },


  /**
   * Sets up IntersectionObserver to trigger animations when
   * elements with [data-animate-scroll] scroll into view.
   * @private
   */
  _setupObserver() {
    // Guard for environments without IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') return;

    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const animation = el.getAttribute('data-animate-scroll') || 'fadeIn';
            el.classList.add(`${this.ANIM_CLASS_PREFIX}${animation}`);
            // Stop observing once animated
            this._observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all scroll-animated elements
    const scrollElements = document.querySelectorAll('[data-animate-scroll]');
    scrollElements.forEach((el) => {
      this._observer.observe(el);
    });
  }
};

export default AnimationManager;
