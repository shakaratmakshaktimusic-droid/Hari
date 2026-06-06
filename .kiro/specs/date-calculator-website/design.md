# Technical Design Document: Date Calculator Website

## Introduction

This document defines the technical architecture and design for a premium, multi-page date calculator website built with vanilla HTML, CSS, and JavaScript. The site aims to surpass timeanddate.com by providing all core calculation features with a dramatically improved user experience — featuring glassmorphism/neumorphism aesthetics, AI-powered suggestions, interactive visualizations, batch operations, and full offline capability.

The design prioritizes:
- **Zero dependencies**: Pure vanilla implementation for maximum performance and minimal bundle size
- **Modular architecture**: Independent calculator modules that share common utilities
- **Client-first**: All computation happens in the browser with no server requirements
- **Progressive enhancement**: Core functionality works everywhere; premium features layer on top

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Client-Side)                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Service Worker Layer                        │  │
│  │  (Cache-first strategy, offline support, asset management)    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     UI / Presentation Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │
│  │  │Navigation│ │Theme Mgr │ │Animations│ │ Keyboard Shortcuts│ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Calculator Pages Layer                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │Day-of-Wk│ │Duration │ │Weekday  │ │Date Arith│            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │
│  │  │Biz Days │ │Week Num │ │Countdown│ │Time Zone │            │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Premium Features Layer                       │  │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────┐   │  │
│  │  │Smart Sug.│ │Timeline │ │Heatmap   │ │Batch Calculator │   │  │
│  │  └──────────┘ └─────────┘ └──────────┘ └─────────────────┘   │  │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐                       │  │
│  │  │Share Mgr │ │Import/  │ │Drag-Select│                       │  │
│  │  │          │ │Export   │ │          │                        │  │
│  │  └──────────┘ └─────────┘ └──────────┘                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Core Engine Layer                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │  │
│  │  │DateParser│ │DateCalc  │ │Timezone  │ │Holiday Database │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Persistence Layer                            │  │
│  │  ┌──────────────┐ ┌─────────────────┐ ┌───────────────────┐  │  │
│  │  │LocalStorage  │ │History Manager  │ │URL State Manager │  │  │
│  │  └──────────────┘ └─────────────────┘ └───────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
/
├── index.html                    # Landing page / Day-of-Week calculator
├── duration.html                 # Date-to-Date Duration Calculator
├── weekday.html                  # Weekday Calculator
├── arithmetic.html               # Date Arithmetic
├── business-days.html            # Business Day Calculator
├── week-number.html              # Week Number Calculator
├── countdown.html                # Countdown Timers
├── timezone.html                 # Time Zone Converter
├── batch.html                    # Batch Calculator
├── css/
│   ├── variables.css             # CSS custom properties (colors, spacing, fonts)
│   ├── base.css                  # Reset, typography, base styles
│   ├── components.css            # Shared component styles (cards, inputs, buttons)
│   ├── glassmorphism.css         # Glassmorphism/neumorphism effects
│   ├── animations.css            # Keyframes and transition definitions
│   ├── navigation.css            # Navbar and mobile drawer styles
│   ├── responsive.css            # Breakpoints and responsive overrides
│   └── themes/
│       ├── light.css             # Light theme variables
│       └── dark.css              # Dark theme variables
├── js/
│   ├── core/
│   │   ├── date-parser.js        # Multi-format date parsing engine
│   │   ├── date-calc.js          # Core date calculation functions
│   │   ├── timezone-db.js        # IANA timezone database and conversion logic
│   │   ├── holiday-db.js         # Holiday calendars for 10+ countries
│   │   └── validators.js         # Input validation utilities
│   ├── ui/
│   │   ├── navigation.js         # Nav bar, hamburger menu, active states
│   │   ├── theme-manager.js      # Dark/light mode toggle and persistence
│   │   ├── animation-manager.js  # Scroll-triggered and page-load animations
│   │   ├── keyboard-shortcuts.js # Shortcut registration and handling
│   │   ├── drag-select.js        # Calendar drag-to-select functionality
│   │   └── toast.js              # Notification toasts
│   ├── calculators/
│   │   ├── day-of-week.js        # Day of the Week calculator logic
│   │   ├── duration.js           # Duration calculator logic
│   │   ├── weekday.js            # Weekday counter logic
│   │   ├── arithmetic.js         # Date arithmetic logic
│   │   ├── business-days.js      # Business day calculator logic
│   │   ├── week-number.js        # ISO week number logic
│   │   ├── countdown.js          # Countdown timer logic
│   │   └── timezone.js           # Time zone converter logic
│   ├── features/
│   │   ├── smart-suggestions.js  # AI-powered suggestion engine
│   │   ├── history-manager.js    # Calculation history CRUD
│   │   ├── share-manager.js      # URL encoding/decoding for sharing
│   │   ├── visual-timeline.js    # Canvas-based timeline renderer
│   │   ├── calendar-heatmap.js   # SVG-based heatmap component
│   │   ├── batch-calculator.js   # Batch processing engine
│   │   └── import-export.js      # CSV/JSON/PDF import and export
│   └── app.js                    # Entry point, page initialization
├── assets/
│   ├── fonts/                    # Self-hosted web fonts
│   └── icons/                    # SVG icon sprites
├── sw.js                         # Service worker for offline caching
└── manifest.json                 # Web app manifest for PWA support
```

---

## Component Design

### 1. Core Engine Layer

#### DateParser (`js/core/date-parser.js`)

Responsible for parsing date strings in multiple formats and producing a normalized internal representation.

```javascript
/**
 * Parses a date string in supported formats and returns a DateResult.
 * Supported formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
 * 
 * @param {string} input - The date string to parse
 * @param {string} preferredFormat - Hint for ambiguous dates (e.g., "MDY" or "DMY")
 * @returns {DateResult} - Parsed date or error
 */
