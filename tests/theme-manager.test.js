/**
 * Unit tests for js/ui/theme-manager.js
 * Uses Node.js built-in test runner (no external dependencies).
 *
 * Since ThemeManager interacts with DOM and localStorage, we set up
 * minimal mocks for the browser environment.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Minimal DOM/Browser Mocks ──────────────────────────────────────────────

function createMockDocument() {
  const elements = {};
  const htmlElement = {
    attributes: {},
    classList: {
      _classes: new Set(),
      add(cls) { this._classes.add(cls); },
      remove(cls) { this._classes.delete(cls); },
      contains(cls) { return this._classes.has(cls); }
    },
    setAttribute(key, value) { this.attributes[key] = value; },
    getAttribute(key) { return this.attributes[key] || null; }
  };

  const headElement = {
    children: [],
    appendChild(child) { this.children.push(child); }
  };

  const createdElements = [];

  return {
    documentElement: htmlElement,
    head: headElement,
    _elements: elements,
    _createdElements: createdElements,
    getElementById(id) {
      return elements[id] || null;
    },
    querySelector(selector) {
      if (selector === 'meta[name="theme-color"]') {
        return elements['meta-theme-color'] || null;
      }
      if (selector === 'head') {
        return headElement;
      }
      return null;
    },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        attributes: {},
        innerHTML: '',
        setAttribute(key, value) { this.attributes[key] = value; },
        getAttribute(key) { return this.attributes[key] || null; }
      };
      createdElements.push(el);
      // If it's a meta tag for theme-color, store it
      if (tag === 'meta') {
        elements['meta-theme-color'] = el;
      }
      return el;
    },
    _addElement(id, el) {
      elements[id] = el;
    }
  };
}

function createMockLocalStorage() {
  const store = {};
  return {
    _store: store,
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };
}

function createMockWindow(darkMode = false) {
  const listeners = [];
  return {
    matchMedia(query) {
      return {
        matches: darkMode,
        media: query,
        addEventListener(event, handler) { listeners.push({ event, handler }); },
        addListener(handler) { listeners.push({ event: 'change', handler }); }
      };
    },
    _listeners: listeners
  };
}

// ─── Test Setup ──────────────────────────────────────────────────────────────

let originalDocument;
let originalLocalStorage;
let originalWindow;

function setupGlobals(options = {}) {
  const { darkMode = false, storedTheme = null, hasToggleButton = false } = options;

  const mockDoc = createMockDocument();
  const mockStorage = createMockLocalStorage();
  const mockWindow = createMockWindow(darkMode);

  if (storedTheme) {
    mockStorage.setItem('date-calc-theme', storedTheme);
  }

  if (hasToggleButton) {
    const btn = {
      attributes: {},
      innerHTML: '',
      _listeners: [],
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key] || null; },
      addEventListener(event, handler) { this._listeners.push({ event, handler }); }
    };
    mockDoc._addElement('theme-toggle', btn);
  }

  globalThis.document = mockDoc;
  globalThis.localStorage = mockStorage;
  globalThis.window = mockWindow;

  return { mockDoc, mockStorage, mockWindow };
}

function teardownGlobals() {
  if (originalDocument !== undefined) globalThis.document = originalDocument;
  else delete globalThis.document;
  if (originalLocalStorage !== undefined) globalThis.localStorage = originalLocalStorage;
  else delete globalThis.localStorage;
  if (originalWindow !== undefined) globalThis.window = originalWindow;
  else delete globalThis.window;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ThemeManager', () => {
  beforeEach(() => {
    originalDocument = globalThis.document;
    originalLocalStorage = globalThis.localStorage;
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    teardownGlobals();
  });

  describe('getCurrent()', () => {
    it('should return "light" when no data-theme attribute is set', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      assert.equal(ThemeManager.getCurrent(), 'light');
    });

    it('should return the value of data-theme attribute', async () => {
      setupGlobals();
      document.documentElement.setAttribute('data-theme', 'dark');
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      assert.equal(ThemeManager.getCurrent(), 'dark');
    });
  });

  describe('getOSPreference()', () => {
    it('should return "dark" when OS prefers dark mode', async () => {
      setupGlobals({ darkMode: true });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      assert.equal(ThemeManager.getOSPreference(), 'dark');
    });

    it('should return "light" when OS prefers light mode', async () => {
      setupGlobals({ darkMode: false });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      assert.equal(ThemeManager.getOSPreference(), 'light');
    });
  });

  describe('apply()', () => {
    it('should set data-theme attribute to "dark"', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('dark');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    });

    it('should set data-theme attribute to "light"', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('light');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    });

    it('should default to "light" for invalid theme values', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('invalid');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    });

    it('should update toggle button aria-label for dark mode', async () => {
      setupGlobals({ hasToggleButton: true });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('dark');
      const btn = document.getElementById('theme-toggle');
      assert.equal(btn.getAttribute('aria-label'), 'Switch to light mode');
    });

    it('should update toggle button aria-label for light mode', async () => {
      setupGlobals({ hasToggleButton: true });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('light');
      const btn = document.getElementById('theme-toggle');
      assert.equal(btn.getAttribute('aria-label'), 'Switch to dark mode');
    });
  });

  describe('init()', () => {
    it('should use stored theme when available', async () => {
      setupGlobals({ storedTheme: 'dark' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    });

    it('should use OS preference when no stored theme', async () => {
      setupGlobals({ darkMode: true });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    });

    it('should default to light when no stored theme and OS is light', async () => {
      setupGlobals({ darkMode: false });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    });

    it('should set up toggle button click listener', async () => {
      setupGlobals({ hasToggleButton: true });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      const btn = document.getElementById('theme-toggle');
      assert.equal(btn._listeners.length, 1);
      assert.equal(btn._listeners[0].event, 'click');
    });
  });

  describe('toggle()', () => {
    it('should switch from light to dark', async () => {
      setupGlobals({ storedTheme: 'light' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      ThemeManager.toggle();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    });

    it('should switch from dark to light', async () => {
      setupGlobals({ storedTheme: 'dark' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      ThemeManager.toggle();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    });

    it('should persist the new theme to localStorage', async () => {
      setupGlobals({ storedTheme: 'light' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      ThemeManager.toggle();
      assert.equal(localStorage.getItem('date-calc-theme'), 'dark');
    });

    it('should add transition class during toggle', async () => {
      setupGlobals({ storedTheme: 'light' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      ThemeManager.toggle();
      assert.equal(document.documentElement.classList.contains('theme-transitioning'), true);
    });

    it('should remove transition class after TRANSITION_DURATION', async () => {
      setupGlobals({ storedTheme: 'light' });
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      ThemeManager.toggle();

      // Wait for the transition to complete
      await new Promise(resolve => setTimeout(resolve, ThemeManager.TRANSITION_DURATION + 50));
      assert.equal(document.documentElement.classList.contains('theme-transitioning'), false);
    });
  });

  describe('localStorage unavailability', () => {
    it('should gracefully handle localStorage throwing errors', async () => {
      setupGlobals();
      // Override localStorage to throw
      globalThis.localStorage = {
        getItem() { throw new Error('Storage disabled'); },
        setItem() { throw new Error('Storage disabled'); },
        removeItem() { throw new Error('Storage disabled'); }
      };
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      // Should not throw
      assert.doesNotThrow(() => ThemeManager.init());
      assert.doesNotThrow(() => ThemeManager.toggle());
      // Wait for the transition timeout to fire before teardown
      await new Promise(resolve => setTimeout(resolve, ThemeManager.TRANSITION_DURATION + 50));
    });

    it('should fall back to OS preference when localStorage throws', async () => {
      setupGlobals({ darkMode: true });
      globalThis.localStorage = {
        getItem() { throw new Error('Storage disabled'); },
        setItem() { throw new Error('Storage disabled'); },
        removeItem() { throw new Error('Storage disabled'); }
      };
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.init();
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    });
  });

  describe('meta theme-color', () => {
    it('should create meta theme-color tag if not present', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('dark');
      const meta = document.querySelector('meta[name="theme-color"]');
      assert.notEqual(meta, null);
      assert.equal(meta.getAttribute('content'), '#1a1a2e');
    });

    it('should set light theme-color for light mode', async () => {
      setupGlobals();
      const { default: ThemeManager } = await import('../js/ui/theme-manager.js?' + Date.now() + Math.random());
      ThemeManager.apply('light');
      const meta = document.querySelector('meta[name="theme-color"]');
      assert.notEqual(meta, null);
      assert.equal(meta.getAttribute('content'), '#ffffff');
    });
  });
});
