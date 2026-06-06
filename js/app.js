/**
 * App Entry Point - Common initialization for every page.
 * Runs on DOMContentLoaded, sets up all shared UI modules
 * (theme, navigation, keyboard shortcuts, toasts, animations)
 * and dynamically loads the page-specific calculator module.
 *
 * Requirements covered: 2.6, 22.4, 22.5
 */

import ThemeManager from './ui/theme-manager.js';
import Navigation from './ui/navigation.js';
import KeyboardShortcutManager from './ui/keyboard-shortcuts.js';
import AnimationManager from './ui/animation-manager.js';
import Toast from './ui/toast.js';


/**
 * Page module map — maps page filenames to dynamic import functions.
 * Each calculator page has its own module that is loaded on demand.
 */
const PAGE_MODULES = {
  'index.html': () => import('./calculators/day-of-week.js'),
  'duration.html': () => import('./calculators/duration.js'),
  'weekday.html': () => import('./calculators/weekday.js'),
  'arithmetic.html': () => import('./calculators/arithmetic.js'),
  'business-days.html': () => import('./calculators/business-days.js'),
  'week-number.html': () => import('./calculators/week-number.js'),
  'countdown.html': () => import('./calculators/countdown.js'),
  'timezone.html': () => import('./calculators/timezone.js'),
  'batch.html': () => import('./calculators/batch-calculator.js'),
};


/**
 * Main initialization sequence.
 * Executed when the DOM is fully parsed and ready.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize theme first to prevent FOUC (flash of unstyled content)
  ThemeManager.init();

  // 2. Initialize navigation (active states, mobile drawer)
  Navigation.init();

  // 3. Initialize keyboard shortcuts (global key bindings)
  KeyboardShortcutManager.init();

  // 4. Initialize toast notification system
  Toast.init();

  // 5. Initialize page-specific calculator via dynamic import
  const currentPage = Navigation.getCurrentPage();
  const moduleLoader = PAGE_MODULES[currentPage];

  if (moduleLoader) {
    try {
      const module = await moduleLoader();
      if (module.default && typeof module.default.init === 'function') {
        module.default.init();
      }
    } catch (e) {
      console.error('[App] Failed to load page module:', e);
      // Non-critical: page still functions, just no calculator logic
    }
  }


  // 6. Trigger entrance animations for page content
  AnimationManager.triggerPageLoad();

  // 7. Lazy-load non-critical premium features via requestIdleCallback
  //    These will be loaded when their respective modules are implemented.
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // Smart suggestions and history manager load lazily
      // to avoid blocking initial page render.
      // Implementation handled by tasks 7.1 and 7.3.
    });
  } else {
    // Fallback for browsers without requestIdleCallback (Safari)
    setTimeout(() => {
      // Deferred initialization placeholder
    }, 2000);
  }

  // 8. Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('[App] Service worker registration failed:', err);
    });
  }
});

// Export for testing
export { PAGE_MODULES };