function parseDate(input, preferredFormat = 'MDY') {
  // Returns { success: boolean, date: {year, month, day}, error?: string }
}

/**
 * Formats a normalized date object to a display string.
 * @param {{year: number, month: number, day: number}} date
 * @param {string} format - Output format pattern
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {}

/**
 * Validates a date for existence (handles leap years, month lengths).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {{valid: boolean, error?: string}}
 */
function validateDate(year, month, day) {}
```

#### DateCalc (`js/core/date-calc.js`)

Pure functions for all date arithmetic and calculations.

```javascript
/**
 * Returns the day of the week for a given date (0=Sunday, 6=Saturday).
 * Uses Zeller's congruence for dates from 0001-01-01 to 9999-12-31.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {number} dayOfWeek (0-6)
 */
function getDayOfWeek(year, month, day) {}

/**
 * Calculates the duration between two dates.
 * @param {{year, month, day}} startDate
 * @param {{year, month, day}} endDate
 * @param {boolean} includeEndDate
 * @returns {DurationResult}
 */
function calculateDuration(startDate, endDate, includeEndDate = false) {}

/**
 * Adds or subtracts time units from a date.
 * Handles month-end overflow by capping at last valid day.
 * @param {{year, month, day}} date
 * @param {{years?, months?, weeks?, days?}} offset
 * @returns {{year, month, day}}
 */
function addToDate(date, offset) {}

/**
 * Counts occurrences of a specific weekday in a date range.
 * @param {{year, month, day}} start
 * @param {{year, month, day}} end
 * @param {number[]} weekdays - Array of weekday numbers (0-6)
 * @returns {Object<number, number>} Map of weekday to count
 */
function countWeekdays(start, end, weekdays) {}

/**
 * Finds the Nth occurrence of a weekday in a given month/year.
 * @param {number} year
 * @param {number} month
 * @param {number} weekday (0-6)
 * @param {number} n (1-5)
 * @returns {{year, month, day} | null}
 */
function findNthWeekday(year, month, weekday, n) {}

/**
 * Calculates business days between two dates.
 * @param {{year, month, day}} start
 * @param {{year, month, day}} end
 * @param {Set<string>} holidays - Set of date strings "YYYY-MM-DD"
 * @returns {number}
 */
function countBusinessDays(start, end, holidays = new Set()) {}

/**
 * Finds the date that is N business days from a start date.
 * @param {{year, month, day}} start
 * @param {number} businessDays
 * @param {Set<string>} holidays
 * @returns {{year, month, day}}
 */
function addBusinessDays(start, businessDays, holidays = new Set()) {}

/**
 * Returns ISO 8601 week number and year for a date.
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {{isoWeek: number, isoYear: number}}
 */
function getISOWeekNumber(year, month, day) {}

/**
 * Returns the day number within the year (1-366).
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {number}
 */
function getDayOfYear(year, month, day) {}

/**
 * Returns total days in a given year (365 or 366).
 * @param {number} year
 * @returns {number}
 */
function getDaysInYear(year) {}
```

#### TimezoneDB (`js/core/timezone-db.js`)

```javascript
/**
 * Converts a time from one timezone to another.
 * @param {{hours, minutes, seconds}} time
 * @param {{year, month, day}} date - Needed for DST calculation
 * @param {string} sourceZone - IANA timezone identifier
 * @param {string} targetZone - IANA timezone identifier
 * @returns {ConversionResult}
 */
function convertTimezone(time, date, sourceZone, targetZone) {}

/**
 * Searches timezone database by city, country, or abbreviation.
 * @param {string} query
 * @returns {TimezoneEntry[]} - Up to 10 matching results
 */
function searchTimezones(query) {}

