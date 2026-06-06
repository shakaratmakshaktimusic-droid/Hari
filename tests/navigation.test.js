/**
 * Unit tests for js/ui/navigation.js
 * Uses Node.js built-in test runner with minimal DOM mocking.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM mock for testing Navigation logic
function createMockDOM(currentPathname = '/index.html') {
  const elements = {};
  const eventListeners = {};
  const bodyStyle = {};

  // Create mock links
  const links = [
    { href: 'index.html', text: 'Day of Week' },
    { href: 'duration.html', text: 'Duration' },
    { href: 'weekday.html', text: 'Weekday' },
    { href: 'arithmetic.html', text: 'Arithmetic' },
    { href: 'business-days.html', text: 'Business Days' },
    { href: 'week-number.html', text: 'Week Number' },
    { href: 'countdown.html', text: 'Countdown' },
    { href: 'timezone.html', text: 'Time Zones' },
    { href: 'batch.html', text: 'Batch' },
  ];

  const mockLinks = links.map((l) => {
    const classList = new Set();
    return {
      getAttribute: (attr) => (attr === 'href' ? l.href : null),
      classList: {
        add: (cls) => classList.add(cls),
        remove: (cls) => classList.delete(cls),
        contains: (cls) => classList.has(cls),
      },
      addEventListener: () => {},
      _classList: classList,
    };
  });

  const hamburgerClassList = new Set();
  const navLinksClassList = new Set();
  const overlayClassList = new Set();

  elements['navbar'] = { id: 'navbar' };
  elements['hamburger'] = {
    id: 'hamburger',
    classList: {
      add: (cls) => hamburgerClassList.add(cls),
      remove: (cls) => hamburgerClassList.delete(cls),
      contains: (cls) => hamburgerClassList.has(cls),
    },
    setAttribute: (attr, val) => {
      elements['hamburger'][`_${attr}`] = val;
    },
    getAttribute: (attr) => elements['hamburger'][`_${attr}`],
    addEventListener: (event, handler) => {
      if (!eventListeners['hamburger']) eventListeners['hamburger'] = {};
      eventListeners['hamburger'][event] = handler;
    },
    _hamburgerClassList: hamburgerClassList,
  };
  elements['nav-links'] = {
    id: 'nav-links',
    classList: {
      add: (cls) => navLinksClassList.add(cls),
      remove: (cls) => navLinksClassList.delete(cls),
      contains: (cls) => navLinksClassList.has(cls),
    },
    querySelectorAll: (selector) => {
      if (selector === '.navbar__link') return mockLinks;
      return [];
    },
    _navLinksClassList: navLinksClassList,
  };
  elements['nav-overlay'] = {
    id: 'nav-overlay',
    classList: {
      add: (cls) => overlayClassList.add(cls),
      remove: (cls) => overlayClassList.delete(cls),
      contains: (cls) => overlayClassList.has(cls),
    },
    addEventListener: (event, handler) => {
      if (!eventListeners['nav-overlay']) eventListeners['nav-overlay'] = {};
      eventListeners['nav-overlay'][event] = handler;
    },
    _overlayClassList: overlayClassList,
  };

  // Mock global objects
  const documentListeners = {};
  global.document = {
    getElementById: (id) => elements[id] || null,
    addEventListener: (event, handler) => {
      documentListeners[event] = handler;
    },
    body: {
      style: bodyStyle,
    },
  };

  global.window = {
    location: { pathname: currentPathname },
    innerWidth: 1024,
    addEventListener: () => {},
  };

  return {
    elements,
    eventListeners,
    documentListeners,
    mockLinks,
    bodyStyle,
    hamburgerClassList,
    navLinksClassList,
    overlayClassList,
  };
}

// We need to import Navigation fresh for each test since it mutates internal state
async function getNavigation() {
  // Clear module cache
  const url = new URL('../js/ui/navigation.js', import.meta.url);
  // Add timestamp to bust cache
  const mod = await import(`${url.href}?t=${Date.now()}-${Math.random()}`);
  return mod.default;
}

describe('Navigation', () => {
  describe('getCurrentPage', () => {
    it('should extract filename from pathname', async () => {
      createMockDOM('/duration.html');
      const Navigation = await getNavigation();
      assert.equal(Navigation.getCurrentPage(), 'duration.html');
    });

    it('should default to index.html for root path', async () => {
      createMockDOM('/');
      const Navigation = await getNavigation();
      assert.equal(Navigation.getCurrentPage(), 'index.html');
    });

    it('should handle nested paths', async () => {
      createMockDOM('/some/path/weekday.html');
      const Navigation = await getNavigation();
      assert.equal(Navigation.getCurrentPage(), 'weekday.html');
    });

    it('should default to index.html for empty path', async () => {
      createMockDOM('');
      const Navigation = await getNavigation();
      assert.equal(Navigation.getCurrentPage(), 'index.html');
    });
  });

  describe('setActive', () => {
    it('should add active class to matching link', async () => {
      const { mockLinks } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');

      Navigation.setActive('duration.html');

      // duration.html is the second link (index 1)
      assert.equal(mockLinks[1]._classList.has('navbar__link--active'), true);
    });

    it('should remove active class from all other links', async () => {
      const { mockLinks } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');

      // Manually add active to first link
      mockLinks[0]._classList.add('navbar__link--active');

      // Set active to third link
      Navigation.setActive('weekday.html');

      assert.equal(mockLinks[0]._classList.has('navbar__link--active'), false);
      assert.equal(mockLinks[2]._classList.has('navbar__link--active'), true);
    });

    it('should handle non-matching filename gracefully', async () => {
      const { mockLinks } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');

      Navigation.setActive('nonexistent.html');

      // No link should be active
      mockLinks.forEach((link) => {
        assert.equal(link._classList.has('navbar__link--active'), false);
      });
    });
  });

  describe('openMobileDrawer', () => {
    it('should add appropriate classes and lock body scroll', async () => {
      const { navLinksClassList, hamburgerClassList, overlayClassList, bodyStyle } =
        createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      Navigation.openMobileDrawer();

      assert.equal(navLinksClassList.has('navbar__links--open'), true);
      assert.equal(hamburgerClassList.has('navbar__hamburger--active'), true);
      assert.equal(overlayClassList.has('navbar__overlay--visible'), true);
      assert.equal(bodyStyle.overflow, 'hidden');
      assert.equal(Navigation._isDrawerOpen, true);
    });

    it('should set aria-expanded to true', async () => {
      const { elements } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      Navigation.openMobileDrawer();

      assert.equal(elements['hamburger']['_aria-expanded'], 'true');
      assert.equal(elements['hamburger']['_aria-label'], 'Close navigation menu');
    });
  });

  describe('closeMobileDrawer', () => {
    it('should remove classes and restore body scroll', async () => {
      const { navLinksClassList, hamburgerClassList, overlayClassList, bodyStyle } =
        createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      // Open first
      Navigation.openMobileDrawer();
      // Then close
      Navigation.closeMobileDrawer();

      assert.equal(navLinksClassList.has('navbar__links--open'), false);
      assert.equal(hamburgerClassList.has('navbar__hamburger--active'), false);
      assert.equal(overlayClassList.has('navbar__overlay--visible'), false);
      assert.equal(bodyStyle.overflow, '');
      assert.equal(Navigation._isDrawerOpen, false);
    });

    it('should set aria-expanded to false', async () => {
      const { elements } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      Navigation.openMobileDrawer();
      Navigation.closeMobileDrawer();

      assert.equal(elements['hamburger']['_aria-expanded'], 'false');
      assert.equal(elements['hamburger']['_aria-label'], 'Toggle navigation menu');
    });
  });

  describe('toggleMobileDrawer', () => {
    it('should open when closed', async () => {
      const { navLinksClassList } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      Navigation.toggleMobileDrawer();

      assert.equal(navLinksClassList.has('navbar__links--open'), true);
      assert.equal(Navigation._isDrawerOpen, true);
    });

    it('should close when open', async () => {
      const { navLinksClassList } = createMockDOM('/index.html');
      const Navigation = await getNavigation();
      Navigation._navLinks = global.document.getElementById('nav-links');
      Navigation._hamburger = global.document.getElementById('hamburger');
      Navigation._overlay = global.document.getElementById('nav-overlay');

      Navigation.toggleMobileDrawer(); // open
      Navigation.toggleMobileDrawer(); // close

      assert.equal(navLinksClassList.has('navbar__links--open'), false);
      assert.equal(Navigation._isDrawerOpen, false);
    });
  });

  describe('init', () => {
    it('should return early if elements not found', async () => {
      global.document = {
        getElementById: () => null,
        addEventListener: () => {},
        body: { style: {} },
      };
      global.window = {
        location: { pathname: '/index.html' },
        innerWidth: 1024,
        addEventListener: () => {},
      };
      const Navigation = await getNavigation();

      // Should not throw
      Navigation.init();
      assert.equal(Navigation._navbar, null);
    });

    it('should detect page and set active link on init', async () => {
      const { mockLinks } = createMockDOM('/duration.html');
      const Navigation = await getNavigation();

      Navigation.init();

      // duration.html is index 1
      assert.equal(mockLinks[1]._classList.has('navbar__link--active'), true);
    });

    it('should register escape key handler', async () => {
      const { documentListeners } = createMockDOM('/index.html');
      const Navigation = await getNavigation();

      Navigation.init();

      assert.ok(documentListeners['keydown'], 'keydown listener should be registered');
    });
  });
});
