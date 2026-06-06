/**
 * Unit tests for js/features/history-manager.js
 * Uses Node.js built-in test runner (no external dependencies).
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Minimal localStorage Mock ──────────────────────────────────────────────

function createMockLocalStorage() {
  const store = {};
  return {
    getItem(key) { return store[key] ?? null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// ─── Setup Global Mocks ─────────────────────────────────────────────────────

let HistoryManager;

async function loadFreshModule() {
  // Reset global mocks
  globalThis.localStorage = createMockLocalStorage();
  globalThis.window = { location: { origin: 'http://localhost', pathname: '/', href: 'http://localhost/' } };
  globalThis.document = { createElement: () => ({}) };

  // Dynamic import with cache-busting to get fresh module each time
  const cacheBuster = `?t=${Date.now()}-${Math.random()}`;
  const module = await import(`../js/features/history-manager.js${cacheBuster}`);
  return module.default;
}

describe('HistoryManager', () => {
  beforeEach(async () => {
    HistoryManager = await loadFreshModule();
    HistoryManager._entries = [];
    HistoryManager._initialized = false;
    globalThis.localStorage.clear();
    HistoryManager.init();
  });

  describe('init()', () => {
    it('should initialize with empty entries when localStorage is empty', () => {
      assert.equal(HistoryManager.getCount(), 0);
      assert.equal(HistoryManager._initialized, true);
    });

    it('should load entries from localStorage on init', () => {
      const mockEntries = [
        { id: 'h-test1', type: 'duration', inputs: {}, outputs: {}, timestamp: 1000, tags: [] }
      ];
      globalThis.localStorage.setItem('date-calc-history', JSON.stringify(mockEntries));
      HistoryManager._entries = [];
      HistoryManager.init();
      assert.equal(HistoryManager.getCount(), 1);
    });

    it('should filter invalid entries on load', () => {
      const mixedEntries = [
        { id: 'h-valid', type: 'duration', inputs: {}, outputs: {}, timestamp: 1000, tags: [] },
        { invalid: true },
        null,
        { id: 123, type: 'bad', timestamp: 'not-a-number' }
      ];
      globalThis.localStorage.setItem('date-calc-history', JSON.stringify(mixedEntries));
      HistoryManager._entries = [];
      HistoryManager.init();
      assert.equal(HistoryManager.getCount(), 1);
    });
  });

  describe('add()', () => {
    it('should add an entry with auto-generated id and timestamp', () => {
      const entry = HistoryManager.add({
        type: 'duration',
        inputs: { start: '2024-01-01', end: '2024-12-31' },
        outputs: { days: 365 }
      });
      assert.equal(typeof entry.id, 'string');
      assert.ok(entry.id.startsWith('h-'));
      assert.equal(entry.type, 'duration');
      assert.deepEqual(entry.inputs, { start: '2024-01-01', end: '2024-12-31' });
      assert.deepEqual(entry.outputs, { days: 365 });
      assert.equal(typeof entry.timestamp, 'number');
      assert.deepEqual(entry.tags, []);
    });

    it('should add entries at the beginning (most recent first)', () => {
      HistoryManager.add({ type: 'first', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'second', inputs: {}, outputs: {} });
      const all = HistoryManager.getAll();
      assert.equal(all[0].type, 'second');
      assert.equal(all[1].type, 'first');
    });

    it('should support custom tags', () => {
      const entry = HistoryManager.add({
        type: 'duration',
        inputs: {},
        outputs: {},
        tags: ['important', 'work']
      });
      assert.deepEqual(entry.tags, ['important', 'work']);
    });

    it('should evict oldest entries when exceeding MAX_ENTRIES', () => {
      // Add MAX_ENTRIES + 5 entries
      for (let i = 0; i < HistoryManager.MAX_ENTRIES + 5; i++) {
        HistoryManager.add({ type: `type-${i}`, inputs: {}, outputs: {} });
      }
      assert.equal(HistoryManager.getCount(), HistoryManager.MAX_ENTRIES);
      // The most recent entries should remain
      const all = HistoryManager.getAll();
      assert.equal(all[0].type, `type-${HistoryManager.MAX_ENTRIES + 4}`);
    });

    it('should persist to localStorage after add', () => {
      HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      const stored = JSON.parse(globalThis.localStorage.getItem('date-calc-history'));
      assert.equal(stored.length, 1);
      assert.equal(stored[0].type, 'test');
    });
  });

  describe('getAll()', () => {
    it('should return all entries when no filter specified', () => {
      HistoryManager.add({ type: 'duration', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'arithmetic', inputs: {}, outputs: {} });
      assert.equal(HistoryManager.getAll().length, 2);
    });

    it('should filter entries by type', () => {
      HistoryManager.add({ type: 'duration', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'arithmetic', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'duration', inputs: {}, outputs: {} });
      const durations = HistoryManager.getAll('duration');
      assert.equal(durations.length, 2);
      assert.ok(durations.every(e => e.type === 'duration'));
    });

    it('should return a copy, not internal reference', () => {
      HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      const all = HistoryManager.getAll();
      all.pop();
      assert.equal(HistoryManager.getCount(), 1);
    });
  });

  describe('search()', () => {
    it('should find entries matching type', () => {
      HistoryManager.add({ type: 'duration', inputs: { start: '2024-01-01' }, outputs: {} });
      const results = HistoryManager.search('duration');
      assert.equal(results.length, 1);
    });

    it('should find entries matching input values', () => {
      HistoryManager.add({ type: 'duration', inputs: { start: '2024-06-15' }, outputs: {} });
      const results = HistoryManager.search('2024-06-15');
      assert.equal(results.length, 1);
    });

    it('should be case-insensitive', () => {
      HistoryManager.add({ type: 'Duration', inputs: {}, outputs: {} });
      const results = HistoryManager.search('DURATION');
      assert.equal(results.length, 1);
    });

    it('should return empty array for null/empty queries', () => {
      assert.deepEqual(HistoryManager.search(null), []);
      assert.deepEqual(HistoryManager.search(''), []);
      assert.deepEqual(HistoryManager.search('   '), []);
    });

    it('should search in tags', () => {
      HistoryManager.add({ type: 'test', inputs: {}, outputs: {}, tags: ['vacation'] });
      const results = HistoryManager.search('vacation');
      assert.equal(results.length, 1);
    });
  });

  describe('getById()', () => {
    it('should return the entry with matching id', () => {
      const added = HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      const found = HistoryManager.getById(added.id);
      assert.deepEqual(found, added);
    });

    it('should return null for non-existent id', () => {
      assert.equal(HistoryManager.getById('nonexistent'), null);
    });
  });

  describe('delete()', () => {
    it('should remove an entry by id', () => {
      const entry = HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      const result = HistoryManager.delete(entry.id);
      assert.equal(result, true);
      assert.equal(HistoryManager.getCount(), 0);
    });

    it('should return false for non-existent id', () => {
      assert.equal(HistoryManager.delete('nonexistent'), false);
    });

    it('should persist deletion to localStorage', () => {
      const entry = HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      HistoryManager.delete(entry.id);
      const stored = JSON.parse(globalThis.localStorage.getItem('date-calc-history'));
      assert.equal(stored.length, 0);
    });
  });

  describe('clear()', () => {
    it('should clear all entries when no tag specified', () => {
      HistoryManager.add({ type: 'a', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'b', inputs: {}, outputs: {} });
      const deleted = HistoryManager.clear();
      assert.equal(deleted, 2);
      assert.equal(HistoryManager.getCount(), 0);
    });

    it('should only clear entries with specified tag', () => {
      HistoryManager.add({ type: 'a', inputs: {}, outputs: {}, tags: ['work'] });
      HistoryManager.add({ type: 'b', inputs: {}, outputs: {}, tags: ['personal'] });
      HistoryManager.add({ type: 'c', inputs: {}, outputs: {}, tags: ['work'] });
      const deleted = HistoryManager.clear('work');
      assert.equal(deleted, 2);
      assert.equal(HistoryManager.getCount(), 1);
      assert.equal(HistoryManager.getAll()[0].type, 'b');
    });
  });

  describe('addTag() / removeTag()', () => {
    it('should add a tag to an entry', () => {
      const entry = HistoryManager.add({ type: 'test', inputs: {}, outputs: {} });
      const result = HistoryManager.addTag(entry.id, 'important');
      assert.equal(result, true);
      assert.ok(HistoryManager.getById(entry.id).tags.includes('important'));
    });

    it('should not duplicate existing tag', () => {
      const entry = HistoryManager.add({ type: 'test', inputs: {}, outputs: {}, tags: ['work'] });
      HistoryManager.addTag(entry.id, 'work');
      assert.equal(HistoryManager.getById(entry.id).tags.length, 1);
    });

    it('should return false for non-existent entry', () => {
      assert.equal(HistoryManager.addTag('nonexistent', 'tag'), false);
    });

    it('should remove a tag from an entry', () => {
      const entry = HistoryManager.add({ type: 'test', inputs: {}, outputs: {}, tags: ['a', 'b'] });
      HistoryManager.removeTag(entry.id, 'a');
      assert.deepEqual(HistoryManager.getById(entry.id).tags, ['b']);
    });

    it('should return false for non-existent entry on removeTag', () => {
      assert.equal(HistoryManager.removeTag('nonexistent', 'tag'), false);
    });
  });

  describe('getAllTags()', () => {
    it('should return all unique tags sorted', () => {
      HistoryManager.add({ type: 'a', inputs: {}, outputs: {}, tags: ['work', 'urgent'] });
      HistoryManager.add({ type: 'b', inputs: {}, outputs: {}, tags: ['work', 'personal'] });
      const tags = HistoryManager.getAllTags();
      assert.deepEqual(tags, ['personal', 'urgent', 'work']);
    });

    it('should return empty array when no tags exist', () => {
      HistoryManager.add({ type: 'a', inputs: {}, outputs: {} });
      assert.deepEqual(HistoryManager.getAllTags(), []);
    });
  });

  describe('getCount()', () => {
    it('should return 0 for empty history', () => {
      assert.equal(HistoryManager.getCount(), 0);
    });

    it('should return correct count after additions', () => {
      HistoryManager.add({ type: 'a', inputs: {}, outputs: {} });
      HistoryManager.add({ type: 'b', inputs: {}, outputs: {} });
      assert.equal(HistoryManager.getCount(), 2);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      globalThis.localStorage.setItem('date-calc-history', 'not-valid-json{{{');
      HistoryManager._entries = [];
      HistoryManager.init();
      assert.equal(HistoryManager.getCount(), 0);
    });

    it('should handle non-array localStorage data', () => {
      globalThis.localStorage.setItem('date-calc-history', JSON.stringify({ not: 'an array' }));
      HistoryManager._entries = [];
      HistoryManager.init();
      assert.equal(HistoryManager.getCount(), 0);
    });
  });
});