/**
 * Returns whether a timezone is currently observing DST.
 * @param {string} zone - IANA timezone identifier
 * @param {{year, month, day}} date
 * @returns {{isDST: boolean, offset: number, dstNote?: string}}
 */
function getDSTStatus(zone, date) {}
```

#### HolidayDB (`js/core/holiday-db.js`)

```javascript
/**
 * Returns holiday dates for a given country and year.
 * Supports at least 10 countries with preset calendars.
 * @param {string} countryCode - ISO 3166-1 alpha-2
 * @param {number} year
 * @returns {HolidayEntry[]}
 */
function getHolidays(countryCode, year) {}

/**
 * Evaluates custom recurring holiday definitions.
 * @param {RecurringHoliday[]} definitions
 * @param {number} year
 * @returns {string[]} - Array of "YYYY-MM-DD" date strings
 */
function expandRecurringHolidays(definitions, year) {}
```

---

### 2. UI / Presentation Layer

#### ThemeManager (`js/ui/theme-manager.js`)

```javascript
const ThemeManager = {
  STORAGE_KEY: 'date-calc-theme',
  
  /**
   * Initializes theme based on stored preference or OS setting.
   */
  init() {},
  
  /**
   * Toggles between light and dark themes.
   * Applies CSS transition and persists choice.
   */
  toggle() {},
  
  /**
   * Applies the specified theme to the document.
   * @param {'light' | 'dark'} theme
   */
  apply(theme) {},
  
  /**
   * Gets the current theme preference.
   * @returns {'light' | 'dark'}
   */
  getCurrent() {}
};
```

#### Navigation (`js/ui/navigation.js`)

```javascript
const Navigation = {
  /**
   * Initializes navbar with active state detection and mobile hamburger menu.
   */
  init() {},
  
  /**
   * Sets the active navigation item based on current page.
   * @param {string} pageId
   */
  setActive(pageId) {},
  
  /**
   * Toggles mobile drawer open/closed.
   */
  toggleMobileDrawer() {},
  
  /**
   * Closes mobile drawer (used on navigation or outside click).
   */
  closeMobileDrawer() {}
};
```

#### KeyboardShortcutManager (`js/ui/keyboard-shortcuts.js`)

```javascript
const KeyboardShortcutManager = {
  shortcuts: new Map(),
  
  BROWSER_CONFLICTS: new Set([
    'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Tab', 'Ctrl+Shift+Tab',
    'Ctrl+L', 'Ctrl+D', 'Ctrl+H', 'Ctrl+J', 'F5', 'F11', 'F12'
  ]),
  
  /**
   * Registers a keyboard shortcut, rejecting conflicts.
   * @param {string} combo - e.g., "Alt+1", "Ctrl+Enter"
   * @param {Function} handler
   * @param {string} description
   * @returns {boolean} success
   */
  register(combo, handler, description) {},
  
  /**
   * Returns all registered shortcuts for the help overlay.
   * @returns {Array<{combo, description}>}
   */
  getAll() {},
  
  /**
   * Checks if a shortcut conflicts with browser defaults.
   * @param {string} combo
   * @returns {boolean}
   */
  hasConflict(combo) {}
};
```

---

### 3. Premium Features Layer

#### SmartSuggestionEngine (`js/features/smart-suggestions.js`)

```javascript
const SmartSuggestionEngine = {
  MAX_SUGGESTIONS: 5,
  STORAGE_KEY: 'date-calc-suggestions',
  
  /**
   * Generates up to 5 suggestions based on history and context.
   * @param {string} partialInput - Current user input
   * @param {HistoryEntry[]} history
   * @returns {Suggestion[]} - Max 5 items
   */
  getSuggestions(partialInput, history) {},
  
  /**
   * Reduces priority of a dismissed suggestion.
   * @param {string} suggestionId
   */
  dismiss(suggestionId) {},
  
  /**
   * Gets common upcoming dates (end of month, quarter, holidays).
   * @param {string} locale
   * @returns {Suggestion[]}
   */
  getCommonDates(locale) {},
  
  /**
   * Analyzes history to find frequently used dates.
   * @param {HistoryEntry[]} history
   * @returns {DateFrequency[]}
   */
  analyzeFrequency(history) {}
};
```

#### HistoryManager (`js/features/history-manager.js`)

```javascript
const HistoryManager = {
  MAX_ENTRIES: 500,
  STORAGE_KEY: 'date-calc-history',
  
  /**
   * Adds a calculation to history. Evicts oldest if at capacity.
   * @param {HistoryEntry} entry
   */
  add(entry) {},
  
  /**
   * Retrieves all entries, optionally filtered by type.
   * @param {string} [type] - Calculator type filter
   * @returns {HistoryEntry[]} - Sorted by timestamp descending
   */
  getAll(type) {},
  
  /**
   * Searches entries by keyword.
   * @param {string} query
   * @returns {HistoryEntry[]}
   */
  search(query) {},
  
  /**
   * Deletes a single entry by ID.
   * @param {string} id
   */
  delete(id) {},
  
  /**
   * Deletes all entries matching a tag, or all entries if no tag.
   * @param {string} [tag]
   */
  clear(tag) {},
  
  /**
   * Returns the current entry count.
   * @returns {number}
   */
  getCount() {}
};
```

#### ShareManager (`js/features/share-manager.js`)

```javascript
const ShareManager = {
  /**
   * Encodes calculation parameters into a shareable URL.
   * @param {CalculationParams} params
   * @returns {string} url
   */
  encode(params) {},
  
  /**
   * Decodes calculation parameters from a URL query string.
   * @param {string} url
   * @returns {CalculationParams}
   */
  decode(url) {},
  
  /**
   * Copies the share URL to clipboard and shows toast.
   * @param {string} url
   */
  copyToClipboard(url) {}
};
```

#### BatchCalculator (`js/features/batch-calculator.js`)

```javascript
const BatchCalculator = {
  MAX_ROWS: 50,
  
  /**
   * Processes a batch of calculations.
   * Invalid rows are flagged but don't block valid ones.
   * @param {BatchRow[]} rows
   * @returns {BatchResult[]}
   */
  process(rows) {},
  
  /**
   * Exports batch results in the specified format.
   * @param {BatchResult[]} results
   * @param {'csv' | 'json'} format
   * @returns {string} - File content
   */
  export(results, format) {}
};
```

#### ImportExportManager (`js/features/import-export.js`)

```javascript
const ImportExportManager = {
  /**
   * Parses an imported file (CSV or JSON) and validates dates.
   * @param {string} content - File content
   * @param {'csv' | 'json'} format
   * @param {string} [dateFormat] - User-specified format for ambiguous dates
   * @returns {ImportResult}
   */
  parse(content, format, dateFormat) {},
  
  /**
   * Exports calculation results to a downloadable file.
   * @param {ExportData} data
   * @param {'csv' | 'json' | 'pdf'} format
   * @returns {Blob}
   */
  export(data, format) {},
  
  /**
   * Validates imported data and returns preview with error indicators.
   * @param {ImportResult} parsed
   * @returns {ImportPreview}
   */
  preview(parsed) {}
};
```

#### VisualTimeline (`js/features/visual-timeline.js`)

```javascript
const VisualTimeline = {
  /**
   * Renders a timeline on a canvas element.
   * @param {HTMLCanvasElement} canvas
   * @param {TimelineRange[]} ranges
   * @param {TimelineConfig} config
   */
  render(canvas, ranges, config) {},
  
  /**
   * Handles zoom in/out. Min: 1 day granularity, Max: 100 years span.
   * @param {number} delta - Positive zooms in, negative zooms out
   */
  zoom(delta) {},
  
  /**
   * Handles panning via drag.
   * @param {number} offsetDays
   */
  pan(offsetDays) {},
  
  /**
   * Returns the date at a given pixel position.
   * @param {number} x
   * @returns {{year, month, day}}
   */
  getDateAtPosition(x) {}
};
```

#### CalendarHeatmap (`js/features/calendar-heatmap.js`)

```javascript
const CalendarHeatmap = {
  /**
   * Renders a year-view heatmap grid.
   * @param {HTMLElement} container
   * @param {number} year
   * @param {Map<string, number>} frequencyData - "YYYY-MM-DD" → count
   */
  render(container, year, frequencyData) {},
  
  /**
   * Returns the number of cells (days) for a given year.
   * @param {number} year
   * @returns {number} - 365 or 366
   */
  getCellCount(year) {},
  
  /**
   * Navigates to a different year.
   * @param {'prev' | 'next'} direction
   */
  navigate(direction) {}
};
```

---

## Data Models

### Core Types

```javascript
/**
 * @typedef {Object} DateResult
 * @property {boolean} success
 * @property {{year: number, month: number, day: number}} [date]
 * @property {string} [error]
 */

