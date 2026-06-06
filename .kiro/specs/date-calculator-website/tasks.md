# Implementation Plan: Date Calculator Website

## Overview

Build a premium, multi-page date calculator website using vanilla HTML, CSS, and JavaScript that matches and surpasses timeanddate.com. The implementation follows a bottom-up approach: core engine first, then UI layer, then calculator pages, then premium features, and finally service worker and offline support. All 22 requirements are covered with full feature parity to timeanddate.com plus AI suggestions, visual timelines, heatmaps, batch operations, and an improved glassmorphism/neumorphism UI.

## Tasks

- [ ] 1. Set up project structure and CSS design system
  - [ ] 1.1 Create project directory structure and HTML boilerplate for all pages
    - Create all HTML files: index.html, duration.html, weekday.html, arithmetic.html, business-days.html, week-number.html, countdown.html, timezone.html, batch.html
    - Create directory structure: css/, css/themes/, js/core/, js/ui/, js/calculators/, js/features/, assets/fonts/, assets/icons/
    - Each HTML page includes shared CSS imports, navigation placeholder, and page-specific script references
    - Create manifest.json for PWA support
    - _Requirements: 1.1, 21.1, 22.3_

  - [ ] 1.2 Implement CSS design tokens and variables
    - Create css/variables.css with all CSS custom properties (colors, spacing, typography, gradients, glassmorphism values, neumorphism shadows, transitions)
    - Define light theme as default in :root
    - Define dark theme overrides in [data-theme="dark"] selector
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 19.1, 19.4, 19.5_

  - [ ] 1.3 Implement base styles and component CSS
    - Create css/base.css with reset, typography scale, and base element styles
    - Create css/components.css with shared card, input-field, button, and form styles
    - Create css/glassmorphism.css with .card glassmorphism pattern (translucent bg, backdrop-filter, subtle borders)
    - Create css/animations.css with keyframe definitions for fade-in, slide-up, staggered entrance, and hover transitions
    - Create css/navigation.css for navbar and mobile drawer styles
    - Create css/responsive.css with breakpoints at 480px, 768px, 1024px, 1280px
    - Create css/themes/light.css and css/themes/dark.css
    - Ensure all interactive elements have min 44x44px touch targets
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 21.1, 21.3, 21.5_

- [ ] 2. Implement core date engine
  - [ ] 2.1 Implement date parser and validators
    - Create js/core/date-parser.js with parseDate(), formatDate(), validateDate() functions
    - Support MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD formats with preferredFormat hint
    - Create js/core/validators.js with validateDateInput(), validateNumericInput(), validateDateRange()
    - Support date range 0001-01-01 to 9999-12-31
    - Handle leap year logic: divisible by 4, except centuries unless divisible by 400
    - _Requirements: 3.2, 3.3, 3.4, 4.1_

  - [ ]* 2.2 Write property tests for date parsing
    - **Property 1: Date Parsing Round-Trip** — For any valid date, formatting and reparsing produces the original
    - **Property 4: Invalid Date Rejection** — Invalid dates return error with success: false
    - **Validates: Requirements 3.2, 3.4**

  - [ ] 2.3 Implement core date calculation functions
    - Create js/core/date-calc.js with getDayOfWeek() using Zeller's congruence
    - Implement calculateDuration() for total days + breakdown (years, months, weeks, days, hours, minutes, seconds)
    - Implement addToDate() with month-end overflow capping
    - Implement countWeekdays() for weekday occurrences in range
    - Implement findNthWeekday() for Nth weekday in a month
    - Implement countBusinessDays() and addBusinessDays() with holiday set support
    - Implement getISOWeekNumber(), getDayOfYear(), getDaysInYear()
    - _Requirements: 3.1, 3.5, 4.1, 4.2, 4.5, 5.1, 5.3, 6.1, 6.2, 6.3, 7.1, 7.3, 8.1, 8.2_

  - [ ]* 2.4 Write property tests for date calculations
    - **Property 2: Day-of-Week Correctness** — getDayOfWeek matches Zeller's reference
    - **Property 3: Day-of-Year Invariant** — dayOfYear + daysRemaining = daysInYear
    - **Property 5: Duration Symmetry** — |A-B| = |B-A|
    - **Property 6: Duration Include-End-Date Relationship** — includeEnd adds exactly 1 day
    - **Property 7: Duration Breakdown Reconstruction** — adding breakdown to start = end
    - **Property 8: Weekday Count Correctness** — count matches direct enumeration
    - **Property 9: Multi-Weekday Count Additivity** — combined count = sum of individuals
    - **Property 10: Nth Weekday Validity** — result in correct month with correct day-of-week
    - **Property 11: Date Arithmetic Round-Trip** — add N days then subtract N = original
    - **Property 12: Week-Day Unit Equivalence** — 1 week = 7 days
    - **Property 13: Month Addition Produces Valid Dates** — result always valid
    - **Property 14: Chained Operations Equivalence** — chained = sequential
    - **Property 15: Business Days Partition** — biz + weekend + holidays = total
    - **Property 16: Holiday Exclusion Monotonicity** — more holidays ≤ fewer biz days
    - **Property 17: Business Day Add Round-Trip** — add N biz days then count back = N
    - **Property 18: ISO Week Number Correctness** — date within 7-day week span
    - **Property 19: ISO Week Date Range Span** — week spans exactly 7 days
    - **Validates: Requirements 3.1, 3.5, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.4**

  - [ ] 2.5 Implement timezone database and holiday database
    - Create js/core/timezone-db.js with convertTimezone(), searchTimezones(), getDSTStatus()
    - Include IANA timezone entries with UTC offsets and DST rules
    - Create js/core/holiday-db.js with getHolidays() for 10+ countries and expandRecurringHolidays()
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.7, 7.4, 7.5_

  - [ ]* 2.6 Write property tests for timezone and suggestions
    - **Property 22: Timezone Conversion Round-Trip** — convert source→target→source = original
    - **Property 23: Timezone Search Completeness** — substring search finds matching entry
    - **Validates: Requirements 10.1, 10.5**