/**
 * @typedef {Object} DurationResult
 * @property {number} totalDays
 * @property {number} totalHours
 * @property {number} totalMinutes
 * @property {number} totalSeconds
 * @property {{years: number, months: number, weeks: number, days: number}} breakdown
 * @property {boolean} reversed - True if start > end
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} id - UUID
 * @property {string} type - Calculator type identifier
 * @property {Object} inputs - Raw input values
 * @property {Object} outputs - Computed results
 * @property {number} timestamp - Unix timestamp ms
 * @property {string[]} tags - User-defined tags
 */

/**
 * @typedef {Object} CountdownEntry
 * @property {string} id - UUID
 * @property {string} label - User-defined label
 * @property {number} targetTimestamp - Target datetime as Unix ms
 * @property {number} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} Suggestion
 * @property {string} id
 * @property {{year: number, month: number, day: number}} date
 * @property {string} label - Human-readable reason
 * @property {number} priority - Ranking score (higher = more relevant)
 * @property {'frequent' | 'recent' | 'common' | 'pattern'} source
 */

/**
 * @typedef {Object} BatchRow
 * @property {string} id
 * @property {string} calculationType - e.g., "duration", "arithmetic", "business-days"
 * @property {Object} inputs
 * @property {number} order
 */

/**
 * @typedef {Object} BatchResult
 * @property {string} rowId
 * @property {boolean} success
 * @property {Object} [result]
 * @property {string} [error]
 */