- [ ] 3. Checkpoint - Core engine validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement UI layer
  - [ ] 4.1 Implement theme manager
    - Create js/ui/theme-manager.js with init(), toggle(), apply(), getCurrent()
    - Detect OS preference via prefers-color-scheme media query on first visit
    - Persist choice in localStorage under 'date-calc-theme' key
    - Apply smooth CSS transition on toggle (within 300ms)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 4.2 Write property test for theme persistence
    - **Property 35: Theme Persistence Round-Trip** — persist and read back produces same value
    - **Validates: Requirements 19.2**

  - [ ] 4.3 Implement navigation component
    - Create js/ui/navigation.js with init(), setActive(), toggleMobileDrawer(), closeMobileDrawer()
    - Fixed top navbar with links to all 9 calculator pages with active-state indicators
    - Hamburger menu with slide-out drawer for viewports < 768px
    - Close drawer on outside click or navigation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.4 Implement keyboard shortcuts and animation manager
    - Create js/ui/keyboard-shortcuts.js with register(), getAll(), hasConflict()
    - Register Alt+1 through Alt+8 for page navigation, Ctrl+Enter for calculate, shortcut for dark mode toggle
    - "?" key (no input focused) shows shortcut overlay
    - Check against BROWSER_CONFLICTS set to avoid collisions
    - Create js/ui/animation-manager.js for staggered page-load animations and scroll-triggered effects
    - Create js/ui/toast.js for notification toasts
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 2.3, 2.6_

  - [ ]* 4.5 Write property tests for keyboard shortcuts and theme contrast
    - **Property 37: Keyboard Shortcut No Browser Conflicts** — no registered shortcut matches browser defaults
    - **Property 36: Contrast Ratio Compliance** — all text-bg pairs ≥ 4.5:1
    - **Validates: Requirements 18.6, 19.4**

  - [ ] 4.6 Implement app initialization entry point
    - Create js/app.js with DOMContentLoaded listener
    - Initialize ThemeManager, Navigation, KeyboardShortcutManager in sequence
    - Detect current page and initialize page-specific calculator module
    - Lazy-load SmartSuggestionEngine and HistoryManager via requestIdleCallback
    - Trigger entrance animations
    - _Requirements: 2.6, 22.4, 22.5_