/**
 * @typedef {Object} TimelineRange
 * @property {{year, month, day}} start
 * @property {{year, month, day}} end
 * @property {string} label
 * @property {string} color
 */

/**
 * @typedef {Object} ConversionResult
 * @property {{hours: number, minutes: number, seconds: number}} convertedTime
 * @property {{year: number, month: number, day: number}} convertedDate
 * @property {boolean} crossesDST
 * @property {string} [dstNote]
 * @property {number} offsetHours
 */

/**
 * @typedef {Object} CalculationParams
 * @property {string} type - Calculator type
 * @property {Object} inputs - All input values
 * @property {Object} [options] - Calculator-specific options
 */

/**
 * @typedef {Object} HolidayEntry
 * @property {string} date - "YYYY-MM-DD"
 * @property {string} name - Holiday name
 * @property {boolean} isRecurring
 */

/**
 * @typedef {Object} RecurringHoliday
 * @property {number} month - 1-12
 * @property {number} day - 1-31
 * @property {string} name
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success
 * @property {Array<{row: number, data: Object, errors: string[]}>} rows
 * @property {string[]} headers
 * @property {number} totalRows
 * @property {number} validRows
 * @property {number} errorRows
 */
```

### LocalStorage Schema

```javascript
// Keys and their value schemas:
const STORAGE_SCHEMA = {
  'date-calc-theme': 'light | dark',                    // Theme preference
  'date-calc-history': 'HistoryEntry[]',                // Up to 500 entries
  'date-calc-suggestions': '{dismissed: string[], frequencies: Object}',
  'date-calc-countdowns': 'CountdownEntry[]',           // Active countdowns
  'date-calc-holidays': '{custom: RecurringHoliday[], country: string}',
  'date-calc-preferences': '{dateFormat: string, locale: string}'
};
```

---

## Page Initialization Flow

Each HTML page follows this initialization sequence:

```javascript
// app.js - Common initialization for every page
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize theme (prevents flash of unstyled content)
  ThemeManager.init();
  
  // 2. Initialize navigation
  Navigation.init();
  
  // 3. Register keyboard shortcuts
  KeyboardShortcutManager.init();
  
  // 4. Initialize page-specific calculator
  const pageModule = getPageModule();
  if (pageModule) pageModule.init();
  
  // 5. Initialize shared features (lazy-loaded)
  requestIdleCallback(() => {
    SmartSuggestionEngine.init();
    HistoryManager.init();
  });
  
  // 6. Trigger entrance animations
  AnimationManager.triggerPageLoad();
});
```

---

## Service Worker Strategy

```javascript
// sw.js - Cache-first with network fallback
const CACHE_NAME = 'date-calc-v1';
const STATIC_ASSETS = [
  '/', '/duration.html', '/weekday.html', '/arithmetic.html',
  '/business-days.html', '/week-number.html', '/countdown.html',
  '/timezone.html', '/batch.html',
  '/css/variables.css', '/css/base.css', '/css/components.css',
  '/css/glassmorphism.css', '/css/animations.css',
  '/css/navigation.css', '/css/responsive.css',
  // ... all JS files
];

// Install: pre-cache all static assets
// Fetch: cache-first for static, network-first for dynamic
// Activate: clean old caches
```

---

## CSS Architecture

### Design Tokens (`css/variables.css`)

```css
:root {
  /* Colors - Light Theme */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-secondary: #ec4899;
  --color-accent: #06b6d4;
  --color-bg-primary: #f8fafc;
  --color-bg-secondary: #ffffff;
  --color-text-primary: #1e293b;
  --color-text-secondary: #64748b;
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.3);
  --glass-blur: 20px;
  
  /* Neumorphism */
  --shadow-neu-light: 6px 6px 12px rgba(0, 0, 0, 0.08), -6px -6px 12px rgba(255, 255, 255, 0.9);
  --shadow-neu-dark: 6px 6px 12px rgba(0, 0, 0, 0.3), -6px -6px 12px rgba(50, 50, 50, 0.2);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #6366f1, #ec4899);
  --gradient-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Breakpoints (used in media queries) */
  /* --bp-mobile: 768px, --bp-tablet: 1024px, --bp-desktop: 1280px */
}

[data-theme="dark"] {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --glass-bg: rgba(30, 41, 59, 0.7);
  --glass-border: rgba(100, 116, 139, 0.2);
}
```

### Glassmorphism Card Pattern

```css
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: var(--space-6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

### Neumorphism Input Pattern

```css
.input-field {
  background: var(--color-bg-primary);
  border: none;
  border-radius: 12px;
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-neu-light);
  transition: box-shadow var(--transition-normal);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  min-height: 44px;
  min-width: 44px;
}

.input-field:focus {
  outline: none;
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.06),
              inset -4px -4px 8px rgba(255, 255, 255, 0.8);
}
```

---

## Error Handling Strategy

### Input Validation

All calculator inputs pass through `validators.js` before computation:

```javascript
const Validators = {
  /**
   * Validates a date input and returns structured error if invalid.
   * @param {string} input
   * @param {string} fieldName
   * @returns {{valid: boolean, date?: Object, error?: string}}
   */
  validateDateInput(input, fieldName) {},
  
  /**
   * Validates a numeric input (for day counts, offsets, etc.).
   * @param {string} input
   * @param {{min?: number, max?: number, integer?: boolean}} constraints
   * @returns {{valid: boolean, value?: number, error?: string}}
   */
  validateNumericInput(input, constraints) {},
  
  /**
   * Validates a date is within the supported range (0001-01-01 to 9999-12-31).
   * @param {{year, month, day}} date
   * @returns {{valid: boolean, error?: string}}
   */
  validateDateRange(date) {}
};
```

### Error Display Pattern

Errors are shown inline beneath the corresponding input field with:
- Red border highlight on the input
- Descriptive error message with the specific validation failure
- Smooth fade-in animation
- Auto-dismiss after the user corrects the input

### Graceful Degradation

- If `backdrop-filter` is unsupported, cards fall back to solid backgrounds with opacity
- If `localStorage` is unavailable, features degrade to session-only storage
- If service worker registration fails, the site continues to function without offline support

---

## Performance Optimization

### Bundle Size Strategy (Target: <500KB)

| Asset Category | Budget |
|---------------|--------|
| HTML (all pages) | ~80KB |
| CSS (all sheets) | ~60KB |
| JS Core Engine | ~80KB |
| JS Calculators | ~100KB |
| JS UI Layer | ~50KB |
| JS Features | ~100KB |
| Fonts (subset) | ~30KB |
| **Total** | **~500KB** |

### Performance Techniques

1. **No external dependencies** — eliminates overhead of framework runtime
2. **Lazy-loaded features** — timeline, heatmap, and batch loaded on demand
3. **CSS containment** — `contain: layout style` on calculator cards
4. **RequestIdleCallback** — non-critical initialization deferred
5. **Event delegation** — single listener per page section
6. **Efficient DOM updates** — direct property manipulation instead of innerHTML
7. **Font subsetting** — only Latin characters and numerals loaded initially

### Calculation Performance (Target: <100ms)

All core calculations use O(1) or O(n) algorithms:
- Day-of-week: Zeller's congruence — O(1)
- Duration: Direct arithmetic — O(1)
- Business days: Linear scan with early termination — O(n) where n = days in range
- Week number: ISO algorithm — O(1)
- Timezone conversion: Offset lookup — O(1)

---

## Accessibility

- All interactive elements have `aria-label` or `aria-labelledby`
- Focus management for keyboard navigation
- `role="alert"` for calculation results and error messages
- Color contrast ratio ≥ 4.5:1 in both themes (verified per WCAG 2.1 AA)
- Touch targets minimum 44×44px on mobile
- `prefers-reduced-motion` media query respected for animations

---

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| ≤ 480px | Single column, stacked inputs, hamburger nav |
| 481–768px | Single column, wider inputs, hamburger nav |
| 769–1024px | Two-column calculator layouts, expanded nav |
| 1025–1280px | Full desktop layout with sidebar features |
| ≥ 1281px | Maximum content width (1200px) centered |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Date Parsing Round-Trip

*For any* valid date within the supported range (0001-01-01 to 9999-12-31), formatting that date into any supported format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD) and then parsing it back with the corresponding format hint SHALL produce the original date.

**Validates: Requirements 3.2**

### Property 2: Day-of-Week Correctness