- [ ] 5. Implement calculator pages
  - [ ] 5.1 Implement Day-of-Week calculator page
    - Create js/calculators/day-of-week.js with init() and calculate()
    - Accept multi-format date input, display day of week result
    - Show day number within year and days remaining in year
    - Display descriptive error messages for invalid dates
    - Wire up UI in index.html with glassmorphism card layout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 5.2 Implement Duration calculator page
    - Create js/calculators/duration.js with init() and calculate()
    - Accept two date inputs with include/exclude end date toggle
    - Display total days, breakdown (years, months, weeks, days), and hours/minutes/seconds
    - Handle reversed dates with note
    - Wire up UI in duration.html
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 5.3 Implement Weekday calculator page
    - Create js/calculators/weekday.js with init(), countMode(), nthMode()
    - Support selecting multiple weekdays for counting
    - Find Nth weekday of a month/year with "does not exist" message
    - Display results in numerical and calendar-view formats
    - Wire up UI in weekday.html
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.4 Implement Date Arithmetic calculator page
    - Create js/calculators/arithmetic.js with init() and calculate()
    - Support add/subtract days, weeks, months, years independently or combined
    - Handle month-end overflow, show result date and day of week
    - Support chaining multiple operations and business-day toggle
    - Wire up UI in arithmetic.html
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 5.5 Implement Business Day calculator page
    - Create js/calculators/business-days.js with init(), countBetween(), addDays()
    - Support holiday configuration with preset calendars for 10+ countries
    - Support custom recurring holidays
    - Calculate business days between dates or find date after N business days
    - Wire up UI in business-days.html
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 5.6 Implement Week Number calculator page
    - Create js/calculators/week-number.js with init() and calculate()
    - Display ISO week number and associated ISO year
    - Full-year week calendar view with all 52/53 weeks mapped to dates
    - Select week to see start/end dates, highlight current week
    - Wire up UI in week-number.html
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 5.7 Implement Countdown Timer page
    - Create js/calculators/countdown.js with init(), createCountdown(), updateDisplay()
    - Live countdown updating every second (days, hours, minutes, seconds)
    - Multiple simultaneous countdowns with custom labels
    - Persist countdowns in localStorage, celebration animation at zero
    - Update browser tab title with active countdown
    - Handle past dates with "time since" label
    - Wire up UI in countdown.html
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 5.8 Write property tests for countdown
    - **Property 20: Countdown Time Decomposition** — days×86400 + hours×3600 + minutes×60 + seconds = total remaining
    - **Property 21: Countdown Persistence Round-Trip** — serialize/deserialize preserves id, label, target
    - **Validates: Requirements 9.1, 9.3**

  - [ ] 5.9 Implement Time Zone Converter page
    - Create js/calculators/timezone.js with init() and convert()
    - Support all IANA timezones with autocomplete search
    - Simultaneous conversion to multiple target zones
    - Display DST status and notes when crossing DST boundary
    - World map visualization highlighting selected zones (simplified SVG)
    - Wire up UI in timezone.html
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 6. Checkpoint - Calculator pages validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement premium features layer
  - [ ] 7.1 Implement calculation history manager
    - Create js/features/history-manager.js with add(), getAll(), search(), delete(), clear(), getCount()
    - Auto-record calculation type, inputs, outputs, and timestamp on every calculation
    - Store up to 500 entries in localStorage, FIFO eviction
    - Support filtering by type, reverse chronological order
    - Support tags/labels, deletion (individual and bulk by tag)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 12.1, 12.2, 12.5, 12.6_

  - [ ]* 7.2 Write property tests for history manager
    - **Property 27: History Entry Completeness** — all entries have non-null id, type, inputs, outputs, timestamp
    - **Property 28: History Capacity Invariant** — never exceeds 500 entries
    - **Property 29: History Chronological Order** — entries sorted descending by timestamp
    - **Property 30: History Deletion Removes Entry** — deleted ID not found on query
    - **Property 38: History Restoration Fidelity** — restored inputs match stored, recompute matches outputs
    - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 12.6**

  - [ ] 7.3 Implement smart suggestion engine
    - Create js/features/smart-suggestions.js with getSuggestions(), dismiss(), getCommonDates(), analyzeFrequency()
    - Generate up to 5 suggestions from history patterns, frequency, and common upcoming dates
    - Store suggestion data in localStorage only (no external server)
    - Reduce priority of dismissed suggestions
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 7.4 Write property tests for suggestions
    - **Property 24: Suggestion Count Limit** — always ≤ 5 suggestions returned
    - **Property 25: Suggestion Dismissal Priority Reduction** — dismissed suggestion priority decreases
    - **Validates: Requirements 11.1, 11.6**

  - [ ] 7.5 Implement share manager
    - Create js/features/share-manager.js with encode(), decode(), copyToClipboard()
    - Encode calculation params into URL query string
    - On shared link load, reconstruct and display original calculation
    - Copy to clipboard with toast notification
    - _Requirements: 12.3, 12.4_

  - [ ]* 7.6 Write property test for share URL
    - **Property 26: Share URL Round-Trip** — encode then decode produces identical params
    - **Validates: Requirements 12.3, 12.4**

  - [ ] 7.7 Implement visual timeline
    - Create js/features/visual-timeline.js with render(), zoom(), pan(), getDateAtPosition()
    - Canvas-based horizontal timeline with start/end/duration span
    - Zoom in/out (1 day to 100 years), drag-based panning
    - Tooltip on hover with exact date, click to populate calculator inputs
    - Support multiple overlapping ranges as stacked colored bars
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ] 7.8 Implement calendar heatmap
    - Create js/features/calendar-heatmap.js with render(), getCellCount(), navigate()
    - SVG year-view grid with day cells color-coded by calculation frequency
    - Hover tooltip with date and count, color legend
    - Year navigation (prev/next), click cell to show related calculations
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 7.9 Write property test for calendar heatmap
    - **Property 34: Calendar Heatmap Cell Count** — cells = days in year (365 or 366)
    - **Validates: Requirements 14.1**

  - [ ] 7.10 Implement drag-to-select date ranges
    - Create js/ui/drag-select.js with calendar drag selection
    - Highlight selected range with gradient overlay during drag
    - Show real-time day count during drag
    - Auto-scroll to next/previous month on boundary drag
    - Populate calculator date range inputs on completion
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 7.11 Implement batch calculator
    - Create js/features/batch-calculator.js with process() and export()
    - Create batch.html UI with multi-row input (up to 50 rows)
    - Support mixed calculation types in a single batch
    - Tabular results display, export as CSV or JSON
    - Duplicate, reorder, and remove rows before submission
    - Invalid rows flagged but don't block valid ones
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ]* 7.12 Write property tests for batch calculator
    - **Property 31: Batch Calculation Consistency** — batch result = individual result
    - **Property 32: Batch Partial Failure Independence** — valid rows unaffected by invalid rows
    - **Validates: Requirements 16.3, 16.6**

  - [ ] 7.13 Implement import/export manager
    - Create js/features/import-export.js with parse(), export(), preview()
    - Support CSV and JSON import with validation and error indicators
    - Preview imported data before confirming
    - Export to CSV, JSON, or PDF with column headers and metadata
    - Prompt user for date format on ambiguous imports
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [ ]* 7.14 Write property test for import/export
    - **Property 33: Import/Export Round-Trip** — export then re-import produces equivalent data
    - **Validates: Requirements 16.4, 17.4**

- [ ] 8. Checkpoint - Premium features validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Service worker, performance, and final integration
  - [ ] 9.1 Implement service worker for offline support
    - Create sw.js with cache-first strategy for static assets
    - Pre-cache all HTML, CSS, JS files on install
    - Network-first for dynamic content, cache-first for static
    - Clean old caches on activate
    - Register service worker from app.js
    - _Requirements: 22.1, 22.2, 22.3, 22.5_

  - [ ] 9.2 Performance optimization and bundle verification
    - Verify total bundle size stays under 500KB (HTML ~80KB, CSS ~60KB, JS ~330KB, fonts ~30KB)
    - Implement lazy-loading of non-critical features (heatmap, timeline) via dynamic import or deferred loading
    - Verify all calculations complete within 100ms
    - Ensure initial LCP under 2 seconds on 4G
    - Add CSS containment (contain: layout style) on calculator cards
    - Use event delegation for efficient DOM event handling
    - _Requirements: 21.4, 22.1, 22.3, 22.4, 22.5_

  - [ ] 9.3 Final integration wiring and cross-page consistency
    - Connect HistoryManager to all calculator pages (auto-record on calculate)
    - Connect SmartSuggestionEngine to all date input fields
    - Connect ShareManager "Share" button on all calculator result panels
    - Ensure keyboard shortcuts work across all pages
    - Verify responsive layouts at all breakpoints (320px to 3840px)
    - Verify dark/light mode works consistently across all pages
    - Test graceful degradation (no backdrop-filter, no localStorage, no SW)
    - _Requirements: 1.1, 11.1, 12.3, 18.1, 19.1, 21.1, 21.2, 21.3_

- [ ] 10. Final checkpoint - Full integration and acceptance
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate the 38 universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- The tech stack is vanilla HTML/CSS/JavaScript with zero external dependencies
- All calculations are client-side — no server required
- Total bundle budget: under 500KB uncompressed
- The implementation aims to match all timeanddate.com features while adding AI suggestions, visual timelines, calendar heatmaps, batch calculations, and a dramatically improved UI with glassmorphism/neumorphism aesthetics

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "2.5"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.6"] },
    { "id": 5, "tasks": ["2.4"] },
    { "id": 6, "tasks": ["4.1", "4.3", "4.4"] },
    { "id": 7, "tasks": ["4.2", "4.5", "4.6"] },
    { "id": 8, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.9"] },
    { "id": 9, "tasks": ["5.8"] },
    { "id": 10, "tasks": ["7.1", "7.3", "7.5", "7.7", "7.8", "7.10", "7.11", "7.13"] },
    { "id": 11, "tasks": ["7.2", "7.4", "7.6", "7.9", "7.12", "7.14"] },
    { "id": 12, "tasks": ["9.1", "9.2"] },
    { "id": 13, "tasks": ["9.3"] }
  ]
}
```