*For any* valid date within the supported range, the Day_Of_Week_Calculator SHALL return a day-of-week value (0-6) that matches the result of a reference implementation (Zeller's congruence or equivalent verified algorithm).

**Validates: Requirements 3.1**

### Property 3: Day-of-Year Invariant

*For any* valid date, the computed day-of-year number plus the computed days-remaining-in-year SHALL equal the total number of days in that year (365 or 366).

**Validates: Requirements 3.5**

### Property 4: Invalid Date Rejection

*For any* string representing an invalid date (e.g., month > 12, day > days-in-month, February 29 in non-leap year), the date parser SHALL return an error result with `success: false` and a non-empty error message.

**Validates: Requirements 3.4**

### Property 5: Duration Symmetry

*For any* two valid dates A and B, the absolute duration between A and B SHALL equal the absolute duration between B and A.

**Validates: Requirements 4.6**

### Property 6: Duration Include-End-Date Relationship

*For any* two valid dates where start ≤ end, computing the duration with `includeEndDate=true` SHALL produce a totalDays value exactly one greater than computing with `includeEndDate=false`.

**Validates: Requirements 4.3, 4.4**

### Property 7: Duration Breakdown Reconstruction

*For any* two valid dates, adding the breakdown components (years, months, days) from the Duration_Calculator result to the start date SHALL produce the end date.

**Validates: Requirements 4.5**

### Property 8: Weekday Count Correctness

*For any* date range and target weekday, the count returned by the Weekday_Calculator SHALL equal the number of dates in that range whose actual day-of-week matches the target.

**Validates: Requirements 5.1**

### Property 9: Multi-Weekday Count Additivity

*For any* date range and any set of distinct weekdays, the count returned by selecting all weekdays simultaneously SHALL equal the sum of counts when each weekday is selected individually.

**Validates: Requirements 5.2**

### Property 10: Nth Weekday Validity

*For any* valid month, year, weekday, and N where the Nth occurrence exists, the returned date SHALL (a) fall within that month, (b) have the correct day-of-week, and (c) be preceded by exactly N-1 occurrences of that weekday in the same month.

**Validates: Requirements 5.3**

### Property 11: Date Arithmetic Round-Trip

*For any* valid date and any integer N (within reasonable bounds), adding N days and then subtracting N days SHALL return the original date.

**Validates: Requirements 6.1**

### Property 12: Week-Day Unit Equivalence

*For any* valid date, adding 1 week SHALL produce the same result as adding 7 days.

**Validates: Requirements 6.2**

### Property 13: Month Addition Produces Valid Dates

*For any* valid date and any integer month offset, the result of adding that many months SHALL always be a valid date where the day is less than or equal to the last day of the resulting month.

**Validates: Requirements 6.3**

### Property 14: Chained Operations Equivalence

*For any* valid date and sequence of arithmetic operations, applying them as a single chained operation SHALL produce the same result as applying each operation sequentially to the intermediate result.

**Validates: Requirements 6.4**

### Property 15: Business Days Partition

*For any* date range, the number of business days plus the number of weekend days plus the number of holidays (that fall on weekdays) SHALL equal the total calendar days in the range.

**Validates: Requirements 7.1**

### Property 16: Holiday Exclusion Monotonicity

*For any* date range, the business day count with a set of holidays SHALL be less than or equal to the business day count without holidays.

**Validates: Requirements 7.2**

### Property 17: Business Day Add Round-Trip

*For any* start date and positive integer N, computing the end date by adding N business days and then counting business days from start to that end date SHALL return N.

**Validates: Requirements 7.3**

### Property 18: ISO Week Number Correctness

*For any* valid date, the ISO week number and ISO year returned SHALL be correct such that the date falls within the 7-day span of that ISO week (Monday through Sunday).

**Validates: Requirements 8.1, 8.2**

### Property 19: ISO Week Date Range Span

*For any* valid ISO year and week number, the start and end dates returned SHALL span exactly 7 consecutive days (end - start = 6 days), and both dates SHALL have the correct ISO week number.

**Validates: Requirements 8.4**

### Property 20: Countdown Time Decomposition

*For any* target timestamp and current timestamp where target > current, the displayed countdown components (days, hours, minutes, seconds) SHALL satisfy: days×86400 + hours×3600 + minutes×60 + seconds = total seconds remaining (within 1-second tolerance).

**Validates: Requirements 9.1**

### Property 21: Countdown Persistence Round-Trip

*For any* valid countdown entry (with id, label, and target timestamp), serializing to localStorage and deserializing SHALL produce an entry with identical id, label, and target timestamp.

**Validates: Requirements 9.3**

### Property 22: Timezone Conversion Round-Trip

*For any* valid time, date, and pair of IANA timezones (source, target), converting from source to target and then back to source SHALL produce the original time (accounting for date boundary crossings).

**Validates: Requirements 10.1**

### Property 23: Timezone Search Completeness

*For any* IANA timezone entry and any substring (≥2 characters) of its city name, country, or abbreviation, that timezone SHALL appear in the search/autocomplete results.

**Validates: Requirements 10.5**

### Property 24: Suggestion Count Limit

*For any* calculation history state and any partial input string, the Smart_Suggestion_Engine SHALL return at most 5 suggestions.

**Validates: Requirements 11.1**

### Property 25: Suggestion Dismissal Priority Reduction

*For any* suggestion that appears in the suggestion list, dismissing it SHALL result in a lower or equal priority score for that suggestion in the next invocation with the same context.

**Validates: Requirements 11.6**

### Property 26: Share URL Round-Trip

*For any* valid calculation parameters (type, inputs, options), encoding them into a share URL and then decoding that URL SHALL produce parameters identical to the original.

**Validates: Requirements 12.3, 12.4**

### Property 27: History Entry Completeness

*For any* completed calculation, the automatically recorded history entry SHALL contain non-null values for: id, type, inputs, outputs, and timestamp.

**Validates: Requirements 20.1**

### Property 28: History Capacity Invariant

*For any* sequence of calculation additions to the history, the total number of stored entries SHALL never exceed 500.

**Validates: Requirements 20.2, 20.6**

### Property 29: History Chronological Order

*For any* history state with 2 or more entries, when retrieved, the entries SHALL be ordered such that each entry's timestamp is greater than or equal to the next entry's timestamp (descending order).

**Validates: Requirements 20.3**

### Property 30: History Deletion Removes Entry

*For any* existing history entry, after deleting it by ID, querying history SHALL not return an entry with that ID.

**Validates: Requirements 12.6**

### Property 31: Batch Calculation Consistency

*For any* batch of valid calculation rows, each individual result in the batch SHALL be identical to the result produced by running that same calculation through the individual calculator.

**Validates: Requirements 16.3**

### Property 32: Batch Partial Failure Independence

*For any* batch containing a mix of valid and invalid rows, all valid rows SHALL produce correct results regardless of the presence of invalid rows in the same batch.

**Validates: Requirements 16.6**

### Property 33: Import/Export Round-Trip

*For any* set of calculation results, exporting to CSV or JSON format and then re-importing that file SHALL produce data equivalent to the original results.

**Validates: Requirements 16.4, 17.4**

### Property 34: Calendar Heatmap Cell Count

*For any* year displayed in the Calendar_Heatmap, the total number of rendered day cells SHALL equal the number of days in that year (365 for common years, 366 for leap years).

**Validates: Requirements 14.1**

### Property 35: Theme Persistence Round-Trip

*For any* theme choice (light or dark), persisting the preference to localStorage and reading it back SHALL return the same theme value.

**Validates: Requirements 19.2**

### Property 36: Contrast Ratio Compliance

*For all* text-background color pairs defined in both the light and dark theme, the computed contrast ratio SHALL be at least 4.5:1 per WCAG 2.1 AA guidelines.

**Validates: Requirements 19.4**

### Property 37: Keyboard Shortcut No Browser Conflicts

*For all* registered keyboard shortcuts in the Keyboard_Shortcut_Manager, none SHALL match any combination in the known set of browser-native shortcuts.

**Validates: Requirements 18.6**

### Property 38: History Restoration Fidelity

*For any* history entry, when the user restores it, the populated calculator inputs SHALL exactly match the inputs stored in that history entry, and recomputing SHALL produce the same outputs.

**Validates: Requirements 20.4**

---

## Testing Strategy

### Unit Tests

Focus on specific examples and edge cases:
- Leap year edge cases (Feb 29, century years, 400-year rule)
- Month-end overflow scenarios (Jan 31 + 1 month = Feb 28/29)
- Year boundary ISO week calculations (Dec 31 can be week 1 of next year)
- Timezone DST boundary conversions
- Empty/whitespace input validation
- Maximum capacity boundary (500 history entries, 50 batch rows)

### Property-Based Tests

Each property above should be implemented with:
- Minimum 100 random iterations per property
- Custom generators for valid dates (respecting range 0001-9999)
- Custom generators for date format strings
- Shrinking strategies for readable failure reports

### Integration Tests

- Service worker caching and offline functionality
- Cross-browser rendering consistency
- Lighthouse performance and accessibility audits
- Responsive layout at all breakpoints

---

## Security Considerations

- **No server communication** — eliminates network attack surface
- **No eval() or dynamic code execution** — prevents XSS in shared URLs
- **URL parameter sanitization** — all decoded share parameters validated before use
- **Content Security Policy** — strict CSP headers recommended for deployment
- **LocalStorage bounds** — capped at 500 entries to prevent storage abuse
- **Import file validation** — strict parsing with size limits (max 1MB per import file)

---

## Deployment

The site is fully static and can be deployed to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- CloudFlare Pages
- Any web server serving static files

No build step required — files are served as-is. For production optimization:
- Minify CSS/JS files
- Compress with gzip/brotli
- Set appropriate cache headers
- Ensure HTTPS for service worker support
